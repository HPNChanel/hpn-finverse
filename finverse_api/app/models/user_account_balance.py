"""
User Account Balance model for FinVerse API
Tracks the total available balance for each user for savings operations
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, BigInteger, DECIMAL, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class UserAccountBalance(Base):
    """User Account Balance model for tracking total available balance"""
    
    __tablename__ = "user_account_balances"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    total_balance = Column(DECIMAL(18, 8), default=0.00000000, nullable=False, 
                          comment="Total available balance for savings and operations")
    currency = Column(String(10), default="USD", nullable=False)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="account_balance")
    
    def to_dict(self):
        """Convert balance to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "total_balance": float(self.total_balance) if self.total_balance else 0.0,
            "currency": self.currency,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        } 