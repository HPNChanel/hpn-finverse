"""
Staking model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class Stake(Base):
    """Stake model for storing stake information"""
    
    __tablename__ = "stakes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="stakes")
    
    def to_dict(self):
        """Convert stake to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": self.amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_amount(self, new_amount):
        """Update stake amount"""
        self.amount = new_amount
        self.updated_at = datetime.utcnow()


class StakingAccount(Base):
    """Staking Account model for storing staking accounts"""
    
    __tablename__ = "staking_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False, unique=True)
    balance = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    
    def to_dict(self):
        """Convert staking account to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "address": self.address,
            "balance": self.balance,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 