"""
User model for FinVerse API
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, BigInteger, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class User(Base):
    """User model for storing user data with email-based authentication"""
    
    __tablename__ = "users"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False, comment="Email address for authentication")
    name = Column(String(255), nullable=False, comment="User's display name")
    hashed_password = Column(String(255), nullable=False, comment="Hashed password for authentication")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Optional avatar field for future use
    avatar_url = Column(String(255), nullable=True, comment="URL to user avatar image")
    
    # Relationships - Using forward references to avoid circular imports
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    financial_accounts = relationship("FinancialAccount", back_populates="user", cascade="all, delete-orphan")
    financial_goals = relationship("FinancialGoal", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    budget_alerts = relationship("BudgetAlert", back_populates="user", cascade="all, delete-orphan")
    stakes = relationship("Stake", back_populates="user", cascade="all, delete-orphan")  # Only unified Stake
    staking_logs = relationship("StakingLog", back_populates="user", cascade="all, delete-orphan")
    savings_plans = relationship("SavingsPlan", back_populates="user", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    account_balance = relationship("UserAccountBalance", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert user to dictionary for serialization"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "avatar_url": self.avatar_url
        }

    def check_password(self, password: str) -> bool:
        """Check if provided password matches the hashed password"""
        from app.core.security import verify_password
        return verify_password(password, self.hashed_password)