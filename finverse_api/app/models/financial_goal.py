"""
Financial Goal model for FinVerse API
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class FinancialGoal(Base):
    """Financial Goal model for storing user financial goals"""
    
    __tablename__ = "financial_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(10, 2), nullable=False)
    current_amount = Column(Numeric(10, 2), default=0, nullable=False)
    start_date = Column(Date, nullable=False, default=date.today)
    target_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=2, nullable=False)  # 1=low, 2=medium, 3=high
    status = Column(Integer, default=1, nullable=False)    # 1=ongoing, 2=completed, 3=cancelled
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)  # HEX color
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="financial_goals") 