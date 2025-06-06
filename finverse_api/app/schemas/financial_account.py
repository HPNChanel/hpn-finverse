"""
Financial Account schemas for FinVerse API
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class FinancialAccountBase(BaseModel):
    """Base schema for financial account data"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50)
    icon: Optional[str] = None
    color: Optional[str] = None
    note: Optional[str] = None


class FinancialAccountCreate(BaseModel):
    """Schema for creating a financial account with proper Decimal validation"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., description="Type of account (wallet, saving, investment, goal)")
    initial_balance: float = Field(0.0, ge=0, description="Initial balance amount")
    note: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None)
    color: Optional[str] = Field(None)
    currency: str = Field("USD", min_length=3, max_length=3)
    
    @field_validator('initial_balance')
    @classmethod
    def validate_initial_balance(cls, v):
        """Validate initial balance can be converted to Decimal"""
        try:
            decimal_value = Decimal(str(v))
            if decimal_value < 0:
                raise ValueError("Initial balance cannot be negative")
            if decimal_value > Decimal('999999999.99999999'):
                raise ValueError("Initial balance exceeds maximum allowed value")
            return v
        except (ValueError, TypeError):
            raise ValueError("Invalid initial balance amount")


class FinancialAccountUpdate(BaseModel):
    """Schema for updating a financial account"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, min_length=1, max_length=50)
    balance: Optional[float] = Field(None, ge=0, description="Account balance")
    note: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    is_hidden: Optional[bool] = Field(None, description="Whether the account is hidden from calculations")


class FinancialAccountResponse(BaseModel):
    """Schema for financial account responses with proper Decimal and datetime handling"""
    id: int
    user_id: int
    name: str
    type: str
    balance: float  # Converted from Decimal for JSON serialization
    created_at: str  # Changed to string for consistent serialization
    icon: Optional[str] = None
    color: Optional[str] = None
    created_by_default: bool = False
    note: Optional[str] = None
    currency: str = "USD"
    is_hidden: bool = False
    is_active: bool = True
    
    @field_validator('balance')
    @classmethod
    def validate_balance(cls, v):
        """Ensure balance is properly converted for JSON serialization"""
        if isinstance(v, Decimal):
            return float(v)
        return v
    
    @field_validator('created_at', mode='before')
    @classmethod
    def validate_created_at(cls, v):
        """Ensure datetime is converted to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }
    )


class FinancialAccountList(BaseModel):
    """Schema for list of financial accounts"""
    accounts: List[FinancialAccountResponse]
    
    model_config = ConfigDict(from_attributes=True)


class AccountType(BaseModel):
    """Schema for account type"""
    type: str
    label: str
    icon: str
    color: str
    description: Optional[str] = None


class AccountTypeList(BaseModel):
    """Schema for list of account types"""
    types: List[AccountType]
    
    model_config = ConfigDict(from_attributes=True)


class TopUpRequest(BaseModel):
    """Schema for topping up an account"""
    account_id: int
    amount: float = Field(..., gt=0)
    note: Optional[str] = None


class ToggleVisibilityRequest(BaseModel):
    """Schema for toggling account visibility"""
    is_hidden: bool


class AccountSummary(BaseModel):
    """Schema for account summary information"""
    total_balance: float
    total_income: float
    total_expenses: float
    account_count: int
    hidden_account_count: int = 0
    currency: str = "USD"
    
    model_config = ConfigDict(from_attributes=True)


# Export all schemas for easy importing
__all__ = [
    "FinancialAccountBase",
    "FinancialAccountCreate", 
    "FinancialAccountUpdate",
    "FinancialAccountResponse",
    "FinancialAccountList",
    "AccountType",
    "AccountTypeList", 
    "TopUpRequest",
    "AccountSummary",
    "ToggleVisibilityRequest"
]