import os
os.environ.setdefault("DATABASE_URL", "sqlite:///auth_test.db")
# Import Flask framework core tools
from flask import Flask, request, jsonify

# JWT (JSON Web Token) tools for authentication
from flask_jwt_extended import JWTManager, create_access_token

# Import database instance and User model
from model import db, User

# Import configuration class (DB URL, secret keys, etc.)
from config import Config

# Library for password hashing
import bcrypt

from flask_cors import CORS


# -------------------------
# CREATE FLASK APP
# -------------------------
app = Flask(__name__)

# Load configuration (DB + JWT secret)
app.config.from_object(Config)

CORS(app)

# Bind SQLAlchemy to Flask app
db.init_app(app)

# Initialize JWT manager
jwt = JWTManager(app)


# -------------------------
# SAFE DB INITIALIZATION (IMPORTANT FOR TESTS)
# -------------------------
def init_db():
    with app.app_context():
        db.create_all()


# -------------------------
# ROUTES
# -------------------------
@app.route("/")
def home():
    return "Auth Service is running"


# -------------------------
# REGISTER ENDPOINT
# -------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    hashed = bcrypt.hashpw(
        data["password"].encode(),
        bcrypt.gensalt()
    )

    user = User(
        username=data["username"],
        password=hashed
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "user created"})


# -------------------------
# LOGIN ENDPOINT
# -------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    user = User.query.filter_by(username=data["username"]).first()

    if user and bcrypt.checkpw(
        data["password"].encode(),
        user.password
    ):
        token = create_access_token(identity=user.id)
        return jsonify({"token": token})

    return jsonify({"message": "invalid credentials"}), 401


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
    init_db()
    app.run(host="0.0.0.0", port=5001)