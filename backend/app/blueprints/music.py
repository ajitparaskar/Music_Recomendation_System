"""Recommendation and search endpoints."""

from datetime import UTC, datetime

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.repositories.users import UserRepository
from app.services.chatbot import ChatbotService

music_bp = Blueprint("music", __name__)


def _current_user_is_premium() -> bool:
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        # Public endpoints should still work even if the browser sends an
        # expired or malformed token from localStorage.
        return False

    user_id = get_jwt_identity()
    if not user_id:
        return False

    user = UserRepository(current_app.extensions["mongo_db"]).find_by_id(user_id)
    if not user:
        return False

    expiry = user.get("subscription_expiry")
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=UTC)
    if expiry and expiry < datetime.now(UTC):
        return False
    return bool(user.get("is_premium"))


def _attach_youtube(result: dict):
    yt = current_app.extensions["youtube_service"]
    api_enabled = current_app.config.get("YOUTUBE_API_ENABLED")

    if api_enabled:
        if result.get("matched_song"):
            ms = result["matched_song"]
            song_title = ms.get("title", "Unknown")
            artist = ms.get("artist", "Unknown")
            print(f"🎵 Searching YouTube for Matched Song: '{song_title}' by '{artist}'")
            ms["youtube_video_id"] = yt.get_video_id(song_title, artist)

        if "recommendations" in result:
            print(f"🎵 Processing {len(result['recommendations'])} recommendations for YouTube videos...")
            for i, rec in enumerate(result["recommendations"]):
                song_title = rec.get("title", "Unknown")
                artist = rec.get("artist", "Unknown")
                print(f"  {i+1}. Searching YouTube for: '{song_title}' by '{artist}'")

                video_id = yt.get_video_id(song_title, artist)
                rec["youtube_video_id"] = video_id

                if video_id:
                    print(f"     ✅ Added video ID: {video_id}")
                else:
                    print(f"     ❌ No video found")

            print("📋 YouTube processing complete.")
    else:
        print("🎵 YouTube API disabled - skipping video search")
        if result.get("matched_song"):
            result["matched_song"]["youtube_video_id"] = None
        for rec in result.get("recommendations", []):
            rec["youtube_video_id"] = None

    return result


@music_bp.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(silent=True) or {}
    song = data.get("song")

    if not song:
        return jsonify(
            {
                "matched_song": None,
                "recommendations": [],
                "message": "No song provided",
            }
        )

    svc = current_app.extensions["recommendation_service"]
    is_premium = _current_user_is_premium()
    result = svc.recommend(song)
    result = svc.trim_results(result, 8 if is_premium else 4)
    if not is_premium:
        result["message"] = "Free plan shows a preview set of recommendations. Upgrade for more results."
    return jsonify(_attach_youtube(result))


@music_bp.route("/recommend/mood/<string:mood>", methods=["GET"])
def recommend_by_mood(mood):
    svc = current_app.extensions["recommendation_service"]
    try:
        limit = max(1, min(int(request.args.get("limit", 8)), 20))
    except ValueError:
        limit = 8

    is_premium = _current_user_is_premium()
    result = svc.recommend_by_mood(mood, limit=limit if is_premium else min(limit, 4))
    result["source"] = "mood"
    if not is_premium:
        result["message"] = "Free plan includes limited mood recommendations. Upgrade for more."
    return jsonify(_attach_youtube(result))


@music_bp.route("/recommend/emotion", methods=["POST"])
def recommend_by_emotion():
    if not _current_user_is_premium():
        return (
            jsonify(
                {
                    "message": "Mood detection from camera is a premium feature. Upgrade to unlock it."
                }
            ),
            403,
        )

    data = request.get_json(silent=True) or {}
    image = data.get("image")

    emotion_service = current_app.extensions["emotion_detection_service"]
    recommendation_service = current_app.extensions["recommendation_service"]

    detection = emotion_service.detect_from_image(image)
    result = recommendation_service.recommend_by_mood(detection["mood"], limit=8)
    result["source"] = "emotion"
    result["detected_emotion"] = detection["emotion"]
    result["mood"] = detection["mood"]
    result["used_fallback"] = detection["used_fallback"]
    result["message"] = detection["message"]
    return jsonify(_attach_youtube(result))


@music_bp.route("/moods", methods=["GET"])
def list_moods():
    return jsonify(
        {
            "moods": [
                {"id": "happy", "label": "Happy"},
                {"id": "sad", "label": "Sad"},
                {"id": "energetic", "label": "Energetic"},
                {"id": "chill", "label": "Chill"},
            ]
        }
    )


@music_bp.route("/search", methods=["POST"])
def search():
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()

    svc = current_app.extensions["recommendation_service"]
    results = svc.search_songs(query)
    return jsonify({"suggestions": results})


@music_bp.route("/chatbot/query", methods=["POST"])
def chatbot_query():
    data = request.get_json(silent=True) or {}
    query = data.get("query")

    recommendation_service = current_app.extensions["recommendation_service"]
    result = ChatbotService(recommendation_service).handle_query(query)
    if not _current_user_is_premium():
        result = recommendation_service.trim_results(result, 4)
        if result.get("message"):
            result["message"] = (
                f"{result['message']} Free plan includes a shorter assistant result set."
            )
    result["source"] = "chatbot"
    return jsonify(_attach_youtube(result))
