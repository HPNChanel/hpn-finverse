"""
Financial Goal model for FinVerse API
"""

from datetime import datetime, date
from sqlalchemy import Column, BigInteger, String, Float, DateTime, ForeignKey, Integer, Date, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class FinancialGoal(Base):
    """Financial Goal model for storing user financial goals"""
    
    __tablename__ = "financial_goals"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0, nullable=False)
    start_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, nullable=False, default=2)  # 1=low, 2=medium, 3=high
    status = Column(Integer, nullable=False, default=1)    # 1=ongoing, 2=completed, 3=cancelled
    icon = Column(String(50), nullable=True, default='🎯')
    color = Column(String(20), nullable=True, default='#1976d2')  # HEX color
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="financial_goals")
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage"""
        if self.target_amount <= 0:
            return 0.0
        return min(100.0, (self.current_amount / self.target_amount) * 100)
    
    def to_dict(self):
        """Convert goal to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "target_amount": self.target_amount,
            "current_amount": self.current_amount,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
            "icon": self.icon,
            "color": self.color,
            "progress_percentage": self.progress_percentage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }