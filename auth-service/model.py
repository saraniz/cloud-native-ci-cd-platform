from flask_sqlalchemy import SQLAlchemy


# create database object
# this object will manage connections to the db, allow creation of tables and execute queries
db = SQLAlchemy()


# define table name user
# db.Model is the base class for all ORM models
# Each class = one table in the database
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)