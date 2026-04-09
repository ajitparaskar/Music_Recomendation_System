import os
import unittest
from unittest.mock import MagicMock, patch

from app import create_app


class TestYouTubeAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ.setdefault("FLASK_ENV", "development")
        cls.app = create_app()

    def setUp(self):
        self.yt = self.app.extensions["youtube_service"]
        # Service reads key at init_app; tests override the bound client state
        self.yt._api_key = "test-key"
        self.yt._enabled = True
        self.yt._cache.clear()

    def test_get_youtube_video_success(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "items": [{"id": {"videoId": "dQw4w9WgXcQ"}}],
        }
        mock_response.status_code = 200
        self.yt._session.get = MagicMock(return_value=mock_response)

        with self.app.app_context():
            result = self.yt.get_video_id("Never Gonna Give You Up", "Rick Astley")

        self.assertEqual(result, "dQw4w9WgXcQ")

    def test_get_youtube_video_no_results(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"items": []}
        mock_response.status_code = 200
        self.yt._session.get = MagicMock(return_value=mock_response)

        with self.app.app_context():
            result = self.yt.get_video_id("Unknown Song", "Unknown Artist")

        self.assertIsNone(result)

    def test_get_youtube_video_api_error(self):
        self.yt._session.get = MagicMock(side_effect=Exception("API Error"))

        with self.app.app_context():
            result = self.yt.get_video_id("Some Song", "Some Artist")

        self.assertIsNone(result)

    def test_get_youtube_video_no_api_key(self):
        self.yt._api_key = None
        html_response = MagicMock()
        html_response.raise_for_status = MagicMock()
        html_response.text = '"videoId":"dQw4w9WgXcQ"'
        self.yt._session.get = MagicMock(return_value=html_response)

        with self.app.app_context():
            result = self.yt.get_video_id("Some Song", "Some Artist")

        self.assertEqual(result, "dQw4w9WgXcQ")


if __name__ == "__main__":
    unittest.main()
