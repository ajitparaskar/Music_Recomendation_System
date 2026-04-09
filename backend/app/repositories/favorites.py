"""MongoDB repository for user favorites."""

from __future__ import annotations

from typing import Any

from bson.objectid import ObjectId


class FavoriteRepository:
    def __init__(self, db: Any) -> None:
        self._collection = db.favorites

    def find_existing(self, user_id: str, song_title: str, artist: str) -> dict[str, Any] | None:
        return self._collection.find_one(
            {
                "user_id": user_id,
                "song_title": song_title,
                "artist": artist,
            }
        )

    def create(
        self,
        user_id: str,
        song_title: str,
        artist: str,
        youtube_video_id: str | None,
    ) -> Any:
        return self._collection.insert_one(
            {
                "user_id": user_id,
                "song_title": song_title,
                "artist": artist,
                "youtube_video_id": youtube_video_id,
            }
        )

    def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        return list(self._collection.find({"user_id": user_id}))

    def delete_for_user(self, favorite_id: str, user_id: str) -> int:
        deleted = self._collection.delete_one(
            {"_id": ObjectId(favorite_id), "user_id": user_id}
        )
        return deleted.deleted_count
