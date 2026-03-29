"""TF-IDF content-based recommendation engine."""

from __future__ import annotations

import logging
from typing import Any

import pandas as pd
import requests
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class RecommendationService:
    """Loads dataset once and serves recommendation + search."""

    def __init__(self) -> None:
        self._df: pd.DataFrame | None = None
        self._matrix = None
        self._vectorizer: TfidfVectorizer | None = None
        self._spotify_token: str | None = None
        self._spotify_client_id: str | None = None
        self._spotify_client_secret: str | None = None

    def init_app(self, app: Any) -> None:
        dataset_path = app.config["DATASET_PATH"]
        self._spotify_client_id = app.config.get("SPOTIFY_CLIENT_ID")
        self._spotify_client_secret = app.config.get("SPOTIFY_CLIENT_SECRET")

        logger.info("Loading dataset from %s", dataset_path)
        self._df = pd.read_csv(dataset_path)
        self._df.dropna(inplace=True)
        self._df["track_name_lower"] = self._df["track_name"].str.lower()
        self._df["tags"] = (
            self._df["artists"].astype(str)
            + " "
            + self._df["track_genre"].astype(str)
            + " "
            + self._df["album_name"].astype(str)
        )

        self._vectorizer = TfidfVectorizer(stop_words="english")
        self._matrix = self._vectorizer.fit_transform(self._df["tags"])

        self._spotify_token = self._fetch_spotify_token()
        logger.info("Recommendation engine ready (%s tracks)", len(self._df))

        app.extensions["recommendation_service"] = self

    def _fetch_spotify_token(self) -> str | None:
        if not self._spotify_client_id or not self._spotify_client_secret:
            return None
        try:
            response = requests.post(
                "https://accounts.spotify.com/api/token",
                data={"grant_type": "client_credentials"},
                auth=(self._spotify_client_id, self._spotify_client_secret),
                timeout=15,
            )
            response.raise_for_status()
            token = response.json().get("access_token")
            logger.debug("Spotify client credentials token obtained")
            return token
        except requests.RequestException as e:
            logger.warning("Spotify token error: %s", e)
            return None

    def _enrich_with_spotify(self, track_name: str, artist_name: str) -> dict[str, Any]:
        if not self._spotify_token:
            return {"image": None, "preview_url": None, "spotify_url": None}

        try:
            query = f"{track_name} {artist_name}"
            headers = {"Authorization": f"Bearer {self._spotify_token}"}
            params = {"q": query, "type": "track", "limit": 1}
            response = requests.get(
                "https://api.spotify.com/v1/search",
                headers=headers,
                params=params,
                timeout=15,
            )

            if response.status_code == 401:
                self._spotify_token = self._fetch_spotify_token()
                if self._spotify_token:
                    headers["Authorization"] = f"Bearer {self._spotify_token}"
                    response = requests.get(
                        "https://api.spotify.com/v1/search",
                        headers=headers,
                        params=params,
                        timeout=15,
                    )

            if response.status_code != 200:
                return {"image": None, "preview_url": None, "spotify_url": None}

            data = response.json()
            if not data["tracks"]["items"]:
                return {"image": None, "preview_url": None, "spotify_url": None}

            track = data["tracks"]["items"][0]
            return {
                "image": (
                    track["album"]["images"][0]["url"]
                    if track["album"]["images"]
                    else None
                ),
                "preview_url": track.get("preview_url"),
                "spotify_url": track["external_urls"]["spotify"],
            }
        except requests.RequestException as e:
            logger.warning("Spotify enrichment error: %s", e)
            return {"image": None, "preview_url": None, "spotify_url": None}

    def recommend(self, song: str | None) -> dict[str, Any]:
        assert self._df is not None and self._matrix is not None

        if not song:
            return {"matched_song": None, "recommendations": []}

        song = song.lower()
        matches = self._df[self._df["track_name_lower"].str.contains(song, na=False)]

        if matches.empty:
            return {"matched_song": None, "recommendations": []}

        matched_index = matches.index[0]
        matched_title = self._df.iloc[matched_index]["track_name"]
        matched_artist = self._df.iloc[matched_index]["artists"]

        spotify_data = self._enrich_with_spotify(matched_title, matched_artist)

        matched_song = {
            "title": matched_title,
            "artist": matched_artist,
            "album": self._df.iloc[matched_index]["album_name"],
            "popularity": int(self._df.iloc[matched_index]["popularity"]),
            "duration_ms": int(self._df.iloc[matched_index]["duration_ms"]),
            "track_id": self._df.iloc[matched_index]["track_id"],
            "image": spotify_data["image"],
            "preview_url": spotify_data["preview_url"],
            "spotify_url": spotify_data["spotify_url"],
        }

        similarity_scores = cosine_similarity(
            self._matrix[matched_index],
            self._matrix,
        )[0]
        song_indices = similarity_scores.argsort()[::-1][1:6]

        results = []
        for i in song_indices:
            title = self._df.iloc[i]["track_name"]
            artist = self._df.iloc[i]["artists"]
            spotify_data = self._enrich_with_spotify(title, artist)
            results.append(
                {
                    "title": title,
                    "artist": artist,
                    "album": self._df.iloc[i]["album_name"],
                    "popularity": int(self._df.iloc[i]["popularity"]),
                    "duration_ms": int(self._df.iloc[i]["duration_ms"]),
                    "track_id": self._df.iloc[i]["track_id"],
                    "image": spotify_data["image"],
                    "preview_url": spotify_data["preview_url"],
                    "spotify_url": spotify_data["spotify_url"],
                }
            )

        return {"matched_song": matched_song, "recommendations": results}

    def search_songs(self, query: str | None) -> list[str]:
        assert self._df is not None

        if not query:
            return []

        query = query.lower()
        matches = self._df[self._df["track_name_lower"].str.contains(query, na=False)]
        return matches["track_name"].head(5).tolist()
