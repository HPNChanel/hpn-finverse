"""
Budget Plan model for FinVerse API
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class BudgetPlan(Base):
    """Budget Plan model for tracking spending limits"""
    
    __tablename__ = "budget_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("financial_accounts.id"), nullable=False)
    category = Column(String(100), nullable=False)
    limit_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # "active", "exceeded", "completed"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    account = relationship("FinancialAccount", back_populates="budget_plans")
    
    def to_dict(self):
        """Convert budget plan to dictionary for serialization"""
        return {
            "id": self.id,
            "account_id": self.account_id,
            "category": self.category,
            "limit_amount": self.limit_amount,
            "spent_amount": self.spent_amount,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        } 