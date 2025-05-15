"""
Recurring Transaction model for FinVerse API
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, Numeric, Text, Date, DateTime, ForeignKey, Boolean, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class RecurringTransaction(Base):
    """Recurring Transaction model for scheduling regular transactions"""
    
    __tablename__ = "recurring_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=False)  # New string field replacing category_id
    wallet_id = Column(Integer, ForeignKey("financial_accounts.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_type = Column(Integer, nullable=False)  # 0=expense, 1=income
    description = Column(Text, nullable=True)
    frequency_type = Column(Integer, nullable=False)  # 1=daily, 2=weekly, 3=monthly, 4=yearly
    frequency_value = Column(Integer, nullable=False)  # e.g., day of month or weekday
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    next_occurrence = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="recurring_transactions")
    wallet = relationship("FinancialAccount", foreign_keys=[wallet_id])