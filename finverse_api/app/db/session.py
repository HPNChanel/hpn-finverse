"""
Database session and engine setup
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# MySQL connection string
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:HPNChanel1312$@localhost:3306/finverse_db"

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get a database session
def get_db():
    """
    Get a database session and ensure it's closed after use
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 