import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

from model import db, StudySession
from config import Config


# -------------------------
# CREATE APP
# -------------------------
app = Flask(__name__)

# Load config from config.py
app.config.from_object(Config)

CORS(app)

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)


# -------------------------
# SAFE DB INIT (important for tests/CI)
# -------------------------
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print("DB init skipped/failed:", e)


# -------------------------
# ROUTES
# -------------------------
@app.route("/")
def home():
    return "Study Service is running"


@app.route("/health")
def health():
    return {"status": "ok"}


# -------------------------
# START STUDY SESSION
# -------------------------
@app.route("/sessions/start", methods=["POST"])
@jwt_required()
def start_session():
    user_id = get_jwt_identity()
    data = request.json

    session = StudySession(
        user_id=user_id,
        subject=data["subject"],
        start_time=str(datetime.datetime.now()),
        end_time="",
        duration=0
    )

    db.session.add(session)
    db.session.commit()

    return jsonify({
        "message": "session started",
        "id": session.id
    })


# -------------------------
# END STUDY SESSION
# -------------------------
@app.route("/sessions/end/<int:id>", methods=["PUT"])
@jwt_required()
def end_session(id):
    session = StudySession.query.get(id)

    if not session:
        return jsonify({"error": "session not found"}), 404

    end_time = datetime.datetime.now()
    start_time = datetime.datetime.fromisoformat(session.start_time)

    session.end_time = str(end_time)
    session.duration = int((end_time - start_time).seconds / 60)

    db.session.commit()

    return jsonify({
        "message": "session ended",
        "duration": session.duration
    })


# -------------------------
# GET SESSIONS (USER ONLY)
# -------------------------
@app.route("/sessions", methods=["GET"])
@jwt_required()
def get_sessions():
    user_id = get_jwt_identity()

    sessions = StudySession.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "subject": s.subject,
            "duration": s.duration
        }
        for s in sessions
    ])


# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)