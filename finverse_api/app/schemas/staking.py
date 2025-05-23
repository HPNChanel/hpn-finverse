"""
Staking schemas for FinVerse API
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from app.config import MIN_STAKE_AMOUNT, MAX_STAKE_AMOUNT


class StakeBase(BaseModel):
    """Base schema for stake"""
    name: str = Field(..., min_length=1, max_length=100)
    address: Optional[str] = None
    amount: float = Field(..., gt=0)
    
    @validator("amount")
    def validate_amount(cls, v):
        """Validate that amount is within allowed limits"""
        if v < MIN_STAKE_AMOUNT:
            raise ValueError(f"Minimum stake amount is {MIN_STAKE_AMOUNT}")
        if v > MAX_STAKE_AMOUNT:
            raise ValueError(f"Maximum stake amount is {MAX_STAKE_AMOUNT}")
        return v


class StakeCreate(StakeBase):
    """Schema for creating a stake"""
    balance: Optional[float] = 0.0
    is_active: bool = True


class StakeUpdate(BaseModel):
    """Schema for updating a stake"""
    name: Optional[str] = None
    address: Optional[str] = None
    amount: Optional[float] = None
    balance: Optional[float] = None
    is_active: Optional[bool] = None


class StakeResponse(StakeBase):
    """Schema for stake response"""
    id: int
    user_id: int
    balance: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakeList(BaseModel):
    """Schema for list of stakes"""
    stakes: List[StakeResponse]
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakingReward(BaseModel):
    """Schema for staking reward"""
    earned: float
    apy: float
    duration_days: int


class StakeStatus(BaseModel):
    """Schema for staking status"""
    user_id: int
    total_staked: float
    last_updated: datetime
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakingAccountCreate(StakeCreate):
    """Schema for creating a staking account"""
    pass


class StakingAccountResponse(StakeResponse):
    """Schema for staking account response"""
    pass


class StakingAccountList(BaseModel):
    """Schema for list of staking accounts"""
    accounts: List[StakingAccountResponse]
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakingProfileStatus(BaseModel):
    """Schema for staking profile status"""
    total_staked: float
    last_updated: str


class StakingProfileResponse(BaseModel):
    """Schema for staking profile"""
    stake: StakeResponse
    rewards: StakingReward

    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakingProfileList(BaseModel):
    """Schema for list of staking profiles"""
    stakes: List[StakingProfileResponse] 