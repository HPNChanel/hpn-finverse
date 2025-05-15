"""
Transaction model for FinVerse API
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class TransactionType(str, Enum):
    """Enum for transaction types"""
    STAKE = "STAKE"
    UNSTAKE = "UNSTAKE"
    TRANSFER = "TRANSFER"
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"


class Transaction(Base):
    """Transaction model for storing transaction history"""
    
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=True)  # Changed from category_id to category string
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    # Removed category relationship
    
    def to_dict(self):
        """Convert transaction to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category": self.category,  # Updated from category_id to category
            "amount": self.amount,
            "transaction_type": self.transaction_type,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }