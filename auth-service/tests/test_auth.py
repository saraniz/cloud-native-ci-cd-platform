import os

os.environ["DATABASE_URL"] = "sqlite:///auth_test.db"

from app import app


def test_health():
    client = app.test_client()
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_login_route_exists():
    client = app.test_client()

    response = client.post("/login", json={
        "username": "testuser",
        "password": "1234"
    })

    assert response.status_code in [200, 401]