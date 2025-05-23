"""
User model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, BigInteger, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    """User model for storing user data"""
    
    __tablename__ = "users"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(100), nullable=False)  # Note: In a real app, this would be hashed
    name = Column(String(255), nullable=True)  # Add name column
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    stakes = relationship("Stake", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    financial_accounts = relationship("FinancialAccount", back_populates="user", cascade="all, delete-orphan")
    financial_goals = relationship("FinancialGoal", back_populates="user", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert user to dictionary for serialization"""
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }