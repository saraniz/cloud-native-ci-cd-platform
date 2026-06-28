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

# Create Flask application instance
app = Flask(__name__)

# Load configuration (database, JWT secret, etc.)
app.config.from_object(Config)

CORS(app)

# Bind SQLAlchemy database to Flask app
db.init_app(app)

# Initialize JWT manager for token creation/verification
jwt = JWTManager(app)


# Create database tables if they don't exist
# Must run inside application context
with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return "Auth Service is running"

# -------------------------
# REGISTER ENDPOINT
# -------------------------
@app.route("/register", methods=["POST"])
def register():

    # Read JSON data from request body
    data = request.json

    # Hash the password using bcrypt
    # convert string → bytes using .encode()
    hashed = bcrypt.hashpw(
        data["password"].encode(),
        bcrypt.gensalt()
    )

    # Create new user object
    user = User(
        username=data["username"],
        password=hashed
    )

    # Add user to database session
    db.session.add(user)

    # Commit transaction (save to DB)
    db.session.commit()

    # Return success response
    return jsonify({"message": "user created"})


# -------------------------
# LOGIN ENDPOINT
# -------------------------
@app.route("/login", methods=["POST"])
def login():

    # Read login data from request
    data = request.json

    # Find user in database by username
    user = User.query.filter_by(username=data["username"]).first()

    # Check if user exists AND password matches
    if user and bcrypt.checkpw(
        data["password"].encode(),
        user.password
    ):

        # Create JWT token using user ID as identity
        token = create_access_token(identity=user.id)

        # Return token to client
        return jsonify({"token": token})

    # If authentication fails
    return jsonify({"message": "invalid credentials"}), 401


# -------------------------
# HEALTH CHECK ENDPOINT
# -------------------------
@app.route("/health")
def health():

    # Simple API status check
    return {"status": "ok"}


# -------------------------
# RUN APPLICATION
# -------------------------
if __name__ == "__main__":

    # Run Flask server
    # host=0.0.0.0 → accessible from outside container/machine
    # port=5000 → default Flask API port
    app.run(host="0.0.0.0", port=5001)