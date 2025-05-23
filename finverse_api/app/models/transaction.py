"""
Transaction model for FinVerse API
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, BigInteger, DECIMAL, String, DateTime, ForeignKey, SMALLINT, Date
from sqlalchemy.orm import relationship

from app.db.session import Base


class TransactionType(int, Enum):
    """Enum for transaction types"""
    EXPENSE = 0
    INCOME = 1


class Transaction(Base):
    """Transaction model for storing transaction history"""
    
    __tablename__ = "transactions"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    wallet_id = Column(BigInteger, ForeignKey("financial_accounts.id", ondelete="CASCADE"), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    transaction_type = Column(SMALLINT, nullable=False)  # 1 = income, 0 = expense
    description = Column(String(255), nullable=True)
    transaction_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    wallet = relationship("FinancialAccount", back_populates="transactions")
    
    def to_dict(self):
        """Convert transaction to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "wallet_id": self.wallet_id,
            "amount": float(self.amount),
            "transaction_type": self.transaction_type,
            "description": self.description,
            "transaction_date": self.transaction_date.isoformat() if self.transaction_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }