"""Authentication and favorites application service."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson.errors import InvalidId
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.repositories.favorites import FavoriteRepository
from app.repositories.users import UserRepository


class AuthService:
    def __init__(self, db: Any) -> None:
        self._users = UserRepository(db)
        self._favorites = FavoriteRepository(db)

    def register(self, username: str, password: str) -> tuple[dict[str, Any], int]:
        if self._users.find_by_username(username):
            return {"message": "User already exists"}, 400

        result = self._users.create(username, generate_password_hash(password))
        user = self._users.find_by_id(str(result.inserted_id))
        return {"message": "User registered successfully", "user": self._serialize_user(user)}, 201

    def login(self, username: str, password: str) -> tuple[dict[str, Any], int]:
        user = self._users.find_by_username(username)
        if not user or not check_password_hash(user["password_hash"], password):
            return {"message": "Invalid username or password"}, 401

        access_token = create_access_token(identity=str(user["_id"]))
        return {"access_token": access_token, "user": self._serialize_user(user)}, 200

    def get_user_profile(self, user_id: str) -> tuple[dict[str, Any], int]:
        user = self._users.find_by_id(user_id)
        if not user:
            return {"message": "User not found"}, 404
        return {"user": self._serialize_user(user)}, 200

    def add_favorite(
        self,
        user_id: str,
        song_title: str,
        artist: str,
        youtube_video_id: str | None,
    ) -> tuple[dict[str, Any], int]:
        if self._favorites.find_existing(user_id, song_title, artist):
            return {"message": "Song already in favorites"}, 400

        self._favorites.create(user_id, song_title, artist, youtube_video_id)
        return {"message": "Added to favorites successfully"}, 201

    def get_favorites(self, user_id: str) -> tuple[list[dict[str, Any]], int]:
        favorites = self._favorites.list_for_user(user_id)
        return (
            [
                {
                    "id": str(fav["_id"]),
                    "song_title": fav["song_title"],
                    "artist": fav["artist"],
                    "youtube_video_id": fav.get("youtube_video_id"),
                }
                for fav in favorites
            ],
            200,
        )

    def remove_favorite(self, favorite_id: str, user_id: str) -> tuple[dict[str, Any], int]:
        try:
            deleted_count = self._favorites.delete_for_user(favorite_id, user_id)
        except InvalidId:
            return {"message": "Invalid favorite ID format"}, 400

        if deleted_count == 0:
            return {"message": "Favorite not found or not yours"}, 404

        return {"message": "Favorite removed successfully"}, 200

    def _serialize_user(self, user: dict[str, Any] | None) -> dict[str, Any]:
        if not user:
            return {}

        expiry = user.get("subscription_expiry")
        if expiry and isinstance(expiry, datetime) and expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=UTC)

        is_premium = bool(user.get("is_premium"))
        if expiry and expiry < datetime.now(UTC):
            is_premium = False

        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "is_premium": is_premium,
            "subscription_expiry": expiry.astimezone(UTC).isoformat() if expiry else None,
        }
