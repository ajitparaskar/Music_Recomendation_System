"""Authentication and user favorites API."""

import logging

from bson.objectid import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from pymongo.errors import PyMongoError
from werkzeug.security import check_password_hash, generate_password_hash

from app.db import get_db

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)

_DB_UNAVAILABLE = (
    "Database unavailable. Start MongoDB locally, or set MONGO_URI to a reachable "
    "MongoDB (e.g. MongoDB Atlas) in your server environment."
)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    try:
        db = get_db()
        if db.users.find_one({"username": username}):
            return jsonify({"message": "User already exists"}), 400

        hashed_password = generate_password_hash(password)
        db.users.insert_one({"username": username, "password_hash": hashed_password})

        return jsonify({"message": "User registered successfully"}), 201
    except PyMongoError:
        logger.exception("MongoDB error in register")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    try:
        db = get_db()
        user = db.users.find_one({"username": username})
    except PyMongoError:
        logger.exception("MongoDB error in login")
        return jsonify({"message": _DB_UNAVAILABLE}), 503

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"message": "Invalid username or password"}), 401

    access_token = create_access_token(identity=str(user["_id"]))
    return jsonify({"access_token": access_token, "username": user["username"]}), 200


@auth_bp.route("/favorites", methods=["POST"])
@jwt_required()
def add_favorite():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    song_title = data.get("song_title")
    artist = data.get("artist")
    youtube_video_id = data.get("youtube_video_id")

    if not song_title or not artist:
        return jsonify({"message": "Song title and artist are required"}), 400

    try:
        db = get_db()
        existing = db.favorites.find_one(
            {
                "user_id": current_user_id,
                "song_title": song_title,
                "artist": artist,
            }
        )

        if existing:
            return jsonify({"message": "Song already in favorites"}), 400

        db.favorites.insert_one(
            {
                "user_id": current_user_id,
                "song_title": song_title,
                "artist": artist,
                "youtube_video_id": youtube_video_id,
            }
        )

        return jsonify({"message": "Added to favorites successfully"}), 201
    except PyMongoError:
        logger.exception("MongoDB error in add_favorite")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    current_user_id = get_jwt_identity()
    try:
        db = get_db()
        favorites = db.favorites.find({"user_id": current_user_id})

        result = []
        for fav in favorites:
            result.append(
                {
                    "id": str(fav["_id"]),
                    "song_title": fav["song_title"],
                    "artist": fav["artist"],
                    "youtube_video_id": fav.get("youtube_video_id"),
                }
            )

        return jsonify(result), 200
    except PyMongoError:
        logger.exception("MongoDB error in get_favorites")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@auth_bp.route("/favorites/<string:favorite_id>", methods=["DELETE"])
@jwt_required()
def remove_favorite(favorite_id):
    current_user_id = get_jwt_identity()

    try:
        obj_id = ObjectId(favorite_id)
    except Exception:
        return jsonify({"message": "Invalid favorite ID format"}), 400

    try:
        db = get_db()
        deleted = db.favorites.delete_one(
            {"_id": obj_id, "user_id": current_user_id}
        )

        if deleted.deleted_count == 0:
            return jsonify({"message": "Favorite not found or not yours"}), 404

        return jsonify({"message": "Favorite removed successfully"}), 200
    except PyMongoError:
        logger.exception("MongoDB error in remove_favorite")
        return jsonify({"message": _DB_UNAVAILABLE}), 503
