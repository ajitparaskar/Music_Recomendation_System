"""Application configuration for development and production."""

from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path


def _backend_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _resolve_data_path() -> str:
    raw = os.environ.get("DATASET_PATH")
    if not raw:
        return str(_backend_root() / "dataset.csv")

    candidate = Path(raw)
    if not candidate.is_absolute():
        candidate = _backend_root() / candidate
    return str(candidate)


class Config:
    """Default configuration (development-friendly)."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-change-me")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "7"))
    )

    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "music_db")

    DATASET_PATH = _resolve_data_path()

    YOUTUBE_API_ENABLED = os.environ.get("YOUTUBE_API_ENABLED", "true").lower() in {
        "1",
        "true",
        "yes",
    }
    _yt_key = (os.environ.get("YOUTUBE_API_KEY") or "").strip()
    YOUTUBE_API_KEY = _yt_key or None

    SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
    SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
    EMOTION_DETECTION_ENABLED = os.environ.get(
        "EMOTION_DETECTION_ENABLED",
        "true",
    ).lower() in {"1", "true", "yes"}
    RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")
    PREMIUM_MONTHLY_AMOUNT = int(os.environ.get("PREMIUM_MONTHLY_AMOUNT", "19900"))
    PREMIUM_YEARLY_AMOUNT = int(os.environ.get("PREMIUM_YEARLY_AMOUNT", "149900"))
    PREMIUM_MONTHLY_DAYS = int(os.environ.get("PREMIUM_MONTHLY_DAYS", "30"))
    PREMIUM_YEARLY_DAYS = int(os.environ.get("PREMIUM_YEARLY_DAYS", "365"))

    _cors_raw = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    )
    CORS_ORIGINS = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

    JSON_SORT_KEYS = False


class ProductionConfig(Config):
    """Production: require strong secrets (validated in create_app)."""

    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    TESTING = True
    MONGO_DB_NAME = "music_db_test"


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
