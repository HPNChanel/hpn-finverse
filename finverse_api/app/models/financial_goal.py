"""
Financial Goal model for FinVerse API
"""

from datetime import datetime, date
from sqlalchemy import Column, BigInteger, String, Float, DateTime, ForeignKey, Enum, Integer, Numeric, Date, Text
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base


class GoalPriority(str, enum.Enum):
    """Enum for goal priority"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class GoalStatus(str, enum.Enum):
    """Enum for goal status"""
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class FinancialGoal(Base):
    """Financial Goal model for storing user financial goals"""
    
    __tablename__ = "financial_goals"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0, nullable=False)
    priority = Column(String(20), nullable=False, default=GoalPriority.MEDIUM)
    status = Column(String(20), nullable=False, default=GoalStatus.ACTIVE)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    target_date = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)  # HEX color
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="financial_goals")
    
    def to_dict(self):
        """Convert goal to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "target_amount": self.target_amount,
            "current_amount": self.current_amount,
            "priority": self.priority,
            "status": self.status,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "target_date": self.target_date.isoformat() if self.target_date else None
        } 