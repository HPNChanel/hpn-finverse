"""
Transaction schemas for FinVerse API - Unified transaction module
"""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import IntEnum


class TransactionTypeEnum(IntEnum):
    """Enum for transaction types - CORRECTED ORDER"""
    INCOME = 0   # 0 = income
    EXPENSE = 1  # 1 = expense


class TransactionBase(BaseModel):
    """Base schema for transaction"""
    amount: float = Field(..., gt=0)
    transaction_type: TransactionTypeEnum
    description: Optional[str] = None
    transaction_date: date
    category_id: Optional[int] = None
    budget_id: Optional[int] = None


class CreateTransactionSchema(TransactionBase):
    """Schema for creating a transaction"""
    wallet_id: int = Field(..., gt=0)
    
    @field_validator('transaction_type', mode='before')
    @classmethod
    def validate_transaction_type(cls, v):
        """Convert transaction type to int if it's an enum and validate"""
        # CRITICAL FIX: Handle None explicitly
        if v is None:
            raise ValueError('transaction_type cannot be None')
        
        # CRITICAL FIX: Handle enum values
        if hasattr(v, 'value'):
            v = v.value
        
        # CRITICAL FIX: Convert to int and validate range - handle 0 properly
        try:
            int_val = int(v)
        except (ValueError, TypeError):
            raise ValueError('transaction_type must be a valid integer')
        
        if int_val not in [0, 1]:
            raise ValueError('transaction_type must be 0 (INCOME) or 1 (EXPENSE)')
        
        return int_val
    
    @field_validator('transaction_date', mode='before')
    @classmethod
    def validate_transaction_date(cls, v):
        """Ensure date is properly formatted"""
        if isinstance(v, datetime):
            return v.date()
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
    )


class UpdateTransactionSchema(BaseModel):
    """Schema for updating a transaction"""
    amount: Optional[float] = Field(None, gt=0)
    transaction_type: Optional[TransactionTypeEnum] = None
    wallet_id: Optional[int] = Field(None, gt=0)
    category_id: Optional[int] = None
    budget_id: Optional[int] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    
    @field_validator('transaction_type', mode='before')
    @classmethod
    def validate_transaction_type(cls, v):
        """Convert transaction type to int if it's an enum and validate"""
        # CRITICAL FIX: Allow None for updates
        if v is None:
            return v
        
        # CRITICAL FIX: Handle enum values
        if hasattr(v, 'value'):
            v = v.value
        
        # CRITICAL FIX: Convert to int and validate range - handle 0 properly
        try:
            int_val = int(v)
        except (ValueError, TypeError):
            raise ValueError('transaction_type must be a valid integer')
        
        if int_val not in [0, 1]:
            raise ValueError('transaction_type must be 0 (INCOME) or 1 (EXPENSE)')
        
        return int_val
    
    model_config = ConfigDict(use_enum_values=True)


class TransactionResponse(BaseModel):
    """Response schema with proper datetime handling"""
    id: int
    user_id: int
    wallet_id: int
    financial_account_id: Optional[int] = None
    category_id: Optional[int] = None
    amount: float
    transaction_type: int
    description: Optional[str] = None
    transaction_date: date
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # UI helper fields
    wallet_name: Optional[str] = None
    category_name: Optional[str] = None

    @field_validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm_with_names(cls, transaction):
        """Create response with wallet and category names"""
        data = {
            'id': transaction.id,
            'user_id': transaction.user_id,
            'wallet_id': transaction.wallet_id,
            'financial_account_id': transaction.financial_account_id or transaction.wallet_id,
            'category_id': transaction.category_id,
            'amount': float(transaction.amount),
            'transaction_type': transaction.transaction_type,
            'description': transaction.description,
            'transaction_date': transaction.transaction_date,
            'created_at': transaction.created_at,
            'updated_at': transaction.updated_at,
            'wallet_name': transaction.wallet.name if transaction.wallet else "Unknown Account",
            'category_name': transaction.category.name if transaction.category else None,
        }
        return cls(**data)

class TransactionList(BaseModel):
    """Schema for list of transactions"""
    transactions: List[TransactionResponse]
    
    model_config = ConfigDict(from_attributes=True)


class MonthlyStats(BaseModel):
    """Schema for monthly transaction statistics"""
    month: str
    income: float
    expense: float


class MonthlyStatsResponse(BaseModel):
    """Schema for monthly stats response"""
    monthly_stats: List[MonthlyStats]
    
    model_config = ConfigDict(from_attributes=True)

# Note: Transaction schemas updated for unified module structure
# All budget_plan references removed and replaced with budget references