"""
Financial Account schemas for FinVerse API
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FinancialAccountBase(BaseModel):
    """Base schema for financial account data"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50)
    icon: Optional[str] = None
    color: Optional[str] = None
    note: Optional[str] = None


class FinancialAccountCreate(BaseModel):
    """Schema for creating a financial account"""
    name: str
    type: str
    initial_balance: float = Field(0.0, ge=0)  # Default to 0, must be >= 0
    icon: Optional[str] = None
    color: Optional[str] = None
    note: Optional[str] = None
    currency: Optional[str] = "USD"


class FinancialAccountResponse(BaseModel):
    """Schema for financial account response"""
    id: int
    user_id: int
    name: str
    type: str
    balance: float
    created_at: datetime
    icon: Optional[str] = None
    color: Optional[str] = None
    created_by_default: bool
    note: Optional[str] = None
    currency: str = "USD"
    
    class Config:
        from_attributes = True  # For SQLAlchemy models


class FinancialAccountList(BaseModel):
    """Schema for list of financial accounts"""
    accounts: List[FinancialAccountResponse]
    
    class Config:
        from_attributes = True  # For SQLAlchemy models


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
    class Config:
        from_attributes = True


class TopUpRequest(BaseModel):
    """Schema for topping up an account"""
    account_id: int
    amount: float = Field(..., gt=0)
    note: Optional[str] = None


class InternalTransferCreate(BaseModel):
    """Schema for creating an internal transfer"""
    from_account_id: int
    to_account_id: int
    amount: float = Field(..., gt=0)
    note: Optional[str] = None


class InternalTransactionResponse(BaseModel):
    """Schema for internal transaction response"""
    id: int
    from_account_id: int
    to_account_id: int
    amount: float
    created_at: datetime
    note: Optional[str] = None
    
    class Config:
        from_attributes = True  # For SQLAlchemy models


class AccountSummary(BaseModel):
    """Schema for account balance summary"""
    wallet: float = 0
    saving: float = 0
    investment: float = 0
    goal: float = 0
    total: float = 0
    account_count: int