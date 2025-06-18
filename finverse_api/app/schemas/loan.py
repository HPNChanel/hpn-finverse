"""
Loan schemas for FinVerse API - Presentation Layer (Clean Architecture)

This module implements request/response schemas for loan simulation:
- Loan creation and simulation request schemas
- Interest rate configuration schemas
- Amortization calculation schemas
- Repayment schedule response schemas

Architecture Layer: PRESENTATION LAYER
Dependencies: → Core Layer (models)
Used by: API Layer (routers)
"""

from pydantic import BaseModel, Field, validator, computed_field
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import date, datetime
from enum import Enum

# Import enums from models
from app.models.loan import (
    LoanType as ModelLoanType,
    InterestType as ModelInterestType,
    AmortizationType as ModelAmortizationType,
    RepaymentFrequency as ModelRepaymentFrequency,
    LoanStatus as ModelLoanStatus
)


class LoanTypeEnum(str, Enum):
    """Loan type enumeration for API schemas"""
    PERSONAL = "personal"
    MORTGAGE = "mortgage"
    EDUCATION = "education"
    BUSINESS = "business"
    AUTO = "auto"
    HOME_IMPROVEMENT = "home_improvement"
    CREDIT_CARD = "credit_card"
    OTHER = "other"


class InterestTypeEnum(str, Enum):
    """Interest type enumeration for API schemas"""
    FIXED = "fixed"
    VARIABLE = "variable"
    HYBRID = "hybrid"


class AmortizationTypeEnum(str, Enum):
    """Amortization type enumeration for API schemas"""
    REDUCING_BALANCE = "reducing_balance"
    FLAT_RATE = "flat_rate"
    BULLET_PAYMENT = "bullet_payment"


