"""
Schemas for Financial Goals in FinVerse API
"""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


# Base Financial Goal schema
class FinancialGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: float = Field(..., gt=0)
    current_amount: Optional[float] = Field(0.0, ge=0)
    start_date: date
    target_date: date
    description: Optional[str] = None
    priority: int = Field(2, ge=1, le=3)  # 1=low, 2=medium, 3=high
    status: Optional[int] = Field(1, ge=1, le=3)  # 1=ongoing, 2=completed, 3=cancelled
    icon: Optional[str] = Field('🎯', max_length=50)
    color: Optional[str] = Field('#1976d2', pattern=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    account_id: Optional[int] = None
    
    @field_validator('target_date')
    @classmethod
    def target_date_must_be_after_start_date(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('target_date must be after start_date')
        return v
    
    @field_validator('current_amount')
    @classmethod
    def current_amount_must_not_exceed_target(cls, v, info):
        if v is not None and 'target_amount' in info.data and v > info.data['target_amount']:
            raise ValueError('current_amount must not exceed target_amount')
        return v


# Schema for creating a new goal
class FinancialGoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: float = Field(..., gt=0)
    current_amount: Optional[float] = Field(0.0, ge=0)
    start_date: date
    target_date: date
    description: Optional[str] = None
    priority: int = Field(2, ge=1, le=3)
    status: Optional[int] = Field(1, ge=1, le=3)
    icon: Optional[str] = Field('🎯', max_length=50)
    color: Optional[str] = Field('#1976d2', pattern=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    account_id: Optional[int] = None
    
    @field_validator('target_date')
    @classmethod
    def target_date_must_be_after_start_date(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('target_date must be after start_date')
        return v
    
    @field_validator('current_amount')
    @classmethod
    def current_amount_must_not_exceed_target(cls, v, info):
        if v is not None and 'target_amount' in info.data and v > info.data['target_amount']:
            raise ValueError('current_amount must not exceed target_amount')
        return v


# Schema for updating a goal (all fields optional)
class FinancialGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    description: Optional[str] = None
    priority: Optional[int] = Field(None, ge=1, le=3)
    status: Optional[int] = Field(None, ge=1, le=3)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    account_id: Optional[int] = None


# Schema for responses containing goal data
class FinancialGoalResponse(BaseModel):
    id: int
    user_id: int
    account_id: Optional[int] = None
    name: str
    target_amount: float
    current_amount: float
    start_date: date
    target_date: date
    description: Optional[str] = None
    priority: int
    status: int
    icon: Optional[str] = None
    color: Optional[str] = None
    progress_percentage: float
    created_at: str  # Changed to string
    updated_at: str  # Changed to string
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Convert datetime to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
    )


# Schema for a list of goals - make this the primary list response
class FinancialGoalListResponse(BaseModel):
    success: bool = True
    message: str = "Goals retrieved successfully"
    data: List[FinancialGoalResponse]  # Direct array in data field
    
    model_config = ConfigDict(from_attributes=True)

# Keep existing for backward compatibility
class FinancialGoalList(BaseModel):
    goals: List[FinancialGoalResponse]
    
    model_config = ConfigDict(from_attributes=True)


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