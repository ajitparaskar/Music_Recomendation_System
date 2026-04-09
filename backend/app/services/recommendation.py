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
        self._df["artists_lower"] = self._df["artists"].str.lower()
        self._df["tags"] = (
            self._df["artists"].astype(str)
            + " "
            + self._df["track_genre"].astype(str)
            + " "
            + self._df["album_name"].astype(str)
        )
        self._df["mood"] = self._df.apply(self._classify_mood, axis=1)

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

        matched_song = self._serialize_track(self._df.iloc[matched_index], include_spotify=True)

        similarity_scores = cosine_similarity(
            self._matrix[matched_index],
            self._matrix,
        )[0]
        song_indices = similarity_scores.argsort()[::-1][1:6]

        results = []
        for i in song_indices:
            results.append(self._serialize_track(self._df.iloc[i], include_spotify=True))

        return {"matched_song": matched_song, "recommendations": results}

    def trim_results(self, payload: dict[str, Any], limit: int) -> dict[str, Any]:
        payload["recommendations"] = (payload.get("recommendations") or [])[:limit]
        return payload

    def recommend_by_mood(
        self,
        mood: str | None,
        limit: int = 8,
    ) -> dict[str, Any]:
        assert self._df is not None

        normalized_mood = (mood or "chill").strip().lower()
        allowed_moods = {"happy", "sad", "energetic", "chill"}
        if normalized_mood not in allowed_moods:
            normalized_mood = "chill"

        filtered = self._df[self._df["mood"] == normalized_mood]
        if filtered.empty:
            filtered = self._df[self._df["mood"] == "chill"]
            normalized_mood = "chill"

        sample_size = min(limit, len(filtered))
        selected = (
            filtered.sort_values(by=["popularity", "energy", "valence"], ascending=False)
            .head(max(sample_size * 3, sample_size))
            .sample(sample_size)
        )
        recommendations = [
            self._serialize_track(row, include_spotify=True)
            for _, row in selected.iterrows()
        ]

        return {
            "mood": normalized_mood,
            "matched_song": None,
            "recommendations": recommendations,
        }

    def recommend_by_artist(
        self,
        artist: str | None,
        limit: int = 8,
    ) -> dict[str, Any]:
        assert self._df is not None

        artist_query = (artist or "").strip().lower()
        if not artist_query:
            return {"artist": None, "matched_song": None, "recommendations": []}

        filtered = self._df[self._df["artists_lower"].str.contains(artist_query, na=False)]
        if filtered.empty:
            return {"artist": artist, "matched_song": None, "recommendations": []}

        ordered = filtered.sort_values(by=["popularity", "energy"], ascending=False)
        selected = ordered.head(max(limit * 2, limit)).head(limit)
        recommendations = [
            self._serialize_track(row, include_spotify=True)
            for _, row in selected.iterrows()
        ]

        return {
            "artist": artist,
            "matched_song": None,
            "recommendations": recommendations,
        }

    def search_songs(self, query: str | None) -> list[dict[str, Any]]:
        assert self._df is not None

        if not query:
            return []

        query = query.lower()
        matches = self._df[self._df["track_name_lower"].str.contains(query, na=False)]
        suggestions: list[dict[str, Any]] = []
        seen: set[tuple[str, str]] = set()

        for _, row in matches.head(20).iterrows():
            key = (str(row["track_name"]), str(row["artists"]))
            if key in seen:
                continue
            seen.add(key)
            suggestions.append(
                {
                    "title": str(row["track_name"]),
                    "artist": str(row["artists"]),
                    "track_id": str(row["track_id"]),
                }
            )
            if len(suggestions) == 5:
                break

        return suggestions

    def _classify_mood(self, row: pd.Series) -> str:
        valence = float(row.get("valence", 0))
        energy = float(row.get("energy", 0))
        acousticness = float(row.get("acousticness", 0))
        tempo = float(row.get("tempo", 0))
        genre = str(row.get("track_genre", "")).lower()

        if energy >= 0.72 or tempo >= 128 or genre in {"dance", "electronic", "edm"}:
            return "energetic"
        if valence >= 0.62 and energy >= 0.45:
            return "happy"
        if valence <= 0.38 and energy <= 0.5:
            return "sad"
        if acousticness >= 0.45 or energy <= 0.45:
            return "chill"
        if valence >= 0.55:
            return "happy"
        return "chill"

    def _serialize_track(
        self,
        row: pd.Series,
        *,
        include_spotify: bool = False,
    ) -> dict[str, Any]:
        title = str(row["track_name"])
        artist = str(row["artists"])
        spotify_data = (
            self._enrich_with_spotify(title, artist)
            if include_spotify
            else {"image": None, "preview_url": None, "spotify_url": None}
        )
        return {
            "title": title,
            "artist": artist,
            "album": str(row["album_name"]),
            "popularity": int(row["popularity"]),
            "duration_ms": int(row["duration_ms"]),
            "track_id": str(row["track_id"]),
            "genre": str(row.get("track_genre", "")),
            "energy": float(row.get("energy", 0)),
            "valence": float(row.get("valence", 0)),
            "mood": str(row.get("mood", "")),
            "image": spotify_data["image"],
            "preview_url": spotify_data["preview_url"],
            "spotify_url": spotify_data["spotify_url"],
        }
