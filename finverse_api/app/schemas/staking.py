"""
Staking schemas for FinVerse API
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from app.config import MIN_STAKE_AMOUNT, MAX_STAKE_AMOUNT


class StakeRequest(BaseModel):
    """Schema for stake request"""
    amount: float = Field(..., gt=0)
    
    @validator("amount")
    def validate_amount(cls, v):
        """Validate that amount is within allowed limits"""
        if v < MIN_STAKE_AMOUNT:
            raise ValueError(f"Minimum stake amount is {MIN_STAKE_AMOUNT}")
        if v > MAX_STAKE_AMOUNT:
            raise ValueError(f"Maximum stake amount is {MAX_STAKE_AMOUNT}")
        return v


class StakeStatus(BaseModel):
    """Schema for stake status response"""
    user_id: int
    total_staked: float
    last_updated: datetime
    
    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakingAccountBase(BaseModel):
    """Base schema for staking account"""
    name: str = Field(..., min_length=1, max_length=100)
    address: str
    balance: float = 0.0


class StakingAccountCreate(StakingAccountBase):
    """Schema for creating a staking account"""
    initial_balance: Optional[float] = 0.0


class StakingAccountResponse(StakingAccountBase):
    """Schema for staking account response"""
    id: int
    user_id: int
    created_at: datetime
    is_active: bool = True

    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakingAccountList(BaseModel):
    """Schema for list of staking accounts"""
    accounts: List[StakingAccountResponse]
    

class StakingReward(BaseModel):
    """Schema for staking reward"""
    earned: float
    apy: float
    duration_days: int


class StakingProfileStatus(BaseModel):
    """Schema for staking profile status"""
    total_staked: float
    last_updated: str


class StakingProfileResponse(BaseModel):
    """Schema for staking profile"""
    account: StakingAccountResponse
    status: StakingProfileStatus
    rewards: StakingReward

    class Config:
        """Pydantic configuration"""
        orm_mode = True


class StakingProfileList(BaseModel):
    """Schema for list of staking profiles"""
    accounts: List[StakingProfileResponse] 