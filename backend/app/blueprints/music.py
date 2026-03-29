"""Recommendation and search endpoints."""

from flask import Blueprint, current_app, jsonify, request

music_bp = Blueprint("music", __name__)


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
    yt = current_app.extensions["youtube_service"]
    result = svc.recommend(song)

    if current_app.config.get("YOUTUBE_API_ENABLED"):
        if result.get("matched_song"):
            ms = result["matched_song"]
            ms["youtube_video_id"] = yt.get_video_id(
                ms.get("title", "Unknown"), ms.get("artist", "Unknown")
            )

        for rec in result.get("recommendations", []):
            rec["youtube_video_id"] = yt.get_video_id(
                rec.get("title", "Unknown"), rec.get("artist", "Unknown")
            )
    else:
        if result.get("matched_song"):
            result["matched_song"]["youtube_video_id"] = None
        for rec in result.get("recommendations", []):
            rec["youtube_video_id"] = None

    return jsonify(result)


@music_bp.route("/search", methods=["POST"])
def search():
    data = request.get_json(silent=True) or {}
    query = data.get("query")

    svc = current_app.extensions["recommendation_service"]
    results = svc.search_songs(query)
    return jsonify({"suggestions": results})
