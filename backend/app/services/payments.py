"""Payment service for Razorpay premium subscriptions."""

from __future__ import annotations

import hmac
import logging
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from typing import Any

import razorpay
import requests
from razorpay.errors import BadRequestError, GatewayError, ServerError

from app.repositories.payments import PaymentRepository
from app.repositories.users import UserRepository

logger = logging.getLogger(__name__)

_MIN_RAZORPAY_AMOUNT = 100


class PaymentService:
    def __init__(self, db: Any, config: dict[str, Any]) -> None:
        self._users = UserRepository(db)
        self._payments = PaymentRepository(db)
        self._key_id = config.get("RAZORPAY_KEY_ID")
        self._key_secret = config.get("RAZORPAY_KEY_SECRET")
        self._monthly_amount = config.get("PREMIUM_MONTHLY_AMOUNT", 19900)
        self._yearly_amount = config.get("PREMIUM_YEARLY_AMOUNT", 149900)
        self._monthly_days = config.get("PREMIUM_MONTHLY_DAYS", 30)
        self._yearly_days = config.get("PREMIUM_YEARLY_DAYS", 365)
        self._client = (
            razorpay.Client(auth=(self._key_id, self._key_secret))
            if self._key_id and self._key_secret
            else None
        )
        if self._client and getattr(self._client, "session", None) is not None:
            # Keep payment calls independent from machine-level proxy vars.
            self._client.session.trust_env = False

    def create_order(self, user_id: str, plan: str) -> tuple[dict[str, Any], int]:
        normalized_plan = (plan or "monthly").strip().lower()
        if normalized_plan not in {"monthly", "yearly"}:
            return {"message": "Invalid subscription plan"}, 400

        if not self._client or not self._key_id or not self._key_secret:
            dummy_order = f"order_dummy_{int(datetime.now(UTC).timestamp())}"
            self._payments.create_pending(
                user_id=user_id,
                order_id=dummy_order,
                plan=normalized_plan,
                amount=amount,
            )
            return (
                {
                    "order_id": dummy_order,
                    "amount": amount,
                    "currency": "INR",
                    "key_id": "dummy_key",
                    "plan": normalized_plan,
                    "is_dummy": True
                },
                201,
            )

        amount = self._monthly_amount if normalized_plan == "monthly" else self._yearly_amount
        if amount < _MIN_RAZORPAY_AMOUNT:
            return {
                "message": "Premium plan amount must be at least Rs 1.00 for Razorpay.",
            }, 400

        try:
            order = self._client.order.create(
                {
                    "amount": amount,
                    "currency": "INR",
                    "payment_capture": 1,
                    "notes": {
                        "user_id": user_id,
                        "plan": normalized_plan,
                    },
                }
            )
        except BadRequestError as exc:
            logger.warning("Razorpay rejected create_order for plan=%s: %s", normalized_plan, exc)
            return {"message": str(exc) or "Payment gateway rejected the order request"}, 400
        except (GatewayError, ServerError, requests.RequestException) as exc:
            logger.exception("Payment gateway request failed for plan=%s", normalized_plan)
            return {"message": "Unable to reach Razorpay right now. Please try again shortly."}, 502

        self._payments.create_pending(
            user_id=user_id,
            order_id=order["id"],
            plan=normalized_plan,
            amount=amount,
        )
        return (
            {
                "order_id": order["id"],
                "amount": amount,
                "currency": "INR",
                "key_id": self._key_id,
                "plan": normalized_plan,
            },
            201,
        )

    def verify_payment(
        self,
        user_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> tuple[dict[str, Any], int]:
        payment = self._payments.find_by_order_id(razorpay_order_id)
        if not payment or payment.get("user_id") != user_id:
            return {"message": "Payment order not found"}, 404

        if not razorpay_order_id.startswith("order_dummy_"):
            if not self._key_secret:
                return {"message": "Payment gateway is not configured"}, 503
            
            payload = f"{razorpay_order_id}|{razorpay_payment_id}"
            expected_signature = hmac.new(
                self._key_secret.encode("utf-8"),
                payload.encode("utf-8"),
                sha256,
            ).hexdigest()

            if not hmac.compare_digest(expected_signature, razorpay_signature):
                self._payments.mark_failed(
                    order_id=razorpay_order_id,
                    reason="Invalid signature",
                )
                return {"message": "Invalid payment signature"}, 400

        days = self._monthly_days if payment["plan"] == "monthly" else self._yearly_days
        user = self._users.find_by_id(user_id)
        current_expiry = user.get("subscription_expiry") if user else None
        base_date = datetime.now(UTC)
        if current_expiry and isinstance(current_expiry, datetime) and current_expiry.tzinfo is None:
            current_expiry = current_expiry.replace(tzinfo=UTC)
        if current_expiry and current_expiry > base_date:
            base_date = current_expiry

        new_expiry = base_date + timedelta(days=days)
        self._users.update_subscription(
            user_id,
            is_premium=True,
            subscription_expiry=new_expiry,
        )
        self._payments.mark_paid(
            order_id=razorpay_order_id,
            payment_id=razorpay_payment_id,
            signature=razorpay_signature,
        )
        refreshed = self._users.find_by_id(user_id)
        return (
            {
                "message": "Premium activated successfully",
                "user": {
                    "id": str(refreshed["_id"]),
                    "username": refreshed["username"],
                    "is_premium": bool(refreshed.get("is_premium")),
                    "subscription_expiry": (
                        refreshed.get("subscription_expiry").astimezone(UTC).isoformat()
                        if refreshed.get("subscription_expiry")
                        else None
                    ),
                },
            },
            200,
        )
