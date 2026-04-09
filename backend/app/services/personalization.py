"""Application service for history and playlists."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from bson.errors import InvalidId

from app.repositories.history import HistoryRepository
from app.repositories.playlists import PlaylistRepository
from app.repositories.users import UserRepository

_HISTORY_DEDUP_WINDOW_SECONDS = 120


class PersonalizationService:
    def __init__(self, db: Any) -> None:
        self._history = HistoryRepository(db)
        self._playlists = PlaylistRepository(db)
        self._users = UserRepository(db)

    def add_history_entry(
        self,
        user_id: str,
        song_title: str,
        artist: str,
        song_metadata: dict[str, Any] | None = None,
    ) -> tuple[dict[str, Any], int]:
        now = datetime.now(UTC)
        document = {
            "user_id": user_id,
            "song_title": song_title,
            "artist": artist,
            "played_at": now,
        }
        if song_metadata:
            document.update(song_metadata)

        latest = self._history.latest_for_user(user_id)
        if latest and self._is_same_history_track(latest, document):
            latest_played_at = latest.get("played_at")
            if latest_played_at and latest_played_at.tzinfo is None:
                latest_played_at = latest_played_at.replace(tzinfo=UTC)
            if latest_played_at and (now - latest_played_at).total_seconds() <= _HISTORY_DEDUP_WINDOW_SECONDS:
                self._history.update_entry(
                    latest["_id"],
                    {
                        **document,
                        "played_at": now,
                    },
                )
                return {"message": "History entry refreshed"}, 200

        self._history.create(document)
        return {"message": "Song added to history"}, 201

    def get_history(self, user_id: str, limit: int = 10) -> tuple[list[dict[str, Any]], int]:
        history = self._history.list_for_user(user_id, limit=limit)
        return (
            [
                {
                    "id": str(item["_id"]),
                    "song_title": item["song_title"],
                    "artist": item["artist"],
                    "played_at": item["played_at"].isoformat(),
                    "youtube_video_id": item.get("youtube_video_id"),
                    "track_id": item.get("track_id"),
                    "image": item.get("image"),
                    "preview_url": item.get("preview_url"),
                    "spotify_url": item.get("spotify_url"),
                }
                for item in history
            ],
            200,
        )

    def create_playlist(self, user_id: str, name: str) -> tuple[dict[str, Any], int]:
        document = {
            "user_id": user_id,
            "name": name,
            "created_at": datetime.now(UTC),
            "songs": [],
        }
        result = self._playlists.create(document)
        playlist = self._playlists.find_for_user(str(result.inserted_id), user_id)
        assert playlist is not None
        return {"message": "Playlist created", "playlist": self._serialize_playlist(playlist)}, 201

    def get_playlists(self, user_id: str) -> tuple[list[dict[str, Any]], int]:
        playlists = self._playlists.list_for_user(user_id)
        return ([self._serialize_playlist(item) for item in playlists], 200)

    def add_song_to_playlist(
        self,
        playlist_id: str,
        user_id: str,
        song_data: dict[str, Any],
    ) -> tuple[dict[str, Any], int]:
        try:
            playlist = self._playlists.find_for_user(playlist_id, user_id)
        except InvalidId:
            return {"message": "Invalid playlist ID format"}, 400

        if not playlist:
            return {"message": "Playlist not found"}, 404

        song_title = (song_data.get("song_title") or "").strip()
        artist = (song_data.get("artist") or "").strip()

        if not song_title or not artist:
            return {"message": "Song title and artist are required"}, 400

        duplicate = next(
            (
                item
                for item in playlist.get("songs", [])
                if item.get("song_title") == song_title and item.get("artist") == artist
            ),
            None,
        )
        if duplicate:
            return {"message": "Song already exists in playlist"}, 400

        song = {
            "id": uuid4().hex,
            "song_title": song_title,
            "artist": artist,
            "youtube_video_id": song_data.get("youtube_video_id"),
            "track_id": song_data.get("track_id"),
            "image": song_data.get("image"),
            "preview_url": song_data.get("preview_url"),
            "spotify_url": song_data.get("spotify_url"),
            "added_at": datetime.now(UTC).isoformat(),
        }
        self._playlists.add_song(playlist_id, user_id, song)
        return {"message": "Song added to playlist", "song": song}, 201

    def remove_song_from_playlist(
        self,
        playlist_id: str,
        user_id: str,
        song_id: str,
    ) -> tuple[dict[str, Any], int]:
        try:
            modified = self._playlists.remove_song(playlist_id, user_id, song_id)
        except InvalidId:
            return {"message": "Invalid playlist ID format"}, 400

        if modified == 0:
            return {"message": "Playlist or song not found"}, 404

        return {"message": "Song removed from playlist"}, 200

    def _is_premium(self, user_id: str) -> bool:
        user = self._users.find_by_id(user_id)
        if not user:
            return False
        expiry = user.get("subscription_expiry")
        if expiry and expiry < datetime.now(UTC):
            return False
        return bool(user.get("is_premium"))

    def _serialize_playlist(self, playlist: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(playlist["_id"]),
            "user_id": playlist["user_id"],
            "name": playlist["name"],
            "created_at": playlist["created_at"].isoformat(),
            "songs": [
                {
                    "id": song["id"],
                    "song_title": song["song_title"],
                    "artist": song["artist"],
                    "youtube_video_id": song.get("youtube_video_id"),
                    "track_id": song.get("track_id"),
                    "image": song.get("image"),
                    "preview_url": song.get("preview_url"),
                    "spotify_url": song.get("spotify_url"),
                    "added_at": song.get("added_at"),
                }
                for song in playlist.get("songs", [])
            ],
        }

    def _is_same_history_track(
        self,
        existing: dict[str, Any],
        incoming: dict[str, Any],
    ) -> bool:
        existing_track_id = existing.get("track_id")
        incoming_track_id = incoming.get("track_id")
        if existing_track_id and incoming_track_id:
            return existing_track_id == incoming_track_id

        return (
            (existing.get("song_title") or "").strip().casefold()
            == (incoming.get("song_title") or "").strip().casefold()
            and (existing.get("artist") or "").strip().casefold()
            == (incoming.get("artist") or "").strip().casefold()
        )
