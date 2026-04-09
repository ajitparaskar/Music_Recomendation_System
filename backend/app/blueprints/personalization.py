"""JWT-protected personalization endpoints."""

import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from pymongo.errors import PyMongoError

from app.db import get_db
from app.services.personalization import PersonalizationService

logger = logging.getLogger(__name__)

personalization_bp = Blueprint("personalization", __name__)

_DB_UNAVAILABLE = (
    "Database unavailable. Start MongoDB locally, or set MONGO_URI to a reachable "
    "MongoDB (e.g. MongoDB Atlas) in your server environment."
)


@personalization_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    current_user_id = get_jwt_identity()
    try:
        payload, status_code = PersonalizationService(get_db()).get_history(current_user_id)
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in get_history")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@personalization_bp.route("/history", methods=["POST"])
@jwt_required()
def add_history():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    song_title = (data.get("song_title") or "").strip()
    artist = (data.get("artist") or "").strip()

    if not song_title or not artist:
        return jsonify({"message": "Song title and artist are required"}), 400

    metadata = {
        "youtube_video_id": data.get("youtube_video_id"),
        "track_id": data.get("track_id"),
        "image": data.get("image"),
        "preview_url": data.get("preview_url"),
        "spotify_url": data.get("spotify_url"),
    }

    try:
        payload, status_code = PersonalizationService(get_db()).add_history_entry(
            current_user_id,
            song_title,
            artist,
            metadata,
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in add_history")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@personalization_bp.route("/playlists", methods=["GET"])
@jwt_required()
def get_playlists():
    current_user_id = get_jwt_identity()
    try:
        payload, status_code = PersonalizationService(get_db()).get_playlists(current_user_id)
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in get_playlists")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@personalization_bp.route("/playlists", methods=["POST"])
@jwt_required()
def create_playlist():
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()

    if not name:
        return jsonify({"message": "Playlist name is required"}), 400

    try:
        payload, status_code = PersonalizationService(get_db()).create_playlist(
            current_user_id,
            name,
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in create_playlist")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@personalization_bp.route("/playlists/<string:playlist_id>/songs", methods=["POST"])
@jwt_required()
def add_song_to_playlist(playlist_id):
    current_user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    try:
        payload, status_code = PersonalizationService(get_db()).add_song_to_playlist(
            playlist_id,
            current_user_id,
            data,
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in add_song_to_playlist")
        return jsonify({"message": _DB_UNAVAILABLE}), 503


@personalization_bp.route(
    "/playlists/<string:playlist_id>/songs/<string:song_id>", methods=["DELETE"]
)
@jwt_required()
def remove_song_from_playlist(playlist_id, song_id):
    current_user_id = get_jwt_identity()

    try:
        payload, status_code = PersonalizationService(get_db()).remove_song_from_playlist(
            playlist_id,
            current_user_id,
            song_id,
        )
        return jsonify(payload), status_code
    except PyMongoError:
        logger.exception("MongoDB error in remove_song_from_playlist")
        return jsonify({"message": _DB_UNAVAILABLE}), 503
