import os
import time
import datetime
import traceback

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from sqlalchemy.exc import OperationalError

from model import db, StudySession
from config import Config

# -------------------------
# FLASK APP
# -------------------------
app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}}, supports_credentials=True)

db.init_app(app)
jwt = JWTManager(app)

# -------------------------
# DB INIT WITH RETRY LOGIC
# -------------------------

def wait_for_db(db, retries=10):
    """Wait for database to become available"""
    for attempt in range(retries):
        try:
            with db.engine.connect() as conn:
                print(f"[DB] Database connected successfully (attempt {attempt + 1})")
                return True
        except OperationalError as e:
            print(f"[DB] Waiting for DB... (attempt {attempt + 1}/{retries})")
            if attempt < retries - 1:
                time.sleep(2)
            else:
                print(f"[DB] Failed to connect to database after {retries} attempts")
                raise e
    return False

def init_db():
    """Initialize database with retry logic"""
    with app.app_context():
        try:
            # Wait for database to be ready
            wait_for_db(db)
            
            # Create all tables
            db.create_all()
            print("[DB] Database tables created successfully")
        except Exception as e:
            print(f"[DB] Database initialization failed: {e}")
            raise e

# -------------------------
# ERROR HANDLER (IMPORTANT DEBUG TOOL)
# -------------------------
@app.errorhandler(Exception)
def handle_error(e):
    print(traceback.format_exc())
    return jsonify({"error": str(e)}), 500

# -------------------------
# HOME
# -------------------------
@app.route("/")
def home():
    return "Study Service is running"

# -------------------------
# START STUDY SESSION
# -------------------------
@app.route("/sessions/start", methods=["POST"])
@jwt_required()
def start_session():
    # Extract identity and convert to int for db safety
    raw_user_id = get_jwt_identity()
    try:
        user_id = int(raw_user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity in token"}), 401

    data = request.get_json()

    if not data or "subject" not in data:
        return jsonify({"error": "subject is required"}), 400

    session = StudySession(
        user_id=user_id,
        subject=data["subject"],
        start_time=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        end_time="",
        duration=0
    )

    db.session.add(session)
    db.session.commit()

    return jsonify({
        "message": "session started",
        "id": session.id
    }), 201

# -------------------------
# END STUDY SESSION
# -------------------------
@app.route("/sessions/end/<int:id>", methods=["PUT"])
@jwt_required()
def end_session(id):
    session = db.session.get(StudySession, id)

    if not session:
        return jsonify({"error": "session not found"}), 404

    end_time = datetime.datetime.now(datetime.timezone.utc)
    try:
        start_time = datetime.datetime.fromisoformat(session.start_time)
        session.duration = int((end_time - start_time).seconds / 60)
    except Exception:
        # Fallback if start_time is not in ISO format or invalid
        session.duration = 0

    session.end_time = end_time.isoformat()
    db.session.commit()

    return jsonify({
        "message": "session ended",
        "duration": session.duration
    }), 200

# -------------------------
# GET SESSIONS (USER ONLY)
# -------------------------
@app.route("/sessions", methods=["GET"])
@jwt_required()
def get_sessions():
    raw_user_id = get_jwt_identity()
    try:
        user_id = int(raw_user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "invalid user identity in token"}), 401

    sessions = StudySession.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": s.id,
            "subject": s.subject,
            "duration": s.duration,
            "start_time": s.start_time,
            "end_time": s.end_time
        }
        for s in sessions
    ]), 200

# -------------------------
# HEALTH CHECK
# -------------------------
@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200

# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5002, debug=True)