from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# MySQL engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # checks connection before using
    pool_recycle=3600        # avoids MySQL timeout issues
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
