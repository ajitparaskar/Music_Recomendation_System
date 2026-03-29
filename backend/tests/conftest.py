import os

import pytest

os.environ.setdefault("FLASK_ENV", "development")


@pytest.fixture(scope="session")
def app():
    from app import create_app

    return create_app()


@pytest.fixture
def client(app):
    return app.test_client()
