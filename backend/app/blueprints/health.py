"""Health and readiness endpoints for load balancers and monitoring."""

import importlib.metadata

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    try:
        flask_ver = importlib.metadata.version("flask")
    except importlib.metadata.PackageNotFoundError:
        flask_ver = "unknown"

    return jsonify(
        {
            "status": "ok",
            "service": "music-recommendation-api",
            "flask": flask_ver,
        }
    )
