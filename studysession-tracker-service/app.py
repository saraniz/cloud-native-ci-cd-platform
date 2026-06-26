from flask import Flask, request, jsonify

# Database model + ORM session
from model import db, StudySession

# JWT authentication tools
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

# Time handling
import datetime

# Environment variables (DB URL)
import os


# Create Flask app
app = Flask(__name__)


# -------------------------
# CONFIGURATION
# -------------------------

# Database connection (from environment variable)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")

# JWT secret key (used to sign tokens)
app.config["JWT_SECRET_KEY"] = "secret"


# Initialize database with app
db.init_app(app)

# Enable JWT system
jwt = JWTManager(app)


# Create tables automatically if not exist
with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return "Auth Service is running"
# -------------------------
# START STUDY SESSION
# -------------------------
@app.route("/sessions/start", methods=["POST"])
@jwt_required()   # user must be logged in (valid JWT token)

def start_session():

    # Get user ID from JWT token
    user_id = get_jwt_identity()

    # Read request JSON body
    data = request.json

    # Create new study session record
    session = StudySession(
        user_id=user_id,
        subject=data["subject"],

        # Store current time as string
        start_time=str(datetime.datetime.now()),

        # Session not ended yet
        end_time="",
        duration=0
    )

    # Add to database session
    db.session.add(session)

    # Save to database
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

    # Find session by ID
    session = StudySession.query.get(id)

    # Current time = end time
    end_time = datetime.datetime.now()

    # Convert stored string back to datetime
    start_time = datetime.datetime.fromisoformat(session.start_time)

    # Save end time
    session.end_time = str(end_time)

    # Calculate duration in minutes
    session.duration = int((end_time - start_time).seconds / 60)

    # Save changes
    db.session.commit()

    return jsonify({
        "message": "session ended",
        "duration": session.duration
    })


# -------------------------
# GET ALL SESSIONS (USER)
# -------------------------
@app.route("/sessions", methods=["GET"])
@jwt_required()

def get_sessions():

    # Get logged-in user ID
    user_id = get_jwt_identity()

    # Get only sessions for this user
    sessions = StudySession.query.filter_by(user_id=user_id).all()

    # Convert DB objects → JSON
    return jsonify([
        {
            "subject": s.subject,
            "duration": s.duration
        }
        for s in sessions
    ])


# -------------------------
# HEALTH CHECK
# -------------------------
@app.route("/health")
def health():
    return {"status": "ok"}


# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":

    # Run API on port 5001
    app.run(host="0.0.0.0", port=5001)