"""CLI demo: print recommendations for a song (requires FLASK_ENV and dataset)."""

import os
import sys

# Ensure backend directory is on path when run as `python scripts/demo_recommend.py`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("FLASK_ENV", "development")

from app import create_app  # noqa: E402


def main():
    song = input("Enter song name: ").strip()
    app = create_app()
    with app.app_context():
        svc = app.extensions["recommendation_service"]
        results = svc.recommend(song)
    print("\nResult:", results)


if __name__ == "__main__":
    main()
