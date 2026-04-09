"""End-to-end smoke tests for main API routes (requires app + dataset; Mongo optional for auth)."""

import uuid
from datetime import timedelta

import pytest
from flask_jwt_extended import decode_token


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.get_json()
    assert data["status"] == "ok"
    assert "mongo" in data


def test_search_suggestions(client):
    r = client.post("/search", json={"query": "love"})
    assert r.status_code == 200
    assert len(r.get_json().get("suggestions", [])) >= 1


def test_recommend(client):
    r = client.post("/recommend", json={"song": "love"})
    assert r.status_code == 200
    assert "recommendations" in r.get_json()


def test_moods_list(client):
    r = client.get("/moods")
    assert r.status_code == 200
    assert "moods" in r.get_json()


def test_mood_recommend(client):
    r = client.get("/recommend/mood/happy")
    assert r.status_code == 200


def test_chatbot(client):
    r = client.post("/chatbot/query", json={"query": "happy songs"})
    assert r.status_code == 200


def test_emotion_requires_premium_or_403(client):
    r = client.post("/recommend/emotion", json={"image": None})
    assert r.status_code == 403


def test_register_login_me_favorites_history(client):
    u = f"pytest_{uuid.uuid4().hex[:12]}"
    pw = "TestPass123!"

    reg = client.post("/api/register", json={"username": u, "password": pw})
    if reg.status_code == 503:
        pytest.skip("MongoDB unavailable")

    assert reg.status_code == 201

    log = client.post("/api/login", json={"username": u, "password": pw})
    assert log.status_code == 200
    token = log.get_json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/me", headers=h)
    assert me.status_code == 200
    assert me.get_json().get("user", {}).get("username") == u

    fav = client.post(
        "/api/favorites",
        json={"song_title": "Test Track", "artist": "Test Artist"},
        headers=h,
    )
    assert fav.status_code == 201

    lst = client.get("/api/favorites", headers=h)
    assert lst.status_code == 200
    assert isinstance(lst.get_json(), list)

    hist = client.get("/api/history", headers=h)
    assert hist.status_code == 200

    playlist = client.post("/api/playlists", json={"name": "Road Trip"}, headers=h)
    assert playlist.status_code == 201

    playlists = client.get("/api/playlists", headers=h)
    assert playlists.status_code == 200
    assert isinstance(playlists.get_json(), list)


def test_history_dedupes_same_song(client):
    u = f"pytest_{uuid.uuid4().hex[:12]}"
    pw = "TestPass123!"

    reg = client.post("/api/register", json={"username": u, "password": pw})
    if reg.status_code == 503:
        pytest.skip("MongoDB unavailable")

    assert reg.status_code == 201

    log = client.post("/api/login", json={"username": u, "password": pw})
    assert log.status_code == 200
    token = log.get_json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}

    payload = {
        "song_title": "Repeat Track",
        "artist": "Repeat Artist",
        "track_id": "repeat-track-1",
    }
    first = client.post("/api/history", json=payload, headers=h)
    second = client.post("/api/history", json=payload, headers=h)

    assert first.status_code == 201
    assert second.status_code == 200

    hist = client.get("/api/history", headers=h)
    assert hist.status_code == 200
    entries = [
        item
        for item in hist.get_json()
        if item["song_title"] == payload["song_title"] and item["artist"] == payload["artist"]
    ]
    assert len(entries) == 1


def test_login_token_expiry_uses_app_config(client, app):
    u = f"pytest_{uuid.uuid4().hex[:12]}"
    pw = "TestPass123!"

    reg = client.post("/api/register", json={"username": u, "password": pw})
    if reg.status_code == 503:
        pytest.skip("MongoDB unavailable")

    assert reg.status_code == 201

    log = client.post("/api/login", json={"username": u, "password": pw})
    assert log.status_code == 200

    with app.app_context():
        claims = decode_token(log.get_json()["access_token"])

    assert claims["exp"] - claims["iat"] == int(
        timedelta(days=7).total_seconds()
    )
