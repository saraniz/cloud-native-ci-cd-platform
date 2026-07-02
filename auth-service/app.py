import os
import time
import bcrypt
import traceback

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
from sqlalchemy.exc import OperationalError

from model import db, User
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
    return "Auth Service is running"

# -------------------------
# REGISTER
# -------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate input
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "username and password required"}), 400

    username = data["username"]
    password = data["password"]

    # Check if user already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "user already exists"}), 409

    # Hash password (convert to string for DB safety)
    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user = User(
        username=username,
        password=hashed_password
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "user created"}), 201

# -------------------------
# LOGIN
# -------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    print("Received login:", data)

    # Validate input
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "username and password required"}), 400

    user = User.query.filter_by(username=data["username"]).first()

    print("User found:", user)

    if user:
        print("Stored password:", user.password)
        print(
            "Password match:",
            bcrypt.checkpw(
                data["password"].encode("utf-8"),
                user.password.encode("utf-8")
            )
        )

    if user and bcrypt.checkpw(
        data["password"].encode("utf-8"),
        user.password.encode("utf-8")
    ):
        token = create_access_token(identity=str(user.id))
        return jsonify({"access_token": token}), 200

    return jsonify({"error": "invalid credentials"}), 401

# -------------------------
# HEALTH CHECK
# -------------------------
@app.route("/health")
def health():
    return jsonify({"status": "ok"})

# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5001, debug=True)