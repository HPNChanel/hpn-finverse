"""
Schemas for Financial Goals in FinVerse API
"""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from decimal import Decimal


# Base Financial Goal schema
class FinancialGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Optional[Decimal] = Field(0, ge=0)
    start_date: date = Field(default_factory=date.today)
    target_date: date
    description: Optional[str] = None
    priority: int = Field(2, ge=1, le=3)  # 1=low, 2=medium, 3=high
    status: int = Field(1, ge=1, le=3)    # 1=ongoing, 2=completed, 3=cancelled
    icon: Optional[str] = None
    color: Optional[str] = Field(None, regex=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    
    @validator('target_date')
    def target_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('target_date must be after start_date')
        return v
    
    @validator('current_amount')
    def current_amount_must_not_exceed_target(cls, v, values):
        if 'target_amount' in values and v > values['target_amount']:
            raise ValueError('current_amount must not exceed target_amount')
        return v


# Schema for creating a new goal
class FinancialGoalCreate(FinancialGoalBase):
    pass


# Schema for updating a goal (all fields optional)
class FinancialGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    target_amount: Optional[Decimal] = Field(None, gt=0)
    current_amount: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    description: Optional[str] = None
    priority: Optional[int] = Field(None, ge=1, le=3)
    status: Optional[int] = Field(None, ge=1, le=3)
    icon: Optional[str] = None
    color: Optional[str] = Field(None, regex=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    
    # Validate target_date if both dates provided
    @validator('target_date')
    def validate_target_date(cls, v, values):
        if v is not None and 'start_date' in values and values['start_date'] is not None:
            if v < values['start_date']:
                raise ValueError('target_date must be after start_date')
        return v
    
    # Validate current_amount if both amounts provided
    @validator('current_amount')
    def validate_current_amount(cls, v, values):
        if v is not None and 'target_amount' in values and values['target_amount'] is not None:
            if v > values['target_amount']:
                raise ValueError('current_amount must not exceed target_amount')
        return v


# Schema for responses containing goal data
class FinancialGoalResponse(FinancialGoalBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


# Schema for a list of goals
class FinancialGoalList(BaseModel):
    goals: List[FinancialGoalResponse]
    
    class Config:
        orm_mode = True


# Enum-like class for goal priority
class GoalPriority:
    LOW = 1
    MEDIUM = 2
    HIGH = 3


# Enum-like class for goal status
class GoalStatus:
    ONGOING = 1
    COMPLETED = 2
    CANCELLED = 3 