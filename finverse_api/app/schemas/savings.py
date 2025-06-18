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
    source_account_id: int = Field(..., gt=0, description="ID of the financial account to deduct money from")


# Schema for updating a savings plan (all fields optional)
class SavingsPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    initial_amount: Optional[float] = Field(None, ge=0)
    monthly_contribution: Optional[float] = Field(None, gt=0)
    interest_rate: Optional[float] = Field(None, gt=0, le=100)
    duration_months: Optional[int] = Field(None, gt=0, le=600)
    interest_type: Optional[InterestType] = None
    source_account_id: Optional[int] = Field(None, gt=0, description="ID of the financial account to deduct money from")


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
    source_account_id: int
    name: str
    initial_amount: float
    monthly_contribution: float
    interest_rate: float
    duration_months: int
    interest_type: str
    created_at: str
    updated_at: str
    status: str = "active"
    current_balance: float = 0.0
    total_contributed: float = 0.0
    total_interest_earned: float = 0.0
    last_contribution_date: Optional[str] = None
    next_contribution_date: Optional[str] = None
    early_withdrawal_penalty_rate: float = 0.10
    completion_date: Optional[str] = None
    withdrawal_amount: Optional[float] = None
    
    # Additional fields for UI display
    source_account_name: Optional[str] = None
    source_account_balance: Optional[float] = None
    
    @field_validator('created_at', 'updated_at', 'last_contribution_date', 'next_contribution_date', 'completion_date', mode='before')
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


# Schema for financial account response (for dropdowns)
class FinancialAccountResponse(BaseModel):
    id: int
    name: str
    type: str
    balance: float
    currency: str = "USD"
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)


# Schema for user balance information
class UserBalanceResponse(BaseModel):
    user_id: int
    total_balance: float
    currency: str = "USD"
    last_updated: str
    
    @field_validator('last_updated', mode='before')
    @classmethod
    def validate_datetime_field(cls, v):
        """Convert datetime to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(from_attributes=True)


# Schema for early withdrawal calculation
class EarlyWithdrawalCalculationResponse(BaseModel):
    current_balance: float
    total_contributed: float
    interest_earned: float
    penalty_rate: float
    penalty_amount: float
    net_withdrawal_amount: float
    months_elapsed: int
    months_remaining: int
    
    model_config = ConfigDict(from_attributes=True)


# Schema for early withdrawal request
class EarlyWithdrawalRequest(BaseModel):
    confirm: bool = Field(..., description="Confirmation that user wants to proceed with early withdrawal")


# Schema for monthly contribution processing result
class MonthlyContributionResponse(BaseModel):
    success: bool
    message: str
    contribution_amount: Optional[float] = None
    new_balance: Optional[float] = None
    total_contributed: Optional[float] = None
    interest_earned: Optional[float] = None
    plan_completed: Optional[bool] = None
    next_due_date: Optional[str] = None
    required_amount: Optional[float] = None
    plan_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


# Schema for savings transaction
class SavingsTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    transaction_type: int
    description: Optional[str] = None
    transaction_date: str
    related_savings_plan_id: Optional[int] = None
    savings_transaction_type: Optional[str] = None
    note: Optional[str] = None
    created_at: str
    
    @field_validator('transaction_date', 'created_at', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Convert datetime to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(from_attributes=True) 