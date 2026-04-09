"""Health and readiness endpoints for load balancers and monitoring."""

import importlib.metadata

from flask import Blueprint, current_app, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    try:
        flask_ver = importlib.metadata.version("flask")
    except importlib.metadata.PackageNotFoundError:
        flask_ver = "unknown"

    mongo_status = "ok"
    try:
        current_app.extensions["mongo_db"].command("ping")
    except Exception:
        mongo_status = "unavailable"

    return jsonify(
        {
            "status": "ok",
            "service": "music-recommendation-api",
            "flask": flask_ver,
            "mongo": mongo_status,
        }
    )
