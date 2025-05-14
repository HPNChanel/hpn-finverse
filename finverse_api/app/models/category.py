"""
Category model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class Category(Base):
    """Category model for categorizing transactions"""
    
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    icon = Column(String(50), nullable=True)  # Icon name/identifier
    is_expense = Column(Boolean, default=True, nullable=False)  # True if expense category, False if income
    is_default = Column(Boolean, default=False, nullable=False)  # True if system default category
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="category")
    recurring_transactions = relationship("RecurringTransaction", back_populates="category")
    
    def to_dict(self):
        """Convert category to dictionary for serialization"""
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "is_expense": self.is_expense,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 