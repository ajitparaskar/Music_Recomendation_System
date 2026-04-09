"""MongoDB repository for payment records."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any


class PaymentRepository:
    def __init__(self, db: Any) -> None:
        self._collection = db.payments

    def create_pending(
        self,
        *,
        user_id: str,
        order_id: str,
        plan: str,
        amount: int,
    ) -> Any:
        now = datetime.now(UTC)
        return self._collection.insert_one(
            {
                "user_id": user_id,
                "order_id": order_id,
                "plan": plan,
                "amount": amount,
                "status": "created",
                "created_at": now,
                "updated_at": now,
            }
        )

    def mark_paid(
        self,
        *,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> int:
        updated = self._collection.update_one(
            {"order_id": order_id},
            {
                "$set": {
                    "payment_id": payment_id,
                    "signature": signature,
                    "status": "paid",
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return updated.modified_count

    def mark_failed(self, *, order_id: str, reason: str) -> int:
        updated = self._collection.update_one(
            {"order_id": order_id},
            {
                "$set": {
                    "status": "failed",
                    "failure_reason": reason,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return updated.modified_count

    def find_by_order_id(self, order_id: str) -> dict[str, Any] | None:
        return self._collection.find_one({"order_id": order_id})
