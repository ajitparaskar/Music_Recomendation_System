"""YouTube Data API helper with in-process cache."""

from __future__ import annotations

import logging
import re
from typing import Any

import requests

logger = logging.getLogger(__name__)

_VIDEO_ID_PATTERN = re.compile(r'watch\?v=([A-Za-z0-9_-]{11})')


class YoutubeService:
    def __init__(self) -> None:
        self._cache: dict[str, str | None] = {}
        self._api_key: str | None = None
        self._enabled = True
        self._session = requests.Session()
        self._session.trust_env = False

    def init_app(self, app: Any) -> None:
        self._api_key = app.config.get("YOUTUBE_API_KEY")
        self._enabled = app.config.get("YOUTUBE_API_ENABLED", True)
        app.extensions["youtube_service"] = self

    def get_video_id(self, song_name: str, artist_name: str) -> str | None:
        if not self._enabled:
            return None

        cache_key = f"{song_name.lower()}_{artist_name.lower()}"
        if cache_key in self._cache:
            logger.debug("YouTube cache hit: %s", cache_key)
            return self._cache[cache_key]

        if not self._api_key:
            logger.warning("YOUTUBE_API_KEY not set; unable to search YouTube API")
            self._cache[cache_key] = None
            return None

        search_query = f"{song_name} {artist_name} official song"
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": search_query,
            "key": self._api_key,
            "type": "video",
            "maxResults": 1,
        }

        try:
            response = self._session.get(url, params=params, timeout=15)
            data = response.json()
            logger.debug(
                "YouTube search '%s' / '%s' -> HTTP %s",
                song_name,
                artist_name,
                response.status_code,
            )

            if response.status_code == 200 and data.get("items"):
                video_id = data["items"][0]["id"]["videoId"]
                self._cache[cache_key] = video_id
                return video_id

            err = data.get("error", {}).get("message", "unknown")
            logger.warning("YouTube API: %s", err)
        except Exception as e:
            logger.warning("YouTube request failed: %s", e)

        self._cache[cache_key] = None
        return None
