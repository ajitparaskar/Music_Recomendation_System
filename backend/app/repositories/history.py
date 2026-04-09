"""MongoDB repository for user listening history."""

from __future__ import annotations

from typing import Any

from pymongo import DESCENDING


class HistoryRepository:
    def __init__(self, db: Any) -> None:
        self._collection = db.history
        self._collection.create_index([("user_id", 1), ("played_at", DESCENDING)])

    def create(self, document: dict[str, Any]) -> Any:
        return self._collection.insert_one(document)

    def latest_for_user(self, user_id: str) -> dict[str, Any] | None:
        return self._collection.find_one({"user_id": user_id}, sort=[("played_at", DESCENDING)])

    def update_entry(self, entry_id: Any, updates: dict[str, Any]) -> int:
        updated = self._collection.update_one({"_id": entry_id}, {"$set": updates})
        return updated.modified_count

    def list_for_user(self, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
        cursor = (
            self._collection.find({"user_id": user_id})
            .sort("played_at", DESCENDING)
            .limit(limit)
        )
        return list(cursor)
