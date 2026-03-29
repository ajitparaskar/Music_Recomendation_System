"""Global error handlers."""

import logging

from flask import Flask, jsonify

logger = logging.getLogger(__name__)


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"error": "not_found", "message": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        return jsonify({"error": "method_not_allowed", "message": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Unhandled error: %s", e)
        return (
            jsonify(
                {
                    "error": "internal_error",
                    "message": "An unexpected error occurred",
                }
            ),
            500,
        )
