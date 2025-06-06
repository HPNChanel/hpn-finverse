"""
Budget model for FinVerse API - Unified budget data model
"""

from __future__ import annotations
from datetime import datetime, date
from sqlalchemy import Column, BigInteger, String, DateTime, Date, ForeignKey, Boolean, Enum as SQLEnum, Text, DECIMAL, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property 

from app.db.session import Base
from app.schemas.budget import BudgetPeriod, BudgetStatus, AlertThreshold


class Budget(Base):
    """
    Unified Budget model for storing user budgets per category
    Replaces all legacy budget_plan functionality
    """
    
    __tablename__ = "budgets"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    limit_amount = Column(DECIMAL(18, 8), nullable=False, comment="Budget limit with financial precision")
    spent_amount = Column(DECIMAL(18, 8), default=0.00000000, nullable=False, comment="Amount spent in this budget")
    period_type = Column(SQLEnum(BudgetPeriod), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    alert_threshold = Column(SQLEnum(AlertThreshold), default=AlertThreshold.PERCENT_75, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(SQLEnum(BudgetStatus), default=BudgetStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
    transactions = relationship("Transaction", back_populates="budget")
    alerts = relationship("BudgetAlert", back_populates="budget", cascade="all, delete-orphan")
    
    @hybrid_property
    def remaining_amount(self):
        """Calculate remaining budget amount"""
        return max(0, self.limit_amount - self.spent_amount)
    
    @hybrid_property
    def usage_percentage(self):
        """Calculate budget usage percentage"""
        if self.limit_amount <= 0:
            return 0.0
        return min(100.0, (float(self.spent_amount) / float(self.limit_amount)) * 100)
    
    @hybrid_property
    def days_remaining(self):
        """Calculate days remaining in budget period"""
        if not self.end_date:
            return None
        today = date.today()
        if today > self.end_date:
            return 0
        return (self.end_date - today).days
    
    def update_status(self):
        """Update budget status based on usage and dates"""
        if not self.is_active:
            self.status = BudgetStatus.PAUSED
        elif self.end_date and date.today() > self.end_date:
            self.status = BudgetStatus.COMPLETED
        elif self.spent_amount >= self.limit_amount:
            self.status = BudgetStatus.EXCEEDED
        else:
            self.status = BudgetStatus.ACTIVE
    
    def should_alert(self) -> bool:
        """Check if budget should trigger an alert"""
        threshold_map = {
            AlertThreshold.PERCENT_50: 50.0,
            AlertThreshold.PERCENT_75: 75.0,
            AlertThreshold.PERCENT_90: 90.0,
            AlertThreshold.PERCENT_100: 100.0
        }
        
        threshold_value = threshold_map.get(self.alert_threshold, 75.0)
        return self.usage_percentage >= threshold_value


class BudgetAlert(Base):
    """Budget alert model for storing budget threshold alerts"""
    
    __tablename__ = "budget_alerts"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    budget_id = Column(BigInteger, ForeignKey("budgets.id"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    threshold_type = Column(SQLEnum(AlertThreshold), nullable=False)
    current_percentage = Column(Float, nullable=False)
    amount_spent = Column(DECIMAL(18, 8), nullable=False, comment="Amount spent when alert was triggered")
    budget_limit = Column(DECIMAL(18, 8), nullable=False, comment="Budget limit when alert was triggered")
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    budget = relationship("Budget", back_populates="alerts")
    user = relationship("User", back_populates="budget_alerts")
