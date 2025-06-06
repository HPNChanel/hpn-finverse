"""
Budget schemas for FinVerse API - Unified budget schema module
"""

from datetime import datetime, date
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum


class BudgetPeriod(str, Enum):
    """Budget period types"""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class AlertThreshold(str, Enum):
    """Alert threshold types"""
    PERCENT_50 = "50%"
    PERCENT_75 = "75%"
    PERCENT_90 = "90%"
    PERCENT_100 = "100%"


class BudgetStatus(str, Enum):
    """Budget status types"""
    ACTIVE = "active"
    EXCEEDED = "exceeded"
    COMPLETED = "completed"
    PAUSED = "paused"


class BudgetBase(BaseModel):
    """Base schema for budget data"""
    name: str = Field(..., min_length=1, max_length=100)
    category_id: int = Field(..., description="Category ID for this budget")
    limit_amount: float = Field(..., gt=0, description="Budget limit amount")
    period_type: BudgetPeriod = Field(..., description="Budget period type")
    start_date: date = Field(..., description="Budget start date")
    end_date: Optional[date] = Field(None, description="Budget end date (for custom periods)")
    alert_threshold: AlertThreshold = Field(AlertThreshold.PERCENT_75, description="Alert threshold")
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = Field(True, description="Whether budget is active")

    model_config = ConfigDict(from_attributes=True)


class BudgetCreate(BudgetBase):
    """Schema for creating a budget"""
    pass


class BudgetUpdate(BaseModel):
    """Schema for updating a budget"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    limit_amount: Optional[float] = Field(None, gt=0)
    period_type: Optional[BudgetPeriod] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    alert_threshold: Optional[AlertThreshold] = None
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class BudgetResponse(BudgetBase):
    """Schema for budget response"""
    id: int
    user_id: int
    spent_amount: float = 0.0
    remaining_amount: float = 0.0
    usage_percentage: float = 0.0
    status: BudgetStatus = BudgetStatus.ACTIVE
    days_remaining: Optional[int] = None
    created_at: str  # Changed to string
    updated_at: Optional[str] = None  # Changed to string
    
    # Category information
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    
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


class BudgetSummary(BaseModel):
    """Schema for budget summary statistics"""
    total_budgets: int = 0
    active_budgets: int = 0
    exceeded_budgets: int = 0
    total_budget_amount: float = 0.0
    total_spent_amount: float = 0.0
    overall_usage_percentage: float = 0.0


class BudgetList(BaseModel):
    """Schema for list of budgets"""
    budgets: List[BudgetResponse]
    summary: BudgetSummary
    
    model_config = ConfigDict(from_attributes=True)


class BudgetAlert(BaseModel):
    """Schema for budget alerts"""
    id: int
    budget_id: int
    budget_name: str
    category_name: str
    threshold_type: AlertThreshold
    current_percentage: float
    amount_spent: float
    budget_limit: float
    created_at: datetime
    is_read: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class BudgetUsageUpdate(BaseModel):
    """Schema for updating budget usage"""
    transaction_amount: float = Field(..., description="Transaction amount to add/subtract")
    transaction_type: Literal["income", "expense"] = Field(..., description="Transaction type")
