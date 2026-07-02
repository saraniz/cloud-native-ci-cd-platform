import os
import time
import bcrypt
import traceback

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
from sqlalchemy.exc import OperationalError
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from werkzeug.exceptions import HTTPException

from flask import Response

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

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP Requests",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "Request latency in seconds",
    ["endpoint"]
)


@app.before_request
def start_timer():
    # Store the request start time so after_request can calculate latency.
    request.start_time = time.time()


@app.after_request
def record_metrics(response):
    # Record request count and latency for Prometheus scraping.
    if hasattr(request, "start_time"):
        latency = time.time() - request.start_time
        REQUEST_COUNT.labels(
            request.method,
            request.path,
            response.status_code,
        ).inc()
        REQUEST_LATENCY.labels(request.path).observe(latency)
    return response

# -------------------------
# DB INIT WITH RETRY LOGIC
# -------------------------

def wait_for_db(db, retries=10):
    """Wait for database to become available"""
    for attempt in range(retries):
        try:
            # A successful connection means the database is ready for migrations.
            with db.engine.connect() as conn:
                print(f"[DB] Database connected successfully (attempt {attempt + 1})")
                return True
        except OperationalError as e:
            # Retry while the container or database service is still starting up.
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
            # Wait for the database before creating tables so startup is resilient.
            wait_for_db(db)
            
            # Create the schema needed by the auth service.
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
    # Return a JSON error payload while also printing the stack trace for debugging.
    print(traceback.format_exc())
    if isinstance(e, HTTPException):
        return jsonify({"error": e.description}), e.code
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

    # Validate the payload before touching the database.
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "username and password required"}), 400

    username = data["username"]
    password = data["password"]

    # Reject duplicate usernames instead of overwriting the existing account.
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "user already exists"}), 409

    # Hash the password before persisting it; only the hash is stored.
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

    # Validate the payload before querying the user table.
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
        # Issue a JWT so the frontend can authenticate subsequent requests.
        token = create_access_token(identity=str(user.id))
        return jsonify({"access_token": token}), 200

    return jsonify({"error": "invalid credentials"}), 401

# -------------------------
# HEALTH CHECK
# -------------------------
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5001, debug=True)