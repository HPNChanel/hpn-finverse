"""
Staking schemas for FinVerse API - Updated for unified Stake model with Pydantic v2
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from decimal import Decimal

from app.config import MIN_STAKE_AMOUNT, MAX_STAKE_AMOUNT


# Unified Stake Model Schemas
class StakeBase(BaseModel):
    """Base schema for unified stake model"""
    pool_id: str = Field(..., min_length=1, max_length=50, description="Staking pool identifier", alias="poolId")
    amount: float = Field(..., gt=0, description="Stake amount", alias="amount")
    lock_period: int = Field(default=0, ge=0, le=3650, description="Lock period in days", alias="lockPeriod")
    token_address: Optional[str] = Field(None, description="Token contract address", alias="tokenAddress")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True
    )
    
    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        """Validate that amount is within allowed limits"""
        if v < MIN_STAKE_AMOUNT:
            raise ValueError(f"Minimum stake amount is {MIN_STAKE_AMOUNT}")
        if v > MAX_STAKE_AMOUNT:
            raise ValueError(f"Maximum stake amount is {MAX_STAKE_AMOUNT}")
        return v
    
    @field_validator("pool_id")
    @classmethod
    def validate_pool_id(cls, v):
        """Validate pool ID format"""
        if not v or not isinstance(v, str):
            raise ValueError("Pool ID must be a non-empty string")
        return v.strip()
    
    @field_validator("token_address")
    @classmethod
    def validate_token_address(cls, v):
        """Validate token address format"""
        if v is not None:
            if not isinstance(v, str) or not v.startswith('0x') or len(v) != 42:
                raise ValueError('Token address must be a valid Ethereum address (0x + 40 hex chars)')
        return v


class StakeCreate(StakeBase):
    """Schema for creating a unified stake"""
    tx_hash: Optional[str] = Field(None, max_length=100, description="Blockchain transaction hash", alias="txHash")
    reward_rate: Optional[float] = Field(default=0.0, ge=0, le=100, description="Annual reward rate percentage", alias="rewardRate")
    
    @field_validator("tx_hash")
    @classmethod
    def validate_tx_hash(cls, v):
        """Validate transaction hash format"""
        if v is not None:
            if not isinstance(v, str) or not v.startswith('0x') or len(v) != 66:
                raise ValueError('Transaction hash must be a valid Ethereum transaction hash (0x + 64 hex chars)')
        return v


class StakeUpdate(BaseModel):
    """Schema for updating a unified stake"""
    is_active: Optional[bool] = Field(None, description="Whether stake is active", alias="isActive")
    status: Optional[str] = Field(None, pattern="^(ACTIVE|PENDING|COMPLETED|CANCELLED)$", description="Stake status")
    rewards_earned: Optional[float] = Field(None, ge=0, description="Total rewards earned", alias="rewardsEarned")
    claimable_rewards: Optional[float] = Field(None, ge=0, description="Claimable rewards", alias="claimableRewards")
    model_confidence: Optional[float] = Field(None, ge=0, le=1, description="AI model confidence", alias="modelConfidence")
    ai_tag: Optional[str] = Field(None, max_length=50, description="AI tag", alias="aiTag")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class StakeResponse(BaseModel):
    """Schema for unified stake response"""
    id: int = Field(..., description="Stake ID")
    user_id: int = Field(..., description="User ID", alias="userId")
    pool_id: str = Field(..., description="Pool identifier", alias="poolId")
    amount: float = Field(..., description="Staked amount")
    staked_at: str = Field(..., description="Stake creation time", alias="stakedAt")  # Changed to string
    unlock_at: Optional[str] = Field(None, description="Unlock time", alias="unlockAt")  # Changed to string
    lock_period: int = Field(..., description="Lock period in days", alias="lockPeriod")
    reward_rate: float = Field(..., description="Reward rate percentage", alias="rewardRate")
    apy_snapshot: Optional[float] = Field(None, description="APY at staking time", alias="apySnapshot")
    claimable_rewards: float = Field(..., description="Claimable rewards", alias="claimableRewards")
    rewards_earned: float = Field(..., description="Total rewards earned", alias="rewardsEarned")
    predicted_reward: Optional[float] = Field(None, description="ML predicted reward", alias="predictedReward")
    tx_hash: Optional[str] = Field(None, description="Transaction hash", alias="txHash")
    is_active: bool = Field(..., description="Whether stake is active", alias="isActive")
    status: str = Field(..., description="Stake status")
    model_confidence: Optional[float] = Field(None, description="AI model confidence", alias="modelConfidence")
    ai_tag: Optional[str] = Field(None, description="AI tag", alias="aiTag")
    created_at: str = Field(..., description="Creation time", alias="createdAt")  # Changed to string
    updated_at: str = Field(..., description="Last update time", alias="updatedAt")  # Changed to string
    
    # Computed fields
    is_unlocked: bool = Field(default=False, description="Whether stake is unlocked", alias="isUnlocked")
    days_remaining: Optional[int] = Field(None, description="Days until unlock", alias="daysRemaining")
    
    @field_validator('staked_at', 'unlock_at', 'created_at', 'updated_at', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Convert datetime to ISO string"""
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )


class StakeList(BaseModel):
    """Schema for list of unified stakes"""
    stakes: List[StakeResponse]
    total_count: int = Field(..., description="Total number of stakes", alias="totalCount")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StakeStatus(BaseModel):
    """Schema for staking status"""
    user_id: int = Field(..., description="User ID", alias="userId")
    total_staked: float = Field(..., description="Total staked amount", alias="totalStaked")
    total_rewards: float = Field(..., description="Total rewards earned", alias="totalRewards")
    active_stakes: int = Field(..., description="Number of active stakes", alias="activeStakes")
    last_updated: datetime = Field(..., description="Last update time", alias="lastUpdated")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StakingAccountCreate(StakeCreate):
    """Schema for creating a staking account"""
    pass


class StakingAccountResponse(StakeResponse):
    """Schema for staking account response"""
    pass


class StakingAccountList(BaseModel):
    """Schema for list of staking accounts"""
    accounts: List[StakingAccountResponse]
    
    model_config = ConfigDict(from_attributes=True)


class StakingProfileStatus(BaseModel):
    """Schema for staking profile status"""
    total_staked: float
    last_updated: str


class StakingProfileResponse(BaseModel):
    """Schema for staking profile"""
    stake: StakeResponse
    total_rewards: float = Field(..., description="Total rewards earned")
    claimable_rewards: float = Field(..., description="Claimable rewards")

    model_config = ConfigDict(from_attributes=True)


class StakingProfileList(BaseModel):
    """Schema for list of staking profiles"""
    stakes: List[StakingProfileResponse]


class StakingPool(BaseModel):
    """Schema for staking pool"""
    id: int
    name: str
    description: str
    apy: float
    min_stake: float
    max_stake: float
    lock_period: int  # days
    is_active: bool
    total_staked: float
    participants: int


class StakingPoolList(BaseModel):
    """Schema for list of staking pools"""
    pools: List[StakingPool]


class StakingPoolInfo(BaseModel):
    """Schema for detailed staking pool information"""
    id: int = Field(..., description="Pool ID")
    name: str = Field(..., description="Pool name")
    description: str = Field(..., description="Pool description")
    apy: float = Field(..., description="Annual Percentage Yield")
    min_stake: float = Field(..., description="Minimum stake amount", alias="minStake")
    max_stake: float = Field(..., description="Maximum stake amount", alias="maxStake")
    lock_period: int = Field(..., description="Lock period in days", alias="lockPeriod")
    is_active: bool = Field(..., description="Whether pool is active", alias="isActive")
    total_staked: float = Field(..., description="Total amount staked in pool", alias="totalStaked")
    participants: int = Field(..., description="Number of participants")
    created_at: datetime = Field(..., description="Pool creation time", alias="createdAt")
    updated_at: datetime = Field(..., description="Pool last update time", alias="updatedAt")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class RewardHistory(BaseModel):
    """Schema for reward history entry"""
    date: str
    stake_id: int
    stake_name: str
    reward_amount: float
    apy: float
    status: str


class RewardHistoryList(BaseModel):
    """Schema for reward history list"""
    rewards: List[RewardHistory]
    total_earned: float


class ClaimableReward(BaseModel):
    """Schema for claimable reward per stake"""
    stake_id: int
    stake_name: str
    amount_staked: float
    days_staked: int
    apy: float
    total_earned: float
    already_claimed: float
    claimable: float


class ClaimableRewards(BaseModel):
    """Schema for all claimable rewards"""
    total_claimable: float
    stakes: List[ClaimableReward]


class ClaimRewardsResponse(BaseModel):
    """Schema for claim rewards response"""
    claimed_amount: float
    message: str


class StakeWithPool(StakeBase):
    """Schema for stake with pool information"""
    pool_id: Optional[int] = 1
    duration_days: Optional[int] = 0


class StakingDashboard(BaseModel):
    """Schema for staking dashboard data"""
    total_staked: float
    total_earned: float
    active_stakes: int
    average_apy: float
    claimable_rewards: float
    stakes: List[StakingProfileResponse]
    pools: List[StakingPool]
    recent_rewards: List[RewardHistory]


