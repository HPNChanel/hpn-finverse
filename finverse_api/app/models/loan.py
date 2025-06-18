"""
Loan models for FinVerse API - Data Layer (Clean Architecture)

This module implements loan-related data models:
- Loan entity with various loan types and configurations
- Interest rate models (fixed, variable, hybrid)
- Amortization methods and calculations
- Support for different repayment frequencies

Architecture Layer: DATA LAYER
Dependencies: → Database (MySQL)
Used by: Services Layer
"""

from sqlalchemy import Column, Integer, BigInteger, String, Float, Date, DateTime, Boolean, Text, Enum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from enum import Enum as PyEnum
from decimal import Decimal
from typing import Optional
import uuid
from datetime import datetime, date


class LoanType(PyEnum):
    """Enumeration of available loan types"""
    PERSONAL = "personal"
    MORTGAGE = "mortgage"
    EDUCATION = "education"
    BUSINESS = "business"
    AUTO = "auto"
    HOME_IMPROVEMENT = "home_improvement"
    CREDIT_CARD = "credit_card"
    OTHER = "other"


class InterestType(PyEnum):
    """Enumeration of interest rate types"""
    FIXED = "fixed"
    VARIABLE = "variable"
    HYBRID = "hybrid"


class AmortizationType(PyEnum):
    """Enumeration of amortization methods"""
    REDUCING_BALANCE = "reducing_balance"  # Standard EMI method
    FLAT_RATE = "flat_rate"  # Simple interest method
    BULLET_PAYMENT = "bullet_payment"  # Interest-only with principal at end


class RepaymentFrequency(PyEnum):
    """Enumeration of repayment frequencies"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUALLY = "semi_annually"
    ANNUALLY = "annually"


class LoanStatus(PyEnum):
    """Enumeration of loan statuses"""
    SIMULATED = "simulated"  # Just a simulation
    ACTIVE = "active"  # Real loan being tracked
    COMPLETED = "completed"  # Fully paid off
    DEFAULTED = "defaulted"  # In default
    CANCELLED = "cancelled"  # Cancelled simulation


class Loan(Base):
    """
    Loan model for loan simulation and tracking
    
    Supports various loan types, interest models, and repayment schedules
    Can be used for both simulation and real loan tracking
    """
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    
    # Loan Basic Information
    loan_name = Column(String(200), nullable=False)  # User-defined name for the loan
    loan_type = Column(Enum(LoanType), nullable=False, default=LoanType.PERSONAL)
    purpose = Column(String(500), nullable=True)  # Detailed purpose description
    
    # Financial Details
    principal_amount = Column(Numeric(15, 2), nullable=False)  # Original loan amount
    current_balance = Column(Numeric(15, 2), nullable=False)  # Remaining balance
    interest_rate = Column(Numeric(8, 4), nullable=False)  # Annual interest rate (percentage)
    
    # Interest Configuration
    interest_type = Column(Enum(InterestType), nullable=False, default=InterestType.FIXED)
    variable_rate_adjustment_frequency = Column(Integer, nullable=True)  # Months between adjustments
    hybrid_fixed_period = Column(Integer, nullable=True)  # Months of fixed rate in hybrid model
    
    # Loan Terms
    loan_term_months = Column(Integer, nullable=False)  # Total loan term in months
    repayment_frequency = Column(Enum(RepaymentFrequency), nullable=False, default=RepaymentFrequency.MONTHLY)
    amortization_type = Column(Enum(AmortizationType), nullable=False, default=AmortizationType.REDUCING_BALANCE)
    
    # Dates
    start_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    
    # Calculated Fields
    emi_amount = Column(Numeric(15, 2), nullable=False)  # Equal Monthly Installment
    total_interest = Column(Numeric(15, 2), nullable=False)  # Total interest over loan term
    total_payment = Column(Numeric(15, 2), nullable=False)  # Total amount to be paid
    
    # Status and Tracking
    status = Column(Enum(LoanStatus), nullable=False, default=LoanStatus.SIMULATED)
    is_simulation = Column(Boolean, nullable=False, default=True)
    payments_made = Column(Integer, nullable=False, default=0)
    last_payment_date = Column(Date, nullable=True)
    next_payment_date = Column(Date, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    simulation_uuid = Column(String(36), nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Additional Configuration (JSON-like storage in text)
    additional_config = Column(Text, nullable=True)  # JSON string for extra configurations
    notes = Column(Text, nullable=True)  # User notes about the loan
    
    # Relationships
    user = relationship("User", back_populates="loans")
    repayment_schedule = relationship("LoanRepaymentSchedule", back_populates="loan", cascade="all, delete-orphan")
    payments = relationship("LoanPayment", back_populates="loan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Loan(id={self.id}, user_id={self.user_id}, type={self.loan_type}, amount={self.principal_amount})>"


class LoanRepaymentSchedule(Base):
    """
    Detailed repayment schedule for each loan installment
    
    Generated when loan is created, contains the full amortization schedule
    """
    __tablename__ = "loan_repayment_schedules"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False, index=True)
    
    # Schedule Details
    installment_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    due_date = Column(Date, nullable=False, index=True)
    
    # Payment Breakdown
    installment_amount = Column(Numeric(15, 2), nullable=False)  # Total payment for this installment
    principal_component = Column(Numeric(15, 2), nullable=False)  # Principal portion
    interest_component = Column(Numeric(15, 2), nullable=False)  # Interest portion
    
    # Balance Information
    opening_balance = Column(Numeric(15, 2), nullable=False)  # Balance at start of period
    closing_balance = Column(Numeric(15, 2), nullable=False)  # Balance after payment
    
    # Status
    is_paid = Column(Boolean, nullable=False, default=False)
    paid_date = Column(Date, nullable=True)
    paid_amount = Column(Numeric(15, 2), nullable=True)
    
    # Late Payment Tracking
    is_overdue = Column(Boolean, nullable=False, default=False)
    days_overdue = Column(Integer, nullable=True)
    late_fee = Column(Numeric(15, 2), nullable=True, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    loan = relationship("Loan", back_populates="repayment_schedule")
    
    def __repr__(self):
        return f"<LoanRepaymentSchedule(loan_id={self.loan_id}, installment={self.installment_number}, due={self.due_date})>"


class LoanPayment(Base):
    """
    Record of actual payments made towards a loan
    
    Tracks all payments including regular installments, extra payments, and prepayments
    """
    __tablename__ = "loan_payments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("loan_repayment_schedules.id"), nullable=True, index=True)
    
    # Payment Details
    payment_date = Column(Date, nullable=False, index=True)
    payment_amount = Column(Numeric(15, 2), nullable=False)
    payment_type = Column(String(50), nullable=False, default="regular")  # regular, extra, prepayment
    
    # Payment Breakdown
    principal_paid = Column(Numeric(15, 2), nullable=False)
    interest_paid = Column(Numeric(15, 2), nullable=False)
    late_fee_paid = Column(Numeric(15, 2), nullable=False, default=0)
    
    # Payment Method and Reference
    payment_method = Column(String(100), nullable=True)  # bank_transfer, check, online, etc.
    payment_reference = Column(String(200), nullable=True)  # Transaction reference number
    
    # Status
    is_simulated = Column(Boolean, nullable=False, default=True)  # True for simulation payments
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Relationships
    loan = relationship("Loan", back_populates="payments")
    schedule = relationship("LoanRepaymentSchedule")
    
    def __repr__(self):
        return f"<LoanPayment(loan_id={self.loan_id}, amount={self.payment_amount}, date={self.payment_date})>"


# Add to User model relationship (to be added to existing User model)
# loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan") 