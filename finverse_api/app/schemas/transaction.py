"""
Transaction schemas for FinVerse API
"""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import IntEnum


class TransactionTypeEnum(IntEnum):
    """Enum for transaction types"""
    EXPENSE = 0
    INCOME = 1


class TransactionBase(BaseModel):
    """Base schema for transaction"""
    amount: float = Field(..., gt=0)
    transaction_type: TransactionTypeEnum
    description: Optional[str] = None
    transaction_date: date


class CreateTransactionSchema(TransactionBase):
    """Schema for creating a transaction"""
    wallet_id: int = Field(..., gt=0)
    
    class Config:
        use_enum_values = True
        schema_extra = {
            "example": {
                "amount": 100.0,
                "transaction_type": 1,  # 1 = income, 0 = expense
                "wallet_id": 1,
                "description": "Salary payment",
                "transaction_date": "2024-09-15"
            }
        }


class UpdateTransactionSchema(BaseModel):
    """Schema for updating a transaction"""
    amount: Optional[float] = Field(None, gt=0)
    transaction_type: Optional[TransactionTypeEnum] = None
    wallet_id: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    
    class Config:
        use_enum_values = True


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: int
    user_id: int
    wallet_id: int
    amount: float
    transaction_type: int
    description: Optional[str] = None
    transaction_date: date
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class TransactionList(BaseModel):
    """Schema for list of transactions"""
    transactions: List[TransactionResponse]
    
    class Config:
        orm_mode = True


class MonthlyStats(BaseModel):
    """Schema for monthly transaction statistics"""
    month: str
    income: float
    expense: float


class MonthlyStatsResponse(BaseModel):
    """Schema for monthly stats response"""
    monthly_stats: List[MonthlyStats]
    
    class Config:
        orm_mode = True