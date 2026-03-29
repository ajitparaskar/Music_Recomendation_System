"""Development server (do not use in production)."""

import os

from app import create_app

if __name__ == "__main__":
    os.environ.setdefault("FLASK_ENV", "development")
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
