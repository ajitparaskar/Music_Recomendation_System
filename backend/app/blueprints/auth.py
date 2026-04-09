"""Authentication and user favorites API."""

import logging

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from pymongo.errors import PyMongoError

from app.db import get_db
from app.services.auth import AuthService
from app.services.payments import PaymentService

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)

_DB_UNAVAILABLE = (
    "Database unavailable. Start MongoDB locally, or set MONGO_URI to a reachable "
    "MongoDB (e.g. MongoDB Atlas) in your server environment."
)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    try:
        payload, status_code = AuthService(get_db()).register(username, password)
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in register")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    try:
        payload, status_code = AuthService(get_db()).login(username, password)
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in login")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    try:
        payload, status_code = AuthService(get_db()).get_user_profile(current_user_id)
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in get_me")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/payments/create-order", methods=["POST"])
@jwt_required()
def create_payment_order():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    plan = data.get("plan", "monthly")

    try:
        payload, status_code = PaymentService(get_db(), current_app.config).create_order(
            current_user_id,
            plan,
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in create_payment_order")
        return jsonify({"message": _DB_UNAVAILABLE}), 503
    except Exception:
        logger.exception("Unexpected error in create_payment_order")
        return jsonify({"message": "Unable to create payment order right now"}), 500


@auth_bp.route("/payments/verify", methods=["POST"])
@jwt_required()
def verify_payment():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        payload, status_code = PaymentService(get_db(), current_app.config).verify_payment(
            current_user_id,
            data.get("razorpay_order_id", ""),
            data.get("razorpay_payment_id", ""),
            data.get("razorpay_signature", ""),
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in verify_payment")
        return jsonify({"message": _DB_UNAVAILABLE}), 503
    except Exception:
        logger.exception("Unexpected error in verify_payment")
        return jsonify({"message": "Unable to verify payment right now"}), 500


@auth_bp.route("/favorites", methods=["POST"])
@jwt_required()
def add_favorite():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    song_title = (data.get("song_title") or "").strip()
    artist = (data.get("artist") or "").strip()
    youtube_video_id = data.get("youtube_video_id")

    if not song_title or not artist:
        return jsonify({"message": "Song title and artist are required"}), 400

    try:
        payload, status_code = AuthService(get_db()).add_favorite(
            current_user_id,
            song_title,
            artist,
            youtube_video_id,
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in add_favorite")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    current_user_id = get_jwt_identity()
    try:
        payload, status_code = AuthService(get_db()).get_favorites(current_user_id)
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in get_favorites")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/favorites/<string:favorite_id>", methods=["DELETE"])
@jwt_required()
def remove_favorite(favorite_id):
    current_user_id = get_jwt_identity()

    try:
        payload, status_code = AuthService(get_db()).remove_favorite(
            favorite_id,
            current_user_id,
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in remove_favorite")
        return jsonify({"message": _DB_UNAVAILABLE}), 503
