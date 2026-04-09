"""MongoDB repository for user playlists."""

from __future__ import annotations

from typing import Any

from bson.objectid import ObjectId
from pymongo import ASCENDING, DESCENDING


class PlaylistRepository:
    def __init__(self, db: Any) -> None:
        self._collection = db.playlists
        self._collection.create_index(
            [("user_id", ASCENDING), ("created_at", DESCENDING)]
        )

    def create(self, document: dict[str, Any]) -> Any:
        return self._collection.insert_one(document)

    def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        cursor = self._collection.find({"user_id": user_id}).sort("created_at", DESCENDING)
        return list(cursor)

    def find_for_user(self, playlist_id: str, user_id: str) -> dict[str, Any] | None:
        return self._collection.find_one(
            {"_id": ObjectId(playlist_id), "user_id": user_id}
        )

    def add_song(self, playlist_id: str, user_id: str, song: dict[str, Any]) -> int:
        updated = self._collection.update_one(
            {"_id": ObjectId(playlist_id), "user_id": user_id},
            {"$push": {"songs": song}},
        )
        return updated.modified_count

    def remove_song(self, playlist_id: str, user_id: str, song_id: str) -> int:
        updated = self._collection.update_one(
            {"_id": ObjectId(playlist_id), "user_id": user_id},
            {"$pull": {"songs": {"id": song_id}}},
        )
        return updated.modified_count
