"""
Schemas for Savings Plans in FinVerse API
"""

from datetime import datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict


# Interest Type Enum
class InterestType(str, Enum):
    SIMPLE = "simple"
    COMPOUND = "compound"


# Base Savings Plan schema
class SavingsPlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    initial_amount: float = Field(..., ge=0, description="Initial deposit amount")
    monthly_contribution: float = Field(..., gt=0, description="Monthly contribution amount")
    interest_rate: float = Field(..., gt=0, le=100, description="Annual interest rate as percentage")
    duration_months: int = Field(..., gt=0, le=600, description="Duration in months (max 50 years)")
    interest_type: InterestType = Field(InterestType.COMPOUND, description="Type of interest calculation")


# Schema for creating a new savings plan
class SavingsPlanCreate(SavingsPlanBase):
    pass


# Schema for updating a savings plan (all fields optional)
class SavingsPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    initial_amount: Optional[float] = Field(None, ge=0)
    monthly_contribution: Optional[float] = Field(None, gt=0)
    interest_rate: Optional[float] = Field(None, gt=0, le=100)
    duration_months: Optional[int] = Field(None, gt=0, le=600)
    interest_type: Optional[InterestType] = None


# Schema for savings projection data
class SavingsProjectionResponse(BaseModel):
    id: int
    plan_id: int
    month_index: int
    balance: float
    interest_earned: float
    
    model_config = ConfigDict(from_attributes=True)


# Schema for responses containing savings plan data
class SavingsPlanResponse(BaseModel):
    id: int
    user_id: int
    name: str
    initial_amount: float
    monthly_contribution: float
    interest_rate: float
    duration_months: int
    interest_type: str
    created_at: str
    updated_at: str
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Convert datetime to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(from_attributes=True)


# Schema for detailed savings plan with projections
class SavingsPlanDetailResponse(SavingsPlanResponse):
    projections: List[SavingsProjectionResponse] = []
    total_interest: float = Field(0.0, description="Total interest earned over duration")
    final_value: float = Field(0.0, description="Final value at end of plan")
    
    model_config = ConfigDict(from_attributes=True)


# Schema for a list of savings plans
class SavingsPlanListResponse(BaseModel):
    success: bool = True
    message: str = "Savings plans retrieved successfully"
    data: List[SavingsPlanResponse]
    
    model_config = ConfigDict(from_attributes=True)


# Schema for savings calculation request
class SavingsCalculationRequest(BaseModel):
    initial_amount: float = Field(..., ge=0)
    monthly_contribution: float = Field(..., gt=0)
    interest_rate: float = Field(..., gt=0, le=100)
    duration_months: int = Field(..., gt=0, le=600)
    interest_type: InterestType = InterestType.COMPOUND


# Schema for savings calculation response (without persisting)
class SavingsCalculationResponse(BaseModel):
    monthly_projections: List[dict] = Field(..., description="Month-by-month breakdown")
    total_contributions: float = Field(..., description="Total amount contributed")
    total_interest: float = Field(..., description="Total interest earned")
    final_value: float = Field(..., description="Final value at end of plan")
    
    model_config = ConfigDict(from_attributes=True)


# Schema for savings plan summary stats
class SavingsPlanSummary(BaseModel):
    total_plans: int = 0
    total_saved: float = 0.0
    total_projected_value: float = 0.0
    total_projected_interest: float = 0.0
    
    model_config = ConfigDict(from_attributes=True) 