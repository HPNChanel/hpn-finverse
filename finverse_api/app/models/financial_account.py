"""
Financial Account model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class FinancialAccount(Base):
    """Financial Account model for storing virtual accounts data"""
    
    __tablename__ = "financial_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., "wallet", "saving", "goal", "investment"
    balance = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # New fields
    icon = Column(String(50), nullable=True)  # e.g., "wallet", "savings", "rocket"
    color = Column(String(50), nullable=True)  # hex or material color name
    created_by_default = Column(Boolean, default=False, nullable=False)
    note = Column(Text, nullable=True)  # additional description
    currency = Column(String(10), default="USD", nullable=False)  # currency field
    
    # Relationships
    user = relationship("User", back_populates="financial_accounts")
    transactions_from = relationship(
        "InternalTransaction", 
        foreign_keys="InternalTransaction.from_account_id",
        back_populates="from_account", 
        cascade="all, delete-orphan"
    )
    transactions_to = relationship(
        "InternalTransaction", 
        foreign_keys="InternalTransaction.to_account_id",
        back_populates="to_account", 
        cascade="all, delete-orphan"
    )
    budget_plans = relationship("BudgetPlan", back_populates="account", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert account to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "type": self.type,
            "balance": self.balance,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "icon": self.icon,
            "color": self.color,
            "created_by_default": self.created_by_default,
            "note": self.note,
            "currency": self.currency
        }