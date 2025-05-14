"""
Internal Transaction model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class InternalTransaction(Base):
    """Internal Transaction model for storing transfers between accounts"""
    
    __tablename__ = "internal_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    from_account_id = Column(Integer, ForeignKey("financial_accounts.id"), nullable=False)
    to_account_id = Column(Integer, ForeignKey("financial_accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    note = Column(Text, nullable=True)
    
    # Relationships
    from_account = relationship(
        "FinancialAccount", 
        foreign_keys=[from_account_id], 
        back_populates="transactions_from"
    )
    to_account = relationship(
        "FinancialAccount", 
        foreign_keys=[to_account_id], 
        back_populates="transactions_to"
    )
    
    def to_dict(self):
        """Convert transaction to dictionary for serialization"""
        return {
            "id": self.id,
            "from_account_id": self.from_account_id,
            "to_account_id": self.to_account_id,
            "amount": self.amount,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "note": self.note
        } 