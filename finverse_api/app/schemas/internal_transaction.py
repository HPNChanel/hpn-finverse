"""
Internal Transaction schemas for FinVerse API
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class InternalTransactionCreate(BaseModel):
    """Schema for creating an internal transaction"""
    from_account_id: int = Field(..., gt=0)
    to_account_id: int = Field(..., gt=0)
    amount: float = Field(..., gt=0)
    note: Optional[str] = None


class InternalTransactionResponse(BaseModel):
    """Schema for internal transaction response"""
    id: int
    from_account_id: int
    to_account_id: int
    amount: float
    timestamp: datetime
    note: Optional[str] = None
    
    class Config:
        from_attributes = True


class InternalTransactionList(BaseModel):
    """Schema for list of internal transactions"""
    transactions: List[InternalTransactionResponse]
    
    class Config:
        from_attributes = True