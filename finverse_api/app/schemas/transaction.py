"""
Transaction schemas for FinVerse API
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class TransactionTypeEnum(str, Enum):
    """Enum for transaction types"""
    STAKE = "STAKE"
    UNSTAKE = "UNSTAKE"
    TRANSFER = "TRANSFER"
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"


class TransactionBase(BaseModel):
    """Base schema for transaction"""
    amount: float = Field(..., gt=0)
    description: Optional[str] = None


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    transaction_type: TransactionTypeEnum
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: int
    user_id: int
    amount: float
    transaction_type: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True


class TransactionList(BaseModel):
    """Schema for list of transactions"""
    transactions: List[TransactionResponse]
    
    class Config:
        orm_mode = True