"""
Financial Account model for FinVerse API
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Boolean, Text, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class FinancialAccount(Base):
    """Financial Account model for storing virtual accounts data"""
    
    __tablename__ = "financial_accounts"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., "wallet", "saving", "goal", "investment"
    balance = Column(DECIMAL(18, 8), default=0.00000000, nullable=False, comment="Account balance with financial precision")
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # New fields
    icon = Column(String(50), nullable=True)  # e.g., "wallet", "savings", "rocket"
    color = Column(String(50), nullable=True)  # hex or material color name
    created_by_default = Column(Boolean, default=False, nullable=False)
    note = Column(Text, nullable=True)  # additional description
    currency = Column(String(10), default="USD", nullable=False)  # currency field
    is_hidden = Column(Boolean, default=False, nullable=False, comment="Whether the account is hidden from balance calculations")
    is_active = Column(Boolean, default=True, nullable=False, comment="Whether the account is active")
    
    # Relationships - Fixed with explicit foreign key references
    user = relationship("User", back_populates="financial_accounts")
    
    # Primary transactions relationship using financial_account_id
    transactions = relationship("Transaction", 
                              foreign_keys="Transaction.financial_account_id",
                              back_populates="financial_account", 
                              cascade="all, delete-orphan")
    
    # Backward compatibility relationship using wallet_id
    wallet_transactions = relationship("Transaction", 
                                     foreign_keys="Transaction.wallet_id",
                                     back_populates="wallet", 
                                     cascade="all, delete-orphan",
                                     overlaps="transactions")
    
    financial_goals = relationship("FinancialGoal", back_populates="account", cascade="all, delete-orphan")
    savings_plans = relationship("SavingsPlan", back_populates="source_account")
    
    # TEMPORARILY COMMENTED OUT - stakes relationship until Stake model is properly configured
    # stakes = relationship("Stake", back_populates="financial_account", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert account to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "type": self.type,
            "balance": float(self.balance) if self.balance else 0.0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "icon": self.icon,
            "color": self.color,
            "created_by_default": self.created_by_default,
            "note": self.note,
            "currency": self.currency,
            "is_hidden": self.is_hidden,
            "is_active": self.is_active
        }