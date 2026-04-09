"""Facial emotion detection service with graceful fallback."""

from __future__ import annotations

import base64
import binascii
import io
import logging
from typing import Any

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

try:
    from deepface import DeepFace  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    DeepFace = None


EMOTION_TO_MOOD = {
    "happy": "happy",
    "surprise": "energetic",
    "sad": "sad",
    "fear": "sad",
    "angry": "energetic",
    "disgust": "energetic",
    "neutral": "chill",
}


class EmotionDetectionService:
    def __init__(self) -> None:
        self._enabled = True

    def init_app(self, app: Any) -> None:
        self._enabled = app.config.get("EMOTION_DETECTION_ENABLED", True)
        app.extensions["emotion_detection_service"] = self

    def detect_from_image(self, image_data: str | None) -> dict[str, Any]:
        if not image_data:
            return {
                "emotion": "neutral",
                "mood": "chill",
                "used_fallback": True,
                "message": "No image provided. Using chill mood.",
            }

        image_array = self._decode_image(image_data)
        if image_array is None:
            return {
                "emotion": "neutral",
                "mood": "chill",
                "used_fallback": True,
                "message": "Could not read image. Using chill mood.",
            }

        if not self._enabled or DeepFace is None:
            logger.info("DeepFace unavailable or disabled; using fallback emotion detection")
            return self._fallback_result("neutral", "Emotion detection unavailable. Using chill mood.")

        try:
            analysis = DeepFace.analyze(
                img_path=image_array,
                actions=["emotion"],
                enforce_detection=False,
                detector_backend="opencv",
                silent=True,
            )
            if isinstance(analysis, list):
                analysis = analysis[0]

            emotion = (analysis or {}).get("dominant_emotion") or "neutral"
            mood = EMOTION_TO_MOOD.get(emotion, "chill")
            return {
                "emotion": emotion,
                "mood": mood,
                "used_fallback": False,
                "message": f"Detected {emotion} emotion. Recommending {mood} songs.",
            }
        except Exception as exc:  # pragma: no cover - depends on external model/runtime
            logger.warning("Emotion detection failed: %s", exc)
            return self._fallback_result(
                "neutral",
                "No face detected clearly. Using chill mood.",
            )

    def _decode_image(self, image_data: str) -> np.ndarray | None:
        payload = image_data
        if "," in image_data:
            payload = image_data.split(",", 1)[1]

        try:
            raw = base64.b64decode(payload)
            image = Image.open(io.BytesIO(raw)).convert("RGB")
            return np.array(image)
        except (binascii.Error, ValueError, OSError) as exc:
            logger.warning("Failed to decode camera image: %s", exc)
            return None

    def _fallback_result(self, emotion: str, message: str) -> dict[str, Any]:
        return {
            "emotion": emotion,
            "mood": EMOTION_TO_MOOD.get(emotion, "chill"),
            "used_fallback": True,
            "message": message,
        }
