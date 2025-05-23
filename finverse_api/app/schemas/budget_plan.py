"""
Budget Plan schemas for FinVerse API
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BudgetPlanBase(BaseModel):
    """Base schema for budget plan data"""
    account_id: int
    category: str = Field(..., min_length=1, max_length=100)
    limit_amount: float = Field(..., gt=0)


class BudgetPlanCreate(BudgetPlanBase):
    """Schema for creating a budget plan"""
    name: Optional[str] = Field("Budget Plan", min_length=1, max_length=100)


class BudgetPlanUpdateSpending(BaseModel):
    """Schema for updating spending of a budget plan"""
    spent_amount: float = Field(..., ge=0)


class BudgetPlanResponse(BudgetPlanBase):
    """Schema for budget plan response"""
    id: int
    spent_amount: float
    status: str
    created_at: datetime
    name: str
    is_active: bool
    
    class Config:
        orm_mode = True


class BudgetPlanList(BaseModel):
    """Schema for list of budget plans"""
    budget_plans: List[BudgetPlanResponse]
    
    class Config:
        orm_mode = True