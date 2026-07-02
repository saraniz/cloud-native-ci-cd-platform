import os
import pytest

# Ensure a separate test database is used before importing app
os.environ["DATABASE_URL"] = "sqlite:///study_test.db"

from app import app, db
from flask_jwt_extended import create_access_token

@pytest.fixture(autouse=True)
def setup_database():
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()
        db.drop_all()

def test_health():
    client = app.test_client()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"

def test_create_session():
    client = app.test_client()

    with app.app_context():
        token = create_access_token(identity="1")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = client.post("/sessions/start", json={
        "subject": "DevOps Study"
    }, headers=headers)

    assert response.status_code == 201
    assert response.json["message"] == "session started"
    assert "id" in response.json

def test_create_session_missing_subject():
    client = app.test_client()

    with app.app_context():
        token = create_access_token(identity="1")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = client.post("/sessions/start", json={}, headers=headers)
    assert response.status_code == 400

def test_get_sessions():
    client = app.test_client()

    with app.app_context():
        token = create_access_token(identity="1")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Start a session
    client.post("/sessions/start", json={
        "subject": "DevOps Study"
    }, headers=headers)

    response = client.get("/sessions", headers=headers)
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["subject"] == "DevOps Study"
    assert response.json[0]["duration"] == 0

def test_end_session():
    client = app.test_client()

    with app.app_context():
        token = create_access_token(identity="1")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Start a session
    res = client.post("/sessions/start", json={
        "subject": "DevOps Study"
    }, headers=headers)
    session_id = res.json["id"]

    # End the session
    response = client.put(f"/sessions/end/{session_id}", headers=headers)
    assert response.status_code == 200
    assert response.json["message"] == "session ended"