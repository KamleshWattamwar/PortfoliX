"""
SQLAlchemy ORM models for PortfoliX.
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from backend.database import Base


class Holding(Base):
    """Holding model representing an individual stock position."""
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String, nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    buy_price = Column(Float, nullable=False)
    buy_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
