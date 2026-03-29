"""Flask application factory."""

from __future__ import annotations

import logging
import os
import sys

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient

from app.blueprints.auth import auth_bp
from app.blueprints.health import health_bp
from app.blueprints.music import music_bp
from app.config import config_by_name
from app.errors import register_error_handlers
from app.extensions import jwt
from app.services.recommendation import RecommendationService
from app.services.youtube import YoutubeService


def _configure_logging(app: Flask) -> None:
    if not app.debug:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            stream=sys.stdout,
        )
    else:
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(levelname)s %(name)s: %(message)s",
        )


def create_app(config_name: str | None = None) -> Flask:
    load_dotenv()

    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    ConfigClass = config_by_name.get(config_name, config_by_name["development"])

    app = Flask(__name__)
    app.config.from_object(ConfigClass)

    if config_name == "production":
        bad = ("dev-jwt-change-me", "super-secret-music-key-2026", None, "")
        if app.config.get("JWT_SECRET_KEY") in bad:
            raise RuntimeError(
                "JWT_SECRET_KEY must be set to a strong secret in production "
                "(not a default placeholder)."
            )

    _configure_logging(app)

    mongo_client = MongoClient(
        app.config["MONGO_URI"],
        serverSelectionTimeoutMS=8000,
    )
    app.extensions["mongo_db"] = mongo_client[app.config["MONGO_DB_NAME"]]

    jwt.init_app(app)

    CORS(
        app,
        resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    recommendation_service = RecommendationService()
    recommendation_service.init_app(app)

    youtube_service = YoutubeService()
    youtube_service.init_app(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(music_bp)
    app.register_blueprint(auth_bp, url_prefix="/api")

    register_error_handlers(app)

    @app.route("/")
    def root():
        return jsonify(
            {
                "service": "music-recommendation-api",
                "docs": "See repository README for endpoints",
                "health": "/health",
            }
        )

    return app
