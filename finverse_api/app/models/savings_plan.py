"""
Savings Plan model for FinVerse API
"""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Integer, Text, DECIMAL, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.db.session import Base


class InterestType(str, Enum):
    SIMPLE = "simple"
    COMPOUND = "compound"


class SavingsPlanStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN_EARLY = "withdrawn_early"
    PAUSED = "paused"


class SavingsPlan(Base):
    """Savings Plan model for storing user savings plans"""
    
    __tablename__ = "savings_plans"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    source_account_id = Column(BigInteger, ForeignKey("financial_accounts.id"), nullable=False, index=True,
                              comment="Financial account from which money is deducted")
    name = Column(String(255), nullable=False)
    initial_amount = Column(DECIMAL(18, 8), nullable=False, default=0.00000000, comment="Initial deposit amount")
    monthly_contribution = Column(DECIMAL(18, 8), nullable=False, comment="Monthly contribution amount")
    interest_rate = Column(DECIMAL(8, 4), nullable=False, comment="Annual interest rate as percentage (e.g., 5.25 for 5.25%)")
    duration_months = Column(Integer, nullable=False, comment="Duration of the plan in months")
    interest_type = Column(SQLEnum(InterestType), nullable=False, default=InterestType.COMPOUND)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # New fields for real balance-based savings
    status = Column(SQLEnum(SavingsPlanStatus), nullable=False, default=SavingsPlanStatus.ACTIVE,
                   comment="Current status of the savings plan")
    current_balance = Column(DECIMAL(18, 8), nullable=False, default=0.00000000,
                           comment="Current accumulated balance in the plan")
    total_contributed = Column(DECIMAL(18, 8), nullable=False, default=0.00000000,
                             comment="Total amount contributed to date")
    total_interest_earned = Column(DECIMAL(18, 8), nullable=False, default=0.00000000,
                                 comment="Total interest earned to date")
    last_contribution_date = Column(DateTime, nullable=True,
                                  comment="Date of last monthly contribution")
    next_contribution_date = Column(DateTime, nullable=True,
                                  comment="Date of next scheduled contribution")
    early_withdrawal_penalty_rate = Column(DECIMAL(5, 4), nullable=False, default=0.10,
                                         comment="Penalty rate for early withdrawal (default 10%)")
    completion_date = Column(DateTime, nullable=True,
                           comment="Date when plan was completed or withdrawn")
    withdrawal_amount = Column(DECIMAL(18, 8), nullable=True,
                             comment="Amount withdrawn if plan was closed early")
    
    # Relationships
    user = relationship("User", back_populates="savings_plans")
    source_account = relationship("FinancialAccount", back_populates="savings_plans")
    projections = relationship("SavingsProjection", back_populates="plan", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="related_savings_plan")
    
    def to_dict(self):
        """Convert savings plan to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "source_account_id": self.source_account_id,
            "name": self.name,
            "initial_amount": float(self.initial_amount) if self.initial_amount else 0.0,
            "monthly_contribution": float(self.monthly_contribution) if self.monthly_contribution else 0.0,
            "interest_rate": float(self.interest_rate) if self.interest_rate else 0.0,
            "duration_months": self.duration_months,
            "interest_type": self.interest_type.value if self.interest_type else InterestType.COMPOUND.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "status": self.status.value if self.status else SavingsPlanStatus.ACTIVE.value,
            "current_balance": float(self.current_balance) if self.current_balance else 0.0,
            "total_contributed": float(self.total_contributed) if self.total_contributed else 0.0,
            "total_interest_earned": float(self.total_interest_earned) if self.total_interest_earned else 0.0,
            "last_contribution_date": self.last_contribution_date.isoformat() if self.last_contribution_date else None,
            "next_contribution_date": self.next_contribution_date.isoformat() if self.next_contribution_date else None,
            "early_withdrawal_penalty_rate": float(self.early_withdrawal_penalty_rate) if self.early_withdrawal_penalty_rate else 0.10,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "withdrawal_amount": float(self.withdrawal_amount) if self.withdrawal_amount else None
        }


class SavingsProjection(Base):
    """Savings Projection model for storing monthly projection data"""
    
    __tablename__ = "savings_projections"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    plan_id = Column(BigInteger, ForeignKey("savings_plans.id"), nullable=False)
    month_index = Column(Integer, nullable=False, comment="Month number (0-based index)")
    balance = Column(DECIMAL(18, 8), nullable=False, comment="Total balance at end of month")
    interest_earned = Column(DECIMAL(18, 8), nullable=False, default=0.00000000, comment="Interest earned this month")
    
    # Relationships
    plan = relationship("SavingsPlan", back_populates="projections")
    
    def to_dict(self):
        """Convert savings projection to dictionary for serialization"""
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "month_index": self.month_index,
            "balance": float(self.balance) if self.balance else 0.0,
            "interest_earned": float(self.interest_earned) if self.interest_earned else 0.0
        } 