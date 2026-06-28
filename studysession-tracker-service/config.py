# import os # get access os functions

# # store all configuration settings. Used to store settings for your Flask application in one place.
# class Config:
#     # get database url or use default one
#     SQLALCHEMY_DATABASE_URI = os.getenv(
#         "DATABASE_URL",
#         "postgresql://admin:admin123@localhost:5432/studydb"
#     )
#     JWT_SECRET_KEY = "secret"
import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///study_test.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "secret"