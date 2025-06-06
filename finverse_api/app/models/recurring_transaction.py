"""
Recurring Transaction model for FinVerse API
Handles scheduled and recurring transactions like subscriptions, salaries, etc.
"""

from __future__ import annotations
from datetime import datetime, date
from sqlalchemy import Column, BigInteger, DECIMAL, String, DateTime, ForeignKey, Text, Boolean, Integer, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class RecurringTransaction(Base):
    """Recurring transaction model for scheduled transactions"""
    
    __tablename__ = "recurring_transactions"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    financial_account_id = Column(BigInteger, ForeignKey("financial_accounts.id", ondelete="CASCADE"), nullable=True)
    category_id = Column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    # Transaction details
    amount = Column(DECIMAL(18, 8), nullable=False, comment="Transaction amount with financial precision")
    description = Column(String(255), nullable=False)
    note = Column(Text, nullable=True)
    
    # Recurring schedule
    frequency = Column(String(50), nullable=False, comment="daily, weekly, monthly, yearly")
    interval_count = Column(Integer, default=1, nullable=False, comment="Every X intervals (e.g., every 2 weeks)")
    start_date = Column(Date, nullable=False, comment="When recurring starts")
    end_date = Column(Date, nullable=True, comment="When recurring ends (null = indefinite)")
    next_due_date = Column(Date, nullable=False, comment="Next scheduled execution")
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    auto_execute = Column(Boolean, default=False, nullable=False, comment="Automatically create transactions")
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_executed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="recurring_transactions")
    financial_account = relationship("FinancialAccount", back_populates="recurring_transactions")
    category = relationship("Category", back_populates="recurring_transactions")
    
    def to_dict(self):
        """Convert recurring transaction to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "financial_account_id": self.financial_account_id,
            "category_id": self.category_id,
            "amount": float(self.amount),
            "description": self.description,
            "note": self.note,
            "frequency": self.frequency,
            "interval_count": self.interval_count,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "next_due_date": self.next_due_date.isoformat() if self.next_due_date else None,
            "is_active": self.is_active,
            "auto_execute": self.auto_execute,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_executed_at": self.last_executed_at.isoformat() if self.last_executed_at else None
        }
