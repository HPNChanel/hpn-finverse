"""
Schemas for Recurring Transactions in FinVerse API
"""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator, conint
from decimal import Decimal


# Base schema with common fields
class RecurringTransactionBase(BaseModel):
    category_id: int
    wallet_id: int
    amount: Decimal = Field(..., gt=0)
    transaction_type: conint(ge=0, le=1) = Field(..., description="0=expense, 1=income")
    description: Optional[str] = None
    frequency_type: conint(ge=1, le=4) = Field(..., description="1=daily, 2=weekly, 3=monthly, 4=yearly")
    frequency_value: int
    start_date: date
    end_date: Optional[date] = None
    is_active: bool = True
    
    @validator('frequency_value')
    def validate_frequency_value(cls, v, values):
        if 'frequency_type' in values:
            freq_type = values['frequency_type']
            
            # Daily - value is ignored
            if freq_type == 1:
                pass
            # Weekly - value must be 0-6 (Monday to Sunday)
            elif freq_type == 2 and not (0 <= v <= 6):
                raise ValueError('For weekly frequency, value must be between 0 and 6 (Monday to Sunday)')
            # Monthly - value must be 1-31 (day of month)
            elif freq_type == 3 and not (1 <= v <= 31):
                raise ValueError('For monthly frequency, value must be between 1 and 31 (day of month)')
            # Yearly - value must be 1-366 (day of year)
            elif freq_type == 4 and not (1 <= v <= 366):
                raise ValueError('For yearly frequency, value must be between 1 and 366 (day of year)')
        
        return v
    
    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if v is not None and 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


# Schema for creating a recurring transaction
class RecurringTransactionCreate(RecurringTransactionBase):
    pass


# Schema for updating a recurring transaction
class RecurringTransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    wallet_id: Optional[int] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    transaction_type: Optional[conint(ge=0, le=1)] = None
    description: Optional[str] = None
    frequency_type: Optional[conint(ge=1, le=4)] = None
    frequency_value: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    next_occurrence: Optional[date] = None
    
    @validator('frequency_value')
    def validate_frequency_value(cls, v, values):
        if v is not None and 'frequency_type' in values and values['frequency_type'] is not None:
            freq_type = values['frequency_type']
            
            # Daily - value is ignored
            if freq_type == 1:
                pass
            # Weekly - value must be 0-6 (Monday to Sunday)
            elif freq_type == 2 and not (0 <= v <= 6):
                raise ValueError('For weekly frequency, value must be between 0 and 6 (Monday to Sunday)')
            # Monthly - value must be 1-31 (day of month)
            elif freq_type == 3 and not (1 <= v <= 31):
                raise ValueError('For monthly frequency, value must be between 1 and 31 (day of month)')
            # Yearly - value must be 1-366 (day of year)
            elif freq_type == 4 and not (1 <= v <= 366):
                raise ValueError('For yearly frequency, value must be between 1 and 366 (day of year)')
        
        return v
    
    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if v is not None and 'start_date' in values and values['start_date'] is not None and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


# Schema for response
class RecurringTransactionResponse(RecurringTransactionBase):
    id: int
    user_id: int
    next_occurrence: date
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


# Schema for a list of recurring transactions
class RecurringTransactionList(BaseModel):
    recurring_transactions: List[RecurringTransactionResponse]
    
    class Config:
        orm_mode = True


# Enum-like class for frequency types
class FrequencyType:
    DAILY = 1
    WEEKLY = 2
    MONTHLY = 3
    YEARLY = 4


# Enum-like class for transaction types
class TransactionType:
    EXPENSE = 0
    INCOME = 1 