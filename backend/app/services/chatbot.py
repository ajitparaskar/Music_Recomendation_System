"""Rule-based chatbot query parsing for music discovery."""

from __future__ import annotations

import re
from typing import Any


class ChatbotService:
    _MOOD_KEYWORDS = {
        "happy": {"happy", "joyful", "feel good", "cheerful"},
        "sad": {"sad", "heartbreak", "melancholy", "emotional"},
        "energetic": {"energetic", "workout", "gym", "party", "dance", "running"},
        "chill": {"chill", "relax", "calm", "peaceful", "lofi", "study"},
    }

    def __init__(self, recommendation_service: Any) -> None:
        self._recommendation_service = recommendation_service

    def handle_query(self, query: str | None) -> dict[str, Any]:
        cleaned_query = (query or "").strip()
        if not cleaned_query:
            return {
                "intent": {"type": "empty", "mood": None, "artist": None, "query": ""},
                "matched_song": None,
                "recommendations": [],
                "message": "Ask me for a song, mood, or artist and I will find something to play.",
            }

        intent = self._parse_intent(cleaned_query)
        intent_type = intent["type"]

        if intent_type == "mood":
            result = self._recommendation_service.recommend_by_mood(intent["mood"], limit=8)
            result["message"] = (
                f"Here are some {intent['mood']} tracks based on your request."
            )
            result["intent"] = intent
            return result

        if intent_type == "artist":
            result = self._recommendation_service.recommend_by_artist(intent["artist"], limit=8)
            result["message"] = (
                f"Here are songs featuring {intent['artist']}."
                if result["recommendations"]
                else f"I could not find songs for {intent['artist']}, so try another artist name."
            )
            result["intent"] = intent
            return result

        result = self._recommendation_service.recommend(cleaned_query)
        result["message"] = (
            f"I found recommendations related to \"{cleaned_query}\"."
            if result["recommendations"] or result["matched_song"]
            else f"I could not confidently match \"{cleaned_query}\". Try a mood or artist name."
        )
        result["intent"] = intent
        return result

    def _parse_intent(self, query: str) -> dict[str, Any]:
        lowered = query.lower()

        mood = self._extract_mood(lowered)
        if mood:
            return {"type": "mood", "mood": mood, "artist": None, "query": query}

        artist = self._extract_artist(query, lowered)
        if artist:
            return {"type": "artist", "mood": None, "artist": artist, "query": query}

        return {"type": "search", "mood": None, "artist": None, "query": query}

    def _extract_mood(self, lowered_query: str) -> str | None:
        for mood, keywords in self._MOOD_KEYWORDS.items():
            if any(keyword in lowered_query for keyword in keywords):
                return mood
        return None

    def _extract_artist(self, original_query: str, lowered_query: str) -> str | None:
        patterns = [
            r"(?:songs by|play songs by|artist)\s+(.+)$",
            r"(.+?)\s+songs$",
            r"play\s+(.+)$",
        ]

        for pattern in patterns:
            match = re.search(pattern, lowered_query)
            if not match:
                continue
            artist_fragment = match.group(1).strip()
            if not artist_fragment:
                continue
            start = lowered_query.find(artist_fragment)
            if start == -1:
                return artist_fragment.title()
            return original_query[start : start + len(artist_fragment)].strip()

        tokens = original_query.split()
        if len(tokens) >= 2 and all(token[:1].isupper() for token in tokens[:2]):
            return " ".join(tokens)

        return None
