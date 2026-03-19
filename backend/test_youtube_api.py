import unittest
from unittest.mock import patch, MagicMock
from app import get_youtube_video

class TestYouTubeAPI(unittest.TestCase):

    @patch('app.requests.get')
    def test_get_youtube_video_success(self, mock_get):
        # Mock the response from YouTube API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "items": [
                {
                    "id": {
                        "videoId": "dQw4w9WgXcQ"
                    }
                }
            ]
        }
        mock_get.return_value = mock_response

        # Call the function
        result = get_youtube_video("Never Gonna Give You Up", "Rick Astley")

        # Assert that it returns the video ID
        self.assertEqual(result, "dQw4w9WgXcQ")

    @patch('app.requests.get')
    def test_get_youtube_video_no_results(self, mock_get):
        # Mock the response with no items
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "items": []
        }
        mock_get.return_value = mock_response

        # Call the function
        result = get_youtube_video("Unknown Song", "Unknown Artist")

        # Assert that it returns None
        self.assertIsNone(result)

    @patch('app.requests.get')
    def test_get_youtube_video_api_error(self, mock_get):
        # Mock an exception
        mock_get.side_effect = Exception("API Error")

        # Call the function
        result = get_youtube_video("Some Song", "Some Artist")

        # Assert that it returns None
        self.assertIsNone(result)

    def test_get_youtube_video_no_api_key(self):
        # Temporarily remove API key
        import os
        original_key = os.environ.get('YOUTUBE_API_KEY')
        os.environ.pop('YOUTUBE_API_KEY', None)

        try:
            result = get_youtube_video("Some Song", "Some Artist")
            self.assertIsNone(result)
        finally:
            if original_key:
                os.environ['YOUTUBE_API_KEY'] = original_key

if __name__ == '__main__':
    unittest.main()