class RepaymentFrequencyEnum(str, Enum):
    """Repayment frequency enumeration for API schemas"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUALLY = "semi_annually"
    ANNUALLY = "annually"


class LoanStatusEnum(str, Enum):
    """Loan status enumeration for API schemas"""
    SIMULATED = "simulated"
    ACTIVE = "active"
    COMPLETED = "completed"
    DEFAULTED = "defaulted"
    CANCELLED = "cancelled"


# Base schemas
class LoanBaseSchema(BaseModel):
    """Base loan schema with common fields"""
    loan_name: str = Field(..., min_length=1, max_length=200, description="User-defined name for the loan")
    loan_type: LoanTypeEnum = Field(..., description="Type of loan")
    purpose: Optional[str] = Field(None, max_length=500, description="Detailed purpose description")
    principal_amount: Decimal = Field(..., ge=0, le=10000000, description="Original loan amount")
    interest_rate: Decimal = Field(..., ge=0, le=100, description="Annual interest rate (percentage)")
    loan_term_months: int = Field(..., ge=1, le=360, description="Total loan term in months")
    start_date: date = Field(..., description="Loan start date")
    
    # Interest configuration
    interest_type: InterestTypeEnum = Field(InterestTypeEnum.FIXED, description="Interest rate type")
    variable_rate_adjustment_frequency: Optional[int] = Field(None, ge=1, le=36, description="Months between rate adjustments")
    hybrid_fixed_period: Optional[int] = Field(None, ge=1, le=120, description="Fixed rate period in hybrid model")
    
    # Loan terms
    repayment_frequency: RepaymentFrequencyEnum = Field(RepaymentFrequencyEnum.MONTHLY, description="Repayment frequency")
    amortization_type: AmortizationTypeEnum = Field(AmortizationTypeEnum.REDUCING_BALANCE, description="Amortization method")
    
    # Optional fields
    notes: Optional[str] = Field(None, max_length=1000, description="User notes about the loan")
    
    class Config:
        use_enum_values = True
        json_encoders = {
            Decimal: lambda v: float(v),
            date: lambda v: v.isoformat()
        }
    
    @validator('variable_rate_adjustment_frequency')
    def validate_variable_rate_frequency(cls, v, values):
        """Validate variable rate adjustment frequency"""
        if values.get('interest_type') == InterestTypeEnum.VARIABLE and v is None:
            raise ValueError('Variable rate adjustment frequency is required for variable interest loans')
        return v
    
    @validator('hybrid_fixed_period')
    def validate_hybrid_fixed_period(cls, v, values):
        """Validate hybrid fixed period"""
        if values.get('interest_type') == InterestTypeEnum.HYBRID and v is None:
            raise ValueError('Hybrid fixed period is required for hybrid interest loans')
        return v


class LoanCreateRequest(LoanBaseSchema):
    """Schema for loan creation/simulation request"""
    is_simulation: bool = Field(True, description="Whether this is a simulation or real loan tracking")
    
    @validator('start_date')
    def validate_start_date(cls, v):
        """Validate start date is not in the past for real loans"""
        if v < date.today():
            # Allow past dates for simulation purposes
            pass
        return v


class LoanCalculationRequest(BaseModel):
    """Schema for loan calculation without saving"""
    principal_amount: Decimal = Field(..., ge=0, le=10000000)
    interest_rate: Decimal = Field(..., ge=0, le=100)
    loan_term_months: int = Field(..., ge=1, le=360)
    repayment_frequency: RepaymentFrequencyEnum = Field(RepaymentFrequencyEnum.MONTHLY)
    amortization_type: AmortizationTypeEnum = Field(AmortizationTypeEnum.REDUCING_BALANCE)
    
    class Config:
        use_enum_values = True


class LoanUpdateRequest(BaseModel):
    """Schema for updating loan details"""
    loan_name: Optional[str] = Field(None, min_length=1, max_length=200)
    purpose: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[LoanStatusEnum] = None
    
    class Config:
        use_enum_values = True


# Response schemas
class LoanCalculationResult(BaseModel):
    """Schema for loan calculation results"""
    emi_amount: Decimal = Field(..., description="Equal Monthly Installment amount")
    total_interest: Decimal = Field(..., description="Total interest over loan term")
    total_payment: Decimal = Field(..., description="Total amount to be paid")
    effective_interest_rate: Decimal = Field(..., description="Effective annual interest rate")
    
    # Additional metrics
    monthly_payment: Decimal = Field(..., description="Monthly payment amount")
    payment_count: int = Field(..., description="Total number of payments")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


class RepaymentScheduleItem(BaseModel):
    """Schema for individual repayment schedule item"""
    installment_number: int = Field(..., description="Installment number")
    due_date: date = Field(..., description="Payment due date")
    installment_amount: Decimal = Field(..., description="Total payment amount")
    principal_component: Decimal = Field(..., description="Principal portion")
    interest_component: Decimal = Field(..., description="Interest portion")
    opening_balance: Decimal = Field(..., description="Balance at start of period")
    closing_balance: Decimal = Field(..., description="Balance after payment")
    is_paid: bool = Field(False, description="Whether payment has been made")
    is_overdue: bool = Field(False, description="Whether payment is overdue")
    days_overdue: Optional[int] = Field(None, description="Days overdue if applicable")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v),
            date: lambda v: v.isoformat()
        }


class LoanPaymentRecord(BaseModel):
    """Schema for loan payment record"""
    id: int
    payment_date: date
    payment_amount: Decimal
    payment_type: str
    principal_paid: Decimal
    interest_paid: Decimal
    late_fee_paid: Decimal
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    is_simulated: bool
    notes: Optional[str] = None
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v),
            date: lambda v: v.isoformat()
        }


class LoanResponse(LoanBaseSchema):
    """Schema for loan response"""
    id: int
    user_id: int
    current_balance: Decimal
    emi_amount: Decimal
    total_interest: Decimal
    total_payment: Decimal
    status: LoanStatusEnum
    is_simulation: bool
    payments_made: int
    last_payment_date: Optional[date] = None
    next_payment_date: Optional[date] = None
    maturity_date: date
    created_at: datetime
    updated_at: Optional[datetime] = None
    simulation_uuid: str
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            date: lambda v: v.isoformat(),
            datetime: lambda v: v.isoformat()
        }


class LoanDetailResponse(LoanResponse):
    """Schema for detailed loan response with repayment schedule"""
    repayment_schedule: List[RepaymentScheduleItem] = Field([], description="Full repayment schedule")
    payment_history: List[LoanPaymentRecord] = Field([], description="Payment history")
    
    # Computed summary fields
    @computed_field
    @property
    def remaining_payments(self) -> int:
        """Calculate remaining payments"""
        return max(0, len(self.repayment_schedule) - self.payments_made)
    
    @computed_field
    @property
    def completion_percentage(self) -> float:
        """Calculate loan completion percentage"""
        if not self.repayment_schedule:
            return 0.0
        return min(100.0, (self.payments_made / len(self.repayment_schedule)) * 100)


class LoanSummaryResponse(BaseModel):
    """Schema for loan summary statistics"""
    total_loans: int
    active_loans: int
    simulated_loans: int
    completed_loans: int
    total_borrowed: Decimal
    total_remaining: Decimal
    total_interest_paid: Decimal
    average_interest_rate: Decimal
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


class LoanListResponse(BaseModel):
    """Schema for paginated loan list response"""
    loans: List[LoanResponse]
    total: int
    page: int
    per_page: int
    pages: int
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


# Payment schemas
class LoanPaymentRequest(BaseModel):
    """Schema for making a loan payment"""
    payment_amount: Decimal = Field(..., ge=0, description="Payment amount")
    payment_date: date = Field(default_factory=date.today, description="Payment date")
    payment_type: str = Field("regular", description="Payment type (regular, extra, prepayment)")
    payment_method: Optional[str] = Field(None, description="Payment method")
    payment_reference: Optional[str] = Field(None, description="Payment reference number")
    notes: Optional[str] = Field(None, max_length=500, description="Payment notes")
    is_simulated: bool = Field(True, description="Whether this is a simulated payment")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v),
            date: lambda v: v.isoformat()
        }


class LoanAnalyticsResponse(BaseModel):
    """Schema for loan analytics and insights"""
    total_interest_savings: Decimal = Field(..., description="Potential interest savings")
    payoff_acceleration_months: int = Field(..., description="Months saved with extra payments")
    recommended_extra_payment: Decimal = Field(..., description="Recommended extra payment amount")
    interest_to_principal_ratio: float = Field(..., description="Current interest to principal ratio")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        } 