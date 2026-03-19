from flask import Flask, request, jsonify
from flask_cors import CORS
from model import recommend, search_songs
from dotenv import load_dotenv
import os
import requests

# ==============================
# Load Environment Variables
# ==============================
load_dotenv()

app = Flask(__name__)
CORS(app)

# YouTube API enabled/disabled flag
YOUTUBE_API_ENABLED = os.getenv("YOUTUBE_API_ENABLED", "true").lower() == "true"

print("YouTube Key Loaded:", os.getenv("YOUTUBE_API_KEY"))
print("YouTube API Enabled:", YOUTUBE_API_ENABLED)


# ==============================
# YouTube Video Cache
# ==============================
youtube_cache = {}

# ==============================
# 🔥 YouTube Search Function
# ==============================
def get_youtube_video(song_name, artist_name):
    # Create cache key
    cache_key = f"{song_name.lower()}_{artist_name.lower()}"

    # Check cache first
    if cache_key in youtube_cache:
        print(f"📺 Using cached YouTube result for: '{song_name}' by '{artist_name}'")
        return youtube_cache[cache_key]

    api_key = os.getenv("YOUTUBE_API_KEY")

    if not api_key:
        print("❌ No YouTube API key found")
        youtube_cache[cache_key] = None
        return None

    search_query = f"{song_name} {artist_name} official song"

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": search_query,
        "key": api_key,
        "type": "video",
        "maxResults": 1
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        print(f"🔍 YouTube Search: '{song_name}' by '{artist_name}'")
        print(f"📊 API Response Status: {response.status_code}")

        if response.status_code == 200 and "items" in data and len(data["items"]) > 0:
            video_id = data["items"][0]["id"]["videoId"]
            video_title = data["items"][0]["snippet"]["title"]
            print(f"✅ Found Video: {video_title} (ID: {video_id})")
            youtube_cache[cache_key] = video_id
            return video_id
        else:
            print(f"❌ No videos found or API error: {data.get('error', {}).get('message', 'Unknown error')}")
            youtube_cache[cache_key] = None
            return None

    except Exception as e:
        print(f"🚨 YouTube API Exception: {e}")
        youtube_cache[cache_key] = None
        return None

    return None


# ==============================
# Routes
# ==============================

@app.route("/")
def home():
    return "AI Music Backend Running 🚀"


@app.route("/recommend", methods=["POST"])
def get_recommendations():
    data = request.json
    song = data.get("song")

    if not song:
        return jsonify({
            "matched_song": None,
            "recommendations": ["No song provided"]
        })

    result = recommend(song)

    # 🔥 Add YouTube video for each recommendation (if enabled)
    if "recommendations" in result and YOUTUBE_API_ENABLED:
        print(f"🎵 Processing {len(result['recommendations'])} recommendations for YouTube videos...")
        for i, rec in enumerate(result["recommendations"]):
            song_title = rec.get("title", "Unknown")
            artist = rec.get("artist", "Unknown")
            print(f"  {i+1}. Searching YouTube for: '{song_title}' by '{artist}'")

            video_id = get_youtube_video(song_title, artist)
            rec["youtube_video_id"] = video_id

            if video_id:
                print(f"     ✅ Added video ID: {video_id}")
            else:
                print(f"     ❌ No video found")

        print(f"📋 YouTube processing complete. Videos found: {sum(1 for r in result['recommendations'] if r.get('youtube_video_id'))}/{len(result['recommendations'])}")
    elif "recommendations" in result and not YOUTUBE_API_ENABLED:
        print("🎵 YouTube API disabled - skipping video search")
        for rec in result["recommendations"]:
            rec["youtube_video_id"] = None

    return jsonify(result)


@app.route("/search", methods=["POST"])
def search():
    data = request.json
    query = data.get("query")

    results = search_songs(query)

    return jsonify({"suggestions": results})


# ==============================
# Run Server
# ==============================
if __name__ == "__main__":
    app.run(debug=True)
