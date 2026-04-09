"""
Production entry point for Flask app
"""

from app import create_app

# Create app instance (GLOBAL — required for Gunicorn)
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)