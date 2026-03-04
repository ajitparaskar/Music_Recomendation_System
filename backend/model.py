import pandas as pd
import os
import requests
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ==============================
# Load Environment Variables
# ==============================
load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# ==============================
# Load Dataset
# ==============================
print("Loading dataset...")

df = pd.read_csv("dataset.csv")
df.dropna(inplace=True)

df['track_name_lower'] = df['track_name'].str.lower()

df['tags'] = (
    df['artists'].astype(str) + " " +
    df['track_genre'].astype(str) + " " +
    df['album_name'].astype(str)
)

print("Creating TF-IDF vectors...")

vectorizer = TfidfVectorizer(stop_words='english')
matrix = vectorizer.fit_transform(df['tags'])

print("Model ready!")
print("Total songs:", len(df))

# ==============================
# Spotify Token
# ==============================
def get_spotify_token():
    try:
        url = "https://accounts.spotify.com/api/token"

        response = requests.post(
            url,
            data={"grant_type": "client_credentials"},
            auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)
        )

        print("Token response:", response.json())  # DEBUG

        return response.json().get("access_token")
    except Exception as e:
        print("Token error:", e)
        return None


spotify_token = get_spotify_token()

# ==============================
# Spotify Enrichment
# ==============================
def enrich_with_spotify(track_name, artist_name):

    global spotify_token

    if not spotify_token:
        return {
            "image": None,
            "preview_url": None,
            "spotify_url": None
        }

    try:
        # Use Spotify Search API instead of direct track_id
        query = f"{track_name} {artist_name}"

        url = "https://api.spotify.com/v1/search"

        headers = {
            "Authorization": f"Bearer {spotify_token}"
        }

        params = {
            "q": query,
            "type": "track",
            "limit": 1
        }

        response = requests.get(url, headers=headers, params=params)

        # If token expired → refresh token once
        if response.status_code == 401:
            spotify_token = get_spotify_token()
            headers["Authorization"] = f"Bearer {spotify_token}"
            response = requests.get(url, headers=headers, params=params)

        if response.status_code != 200:
            return {
                "image": None,
                "preview_url": None,
                "spotify_url": None
            }

        data = response.json()

        if not data["tracks"]["items"]:
            return {
                "image": None,
                "preview_url": None,
                "spotify_url": None
            }

        track = data["tracks"]["items"][0]

        return {
            "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
            "preview_url": track.get("preview_url"),
            "spotify_url": track["external_urls"]["spotify"]
        }

    except Exception as e:
        print("Spotify enrichment error:", e)

        return {
            "image": None,
            "preview_url": None,
            "spotify_url": None
        }

# ==============================
# Recommendation Function
# ==============================
def recommend(song):

    if not song:
        return {"matched_song": None, "recommendations": []}

    song = song.lower()

    matches = df[df['track_name_lower'].str.contains(song, na=False)]

    if matches.empty:
        return {"matched_song": None, "recommendations": []}

    matched_index = matches.index[0]

    matched_title = df.iloc[matched_index]['track_name']
    matched_artist = df.iloc[matched_index]['artists']

    spotify_data = enrich_with_spotify(matched_title, matched_artist)

    matched_song = {
        "title": matched_title,
        "artist": matched_artist,
        "album": df.iloc[matched_index]['album_name'],
        "popularity": int(df.iloc[matched_index]['popularity']),
        "duration_ms": int(df.iloc[matched_index]['duration_ms']),
        "track_id": df.iloc[matched_index]['track_id'],
        "image": spotify_data["image"],
        "preview_url": spotify_data["preview_url"],
        "spotify_url": spotify_data["spotify_url"]
    }

    # Memory efficient similarity
    similarity_scores = cosine_similarity(
        matrix[matched_index],
        matrix
    )[0]

    song_indices = similarity_scores.argsort()[::-1][1:6]

    results = []

    for i in song_indices:

        title = df.iloc[i]['track_name']
        artist = df.iloc[i]['artists']

        spotify_data = enrich_with_spotify(title, artist)

        results.append({
            "title": title,
            "artist": artist,
            "album": df.iloc[i]['album_name'],
            "popularity": int(df.iloc[i]['popularity']),
            "duration_ms": int(df.iloc[i]['duration_ms']),
            "track_id": df.iloc[i]['track_id'],
            "image": spotify_data["image"],
            "preview_url": spotify_data["preview_url"],
            "spotify_url": spotify_data["spotify_url"]
        })

    return {
        "matched_song": matched_song,
        "recommendations": results
    }



# ==============================
# Autocomplete Search
# ==============================
def search_songs(query):

    if not query:
        return []

    query = query.lower()

    matches = df[df['track_name_lower'].str.contains(query, na=False)]

    return matches['track_name'].head(5).tolist()
