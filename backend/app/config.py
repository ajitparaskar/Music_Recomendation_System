"""Application configuration for development and production."""

import os
from pathlib import Path


def _backend_root() -> Path:
    return Path(__file__).resolve().parent.parent


class Config:
    """Default configuration (development-friendly)."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-change-me")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "music_db")

    DATASET_PATH = os.environ.get(
        "DATASET_PATH", str(_backend_root() / "dataset.csv")
    )

    YOUTUBE_API_ENABLED = os.environ.get("YOUTUBE_API_ENABLED", "true").lower() == "true"
    YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

    SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
    SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")

    _cors_raw = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    )
    CORS_ORIGINS = [x.strip() for x in _cors_raw.split(",") if x.strip()]

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
