"""
Budget Plan model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class BudgetPlan(Base):
    """Budget Plan model for storing user budget plans"""
    
    __tablename__ = "budget_plans"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    account_id = Column(BigInteger, ForeignKey("financial_accounts.id"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    limit_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, default=0.0, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    account = relationship("FinancialAccount", back_populates="budget_plans")
    
    def to_dict(self):
        """Convert budget plan to dictionary for serialization"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "account_id": self.account_id,
            "name": self.name,
            "category": self.category,
            "limit_amount": self.limit_amount,
            "spent_amount": self.spent_amount,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }