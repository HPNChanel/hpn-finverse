"""
Staking model for FinVerse API
"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, BigInteger, Float, String, DateTime, ForeignKey, Enum, Integer, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class StakeStatus(str, PyEnum):
    """Enum for stake status"""
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Stake(Base):
    """Stake model for storing user stakes"""
    
    __tablename__ = "stakes"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True, unique=True)
    amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default=StakeStatus.PENDING)
    stake_period = Column(Integer, nullable=False)  # in days
    interest_earned = Column(Float, default=0.0, nullable=False)
    balance = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="stakes")
    
    def to_dict(self):
        """Convert stake to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "address": self.address,
            "amount": self.amount,
            "interest_rate": self.interest_rate,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "stake_period": self.stake_period,
            "interest_earned": self.interest_earned,
            "balance": self.balance,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_amount(self, new_amount):
        """Update stake amount"""
        self.amount = new_amount
        self.updated_at = datetime.utcnow()
        
    def update_balance(self, new_balance):
        """Update stake balance"""
        self.balance = new_balance
        self.updated_at = datetime.utcnow() 