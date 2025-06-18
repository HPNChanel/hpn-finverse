"""
Transaction model for FinVerse API
"""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, BigInteger, DECIMAL, String, DateTime, ForeignKey, SMALLINT, Date, Boolean, Integer, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class TransactionType(int, Enum):
    """Enum for transaction types - CORRECTED ORDER"""
    INCOME = 0   # 0 = income
    EXPENSE = 1  # 1 = expense


class SavingsTransactionType(str, Enum):
    """Enum for savings-related transaction types"""
    SAVING_DEPOSIT = "saving_deposit"           # Initial deposit to savings plan
    MONTHLY_CONTRIBUTION = "monthly_contribution"  # Monthly auto-deduction
    EARLY_WITHDRAWAL = "early_withdrawal"       # Early withdrawal from plan
    PLAN_COMPLETION = "plan_completion"         # Final payout when plan completes
    PENALTY_DEDUCTION = "penalty_deduction"     # Penalty for early withdrawal


class Transaction(Base):
    """Transaction model for storing transaction history"""
    
    __tablename__ = "transactions"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    financial_account_id = Column(BigInteger, ForeignKey("financial_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    # Keep wallet_id as alias for backward compatibility
    wallet_id = Column(BigInteger, ForeignKey("financial_accounts.id", ondelete="CASCADE"), nullable=True, index=True)
    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=True)
    budget_id = Column(BigInteger, ForeignKey("budgets.id"), nullable=True, index=True, comment="Optional budget this transaction belongs to")
    amount = Column(DECIMAL(18, 8), nullable=False, comment="Transaction amount with financial precision")
    transaction_type = Column(SMALLINT, nullable=False)  # 1 = income, 0 = expense
    description = Column(String(255), nullable=True)
    transaction_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # New fields for savings operations
    related_savings_plan_id = Column(BigInteger, ForeignKey("savings_plans.id"), nullable=True, index=True,
                                   comment="Related savings plan ID for savings transactions")
    savings_transaction_type = Column(String(50), nullable=True, 
                                    comment="Type of savings transaction (saving_deposit, monthly_contribution, etc.)")
    note = Column(Text, nullable=True, comment="Additional notes for the transaction")
    
    # Additional account tracking for transfers/withdrawals
    source_account_id = Column(BigInteger, ForeignKey("financial_accounts.id"), nullable=True, index=True,
                              comment="Source account for the transaction (especially for savings)")
    destination_account_id = Column(BigInteger, ForeignKey("financial_accounts.id"), nullable=True, index=True,
                                   comment="Destination account for the transaction (for withdrawals/transfers)")
    
    # Relationships - Fixed with explicit foreign keys
    user = relationship("User", back_populates="transactions")
    financial_account = relationship("FinancialAccount", 
                                   foreign_keys=[financial_account_id], 
                                   back_populates="transactions")
    # Keep wallet relationship for backward compatibility with explicit foreign key
    wallet = relationship("FinancialAccount", 
                         foreign_keys=[wallet_id], 
                         back_populates="wallet_transactions",
                         overlaps="financial_account")
    category = relationship("Category", back_populates="transactions")
    budget = relationship("Budget", back_populates="transactions")
    related_savings_plan = relationship("SavingsPlan", back_populates="transactions")
    
    # Additional account relationships for transfers
    source_account = relationship("FinancialAccount", 
                                foreign_keys=[source_account_id],
                                overlaps="financial_account,wallet")
    destination_account = relationship("FinancialAccount", 
                                     foreign_keys=[destination_account_id],
                                     overlaps="financial_account,wallet")
    
    @property
    def transaction_type_enum(self):
        """Get transaction type as enum safely"""
        try:
            return TransactionType(self.transaction_type)
        except (ValueError, TypeError):
            # Fallback for invalid values
            return TransactionType.EXPENSE if self.transaction_type == 0 else TransactionType.INCOME
    
    @staticmethod
    def get_transaction_type_value(transaction_type):
        """Safely get the integer value from transaction type enum or int"""
        if hasattr(transaction_type, 'value'):
            return transaction_type.value
        return int(transaction_type)
    
    def to_dict(self):
        """Convert transaction to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "financial_account_id": self.financial_account_id,
            "wallet_id": self.wallet_id or self.financial_account_id,  # Backward compatibility
            "category_id": self.category_id,
            "budget_id": self.budget_id,
            "amount": float(self.amount),
            "transaction_type": self.transaction_type,
            "description": self.description,
            "transaction_date": self.transaction_date.isoformat() if self.transaction_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "related_savings_plan_id": self.related_savings_plan_id,
            "savings_transaction_type": self.savings_transaction_type,
            "note": self.note
        }