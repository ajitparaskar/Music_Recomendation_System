"""MongoDB repository for user records."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson.objectid import ObjectId


class UserRepository:
    def __init__(self, db: Any) -> None:
        self._collection = db.users

    def find_by_username(self, username: str) -> dict[str, Any] | None:
        return self._collection.find_one({"username": username})

    def find_by_id(self, user_id: str) -> dict[str, Any] | None:
        return self._collection.find_one({"_id": ObjectId(user_id)})

    def create(self, username: str, password_hash: str) -> Any:
        return self._collection.insert_one(
            {
                "username": username,
                "password_hash": password_hash,
                "is_premium": False,
                "subscription_expiry": None,
                "created_at": datetime.now(timezone.utc),
            }
        )

    def update_subscription(
        self,
        user_id: str,
        *,
        is_premium: bool,
        subscription_expiry: datetime | None,
    ) -> int:
        updated = self._collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_premium": is_premium,
                    "subscription_expiry": subscription_expiry,
                }
            },
        )
        return updated.modified_count