# Updated Position Schemas for Unified Model
class StakingPositionResponse(StakeResponse):
    """Alias for StakeResponse to maintain backward compatibility"""
    unlock_date: Optional[datetime] = Field(None, description="Unlock date (alias)", alias="unlockDate")
    last_reward_calculation: Optional[datetime] = Field(None, description="Last reward calc", alias="lastRewardCalculation")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UserStakesResponse(BaseModel):
    """Response for user's unified staking positions"""
    positions: List[StakingPositionResponse]
    total_staked: float = Field(..., description="Total staked amount", alias="totalStaked")
    total_rewards: float = Field(..., description="Total rewards", alias="totalRewards")
    active_positions: int = Field(..., description="Active positions count", alias="activePositions")
    total_positions: int = Field(..., description="Total positions count", alias="totalPositions")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StakingRecordRequest(BaseModel):
    """Request schema for recording a unified stake"""
    pool_id: str = Field(..., description="Pool identifier", alias="poolId")
    amount: float = Field(..., gt=0, description="Stake amount")
    tx_hash: Optional[str] = Field(None, description="Transaction hash", alias="txHash")
    lock_period: int = Field(default=30, ge=0, description="Lock period in days", alias="lockPeriod")
    wallet_address: Optional[str] = Field(None, description="Wallet address", alias="walletAddress")
    
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        try:
            min_amount = MIN_STAKE_AMOUNT
            max_amount = MAX_STAKE_AMOUNT
        except:
            min_amount = 0.01
            max_amount = 1000000.0
            
        if v < min_amount:
            raise ValueError(f'Amount must be at least {min_amount}')
        if v > max_amount:
            raise ValueError(f'Amount cannot exceed {max_amount}')
        return v
    
    @field_validator('tx_hash')
    @classmethod
    def validate_tx_hash(cls, v):
        if v is not None:
            if not isinstance(v, str) or not v.startswith('0x') or len(v) != 66:
                raise ValueError('Transaction hash must be a valid Ethereum transaction hash (0x + 64 hex chars)')
        return v
    
    @field_validator('wallet_address')
    @classmethod
    def validate_wallet_address(cls, v):
        if v is not None:
            if not isinstance(v, str) or not v.startswith('0x') or len(v) != 42:
                raise ValueError('Wallet address must be a valid Ethereum address (0x + 40 hex chars)')
        return v


class StakingRecordResponse(BaseModel):
    """Response after recording a unified stake"""
    success: bool
    message: str
    position: Optional[StakingPositionResponse] = None
    position_id: Optional[int] = Field(None, description="Position ID", alias="positionId")
    stake_id: Optional[int] = Field(None, description="Unified stake ID", alias="stakeId")
    tx_hash: Optional[str] = Field(None, description="Transaction hash", alias="txHash")
    blockchain_confirmed: bool = Field(default=True, description="Blockchain confirmation", alias="blockchainConfirmed")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StakingPositionCreateRequest(BaseModel):
    """Schema for creating a staking position via positions endpoint"""
    wallet_address: str = Field(..., min_length=42, max_length=42, description="Ethereum wallet address", alias="walletAddress")
    pool_id: int = Field(..., gt=0, description="Pool ID for staking", alias="poolId")
    amount: float = Field(..., gt=0, description="Amount to stake")
    blockchain_tx_hash: str = Field(..., min_length=66, max_length=66, description="Blockchain transaction hash", alias="blockchainTxHash")
    
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)
    
    @field_validator('wallet_address')
    @classmethod
    def validate_wallet_address(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Wallet address must be a valid Ethereum address (0x + 40 hex chars)')
        return v.lower()
    
    @field_validator('blockchain_tx_hash')
    @classmethod
    def validate_blockchain_tx_hash(cls, v):
        if not v.startswith('0x') or len(v) != 66:
            raise ValueError('Transaction hash must be a valid Ethereum transaction hash (0x + 64 hex chars)')
        return v.lower()
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        try:
            min_amount = MIN_STAKE_AMOUNT
            max_amount = MAX_STAKE_AMOUNT
        except:
            min_amount = 0.01
            max_amount = 1000000.0
            
        if v < min_amount:
            raise ValueError(f'Amount must be at least {min_amount}')
        if v > max_amount:
            raise ValueError(f'Amount cannot exceed {max_amount}')
        return v


class StakingPoolsResponse(BaseModel):
    """Response schema for staking pools"""
    pools: List[StakingPoolInfo]
    total_pools: int = Field(..., description="Total number of pools", alias="totalPools")
    active_pools: int = Field(..., description="Active pools count", alias="activePools")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class RewardsResponse(BaseModel):
    """Response schema for staking rewards"""
    rewards: List[RewardHistory]
    total_rewards: float = Field(..., description="Total rewards earned", alias="totalRewards")
    pending_rewards: float = Field(..., description="Pending rewards", alias="pendingRewards")
    last_calculation: Optional[datetime] = Field(None, description="Last calculation time", alias="lastCalculation")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StakingPositionCreateResponse(BaseModel):
    """Response schema for creating a staking position"""
    success: bool
    message: str
    position_id: int = Field(..., description="Position ID", alias="positionId")
    stake_id: int = Field(..., description="Unified stake ID", alias="stakeId")
    wallet_address: str = Field(..., description="Wallet address", alias="walletAddress")
    pool_id: int = Field(..., description="Pool ID", alias="poolId")
    amount: float = Field(..., description="Staked amount")
    blockchain_tx_hash: str = Field(..., description="Transaction hash", alias="blockchainTxHash")
    predicted_reward: Optional[float] = Field(None, description="Predicted reward", alias="predictedReward")
    apy_snapshot: Optional[float] = Field(None, description="APY snapshot", alias="apySnapshot")
    status: str = Field(default="ACTIVE", description="Stake status")
    created_at: datetime = Field(..., description="Creation time", alias="createdAt")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)