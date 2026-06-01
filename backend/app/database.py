import os
import time
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/inventory_db")

# Smart database engine configuration with automatic SQLite fallback
try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        # Try connecting to PostgreSQL
        engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True
        )
        # Test connection quickly
        conn = engine.connect()
        conn.close()
        print(f"Connected to database: {DATABASE_URL}")
except Exception as e:
    print(f"PostgreSQL connection failed. Falling back to local SQLite database (inventory.db)...")
    DATABASE_URL = "sqlite:///./inventory.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency injection helper to yield active DB sessions and clean them up."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_db(retries=10, delay=2):
    """Utility to wait for database connection to be active before starting app tasks."""
    print("Checking database readiness...")
    for i in range(retries):
        try:
            # Try to connect
            conn = engine.connect()
            conn.close()
            print("Database is ready!")
            return True
        except OperationalError as e:
            print(f"Database connection attempt {i+1}/{retries} failed. Retrying in {delay}s...")
            time.sleep(delay)
    print("Could not connect to the database. Proceeding anyway.")
    return False
