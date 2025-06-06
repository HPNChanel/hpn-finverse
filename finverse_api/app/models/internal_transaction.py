"""
Internal Transaction model for FinVerse API
Handles transfers between user's financial accounts
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, BigInteger, DECIMAL, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class InternalTransaction(Base):
    """Internal transaction model for account-to-account transfers"""
    
    __tablename__ = "internal_transactions"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    from_account_id = Column(BigInteger, ForeignKey("financial_accounts.id", ondelete="CASCADE"), nullable=False)
    to_account_id = Column(BigInteger, ForeignKey("financial_accounts.id", ondelete="CASCADE"), nullable=False)
    amount = Column(DECIMAL(18, 8), nullable=False, comment="Transfer amount with financial precision")
    description = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships with string-based references to avoid circular imports
    user = relationship("User", back_populates="internal_transactions")
    from_account = relationship("FinancialAccount", 
                               foreign_keys=[from_account_id],
                               back_populates="outgoing_transfers")
    to_account = relationship("FinancialAccount", 
                             foreign_keys=[to_account_id],
                             back_populates="incoming_transfers")
    
    def to_dict(self):
        """Convert internal transaction to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "from_account_id": self.from_account_id,
            "to_account_id": self.to_account_id,
            "amount": float(self.amount),
            "description": self.description,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
