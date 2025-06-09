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
    token_address: Optional[str] = Field(None, description="Token contract address (0x0 for ETH)", alias="tokenAddress")
    
    @field_validator("tx_hash")
    @classmethod
    def validate_tx_hash(cls, v):
        """Validate transaction hash format"""
        if v is not None:
            if not isinstance(v, str) or not v.startswith('0x') or len(v) != 66:
                raise ValueError('Transaction hash must be a valid Ethereum transaction hash (0x + 64 hex chars)')
        return v
    
    @field_validator("token_address")
    @classmethod
    def validate_token_address(cls, v):
        """Validate token address format"""
        if v is not None:
            if not isinstance(v, str) or not v.startswith('0x') or len(v) != 42:
                raise ValueError('Token address must be a valid Ethereum address (0x + 40 hex chars)')
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
    unstaked_at: Optional[str] = Field(None, description="Unstake time", alias="unstakedAt")  # Changed to string
    lock_period: int = Field(..., description="Lock period in days", alias="lockPeriod")
    reward_rate: float = Field(..., description="Reward rate percentage", alias="rewardRate")
    apy_snapshot: Optional[float] = Field(None, description="APY at staking time", alias="apySnapshot")
    claimable_rewards: float = Field(..., description="Claimable rewards", alias="claimableRewards")
    rewards_earned: float = Field(..., description="Total rewards earned", alias="rewardsEarned")
    predicted_reward: Optional[float] = Field(None, description="ML predicted reward", alias="predictedReward")
    tx_hash: Optional[str] = Field(None, description="Transaction hash", alias="txHash")
    unstake_tx_hash: Optional[str] = Field(None, description="Unstake transaction hash", alias="unstakeTxHash")
    token_address: Optional[str] = Field(None, description="Token contract address", alias="tokenAddress")
    is_active: bool = Field(..., description="Whether stake is active", alias="isActive")
    status: str = Field(..., description="Stake status")
    model_confidence: Optional[float] = Field(None, description="AI model confidence", alias="modelConfidence")
    ai_tag: Optional[str] = Field(None, description="AI tag", alias="aiTag")
    created_at: str = Field(..., description="Creation time", alias="createdAt")  # Changed to string
    updated_at: str = Field(..., description="Last update time", alias="updatedAt")  # Changed to string
    
    # Computed fields
    is_unlocked: bool = Field(default=False, description="Whether stake is unlocked", alias="isUnlocked")
    days_remaining: Optional[int] = Field(None, description="Days until unlock", alias="daysRemaining")
    
    @field_validator('staked_at', 'unlock_at', 'unstaked_at', 'created_at', 'updated_at', mode='before')
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
    pool_id: str = Field(..., description="Pool ID", alias="poolId")
    name: str = Field(..., description="Pool name")
    description: str = Field(..., description="Pool description")
    apy: float = Field(..., description="Annual Percentage Yield")
    min_stake: float = Field(..., description="Minimum stake amount", alias="minStake")
    max_stake: float = Field(..., description="Maximum stake amount", alias="maxStake")
    lock_period: int = Field(..., description="Lock period in days", alias="lockPeriod")
    is_active: bool = Field(..., description="Whether pool is active", alias="isActive")
    total_staked: float = Field(default=0.0, description="Total amount staked in pool", alias="totalStaked")
    participants: int = Field(default=0, description="Number of participants")
    token_address: Optional[str] = Field(None, description="Token contract address", alias="tokenAddress")
    token_symbol: Optional[str] = Field(None, description="Token symbol", alias="tokenSymbol")
    created_at: Optional[str] = Field(default=None, description="Pool creation time", alias="createdAt")
    updated_at: Optional[str] = Field(default=None, description="Pool last update time", alias="updatedAt")
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def validate_datetime_fields(cls, v):
        """Convert datetime to ISO string or provide default"""
        if v is None:
            return datetime.utcnow().isoformat()
        if isinstance(v, datetime):
            return v.isoformat()
        return v
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        extra='ignore'  # Ignore extra fields to prevent validation errors
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
    """Response for claiming rewards"""
    success: bool
    message: str
    claimed_amount: float
    transaction_hash: Optional[str] = None
    remaining_claimable: float
    
    model_config = ConfigDict(from_attributes=True)


class StakingPoolsResponse(BaseModel):
    """Response for staking pools list"""
    pools: List[StakingPoolInfo]
    total_pools: int = Field(..., description="Total number of pools")
    active_pools: int = Field(..., description="Number of active pools")
    
    model_config = ConfigDict(from_attributes=True)


class RewardsResponse(BaseModel):
    """Response for user rewards"""
    rewards: List[RewardHistory] = Field(default=[], description="Detailed rewards history")
    total_rewards: float = Field(..., description="Total rewards earned")
    pending_rewards: float = Field(..., description="Pending claimable rewards")
    last_calculation: Optional[datetime] = Field(None, description="Last calculation timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class StakeWithPool(StakeBase):
    """Schema for staking to a specific pool with duration"""
    pool_id: int = Field(..., description="Pool ID to stake to")
    duration: int = Field(default=30, ge=0, description="Stake duration in days")
    
    model_config = ConfigDict(from_attributes=True)


class StakingDashboard(BaseModel):
    """Schema for comprehensive staking dashboard data"""
    total_staked: float = Field(..., description="Total amount staked")
    total_earned: float = Field(..., description="Total rewards earned")
    active_stakes: int = Field(..., description="Number of active stakes")
    average_apy: float = Field(..., description="Average APY across all stakes")
    claimable_rewards: float = Field(..., description="Total claimable rewards")
    stakes: List[StakingProfileResponse] = Field(default=[], description="User stakes")
    pools: List[StakingPoolInfo] = Field(default=[], description="Available pools")
    recent_rewards: List[RewardHistory] = Field(default=[], description="Recent rewards history")
    
    model_config = ConfigDict(from_attributes=True)


class StakingPositionResponse(BaseModel):
    """Response schema for staking position details"""
    id: int = Field(..., description="Position ID")
    user_id: int = Field(..., description="User ID")
    pool_id: Optional[str] = Field(None, description="Pool ID")
    amount: float = Field(..., description="Staked amount")
    staked_at: datetime = Field(..., description="Stake creation timestamp")
    lock_period: int = Field(default=0, description="Lock period in days")
    reward_rate: float = Field(..., description="Reward rate (APY)")
    tx_hash: Optional[str] = Field(None, description="Transaction hash")
    is_active: bool = Field(..., description="Whether stake is active")
    unlock_date: Optional[datetime] = Field(None, description="Unlock date")
    rewards_earned: float = Field(default=0.0, description="Total rewards earned")
    last_reward_calculation: Optional[datetime] = Field(None, description="Last reward calculation")
    status: str = Field(..., description="Stake status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    is_unlocked: bool = Field(..., description="Whether stake is unlocked")
    days_remaining: Optional[int] = Field(None, description="Days until unlock")
    reward_token: str = Field(default="FVT", description="Token symbol for rewards")
    
    model_config = ConfigDict(from_attributes=True)


class UserStakesResponse(BaseModel):
    """Response for user stakes summary"""
    user_id: int = Field(..., description="User ID")
    positions: List[StakingPositionResponse]
    total_staked: float = Field(..., description="Total amount staked")
    total_rewards: float = Field(..., description="Total rewards earned")
    total_positions: int = Field(..., description="Total number of positions")
    active_positions: int = Field(..., description="Number of active positions")
    
    model_config = ConfigDict(from_attributes=True)


class StakingPositionCreateRequest(BaseModel):
    """Request to create a new staking position"""
    wallet_address: str = Field(..., description="User wallet address")
    pool_id: int = Field(..., description="Pool ID")
    amount: float = Field(..., gt=0, description="Amount to stake")
    blockchain_tx_hash: str = Field(..., description="Blockchain transaction hash")
    
    model_config = ConfigDict(from_attributes=True)


class StakingPositionCreateResponse(BaseModel):
    """Response for creating a staking position"""
    success: bool
    message: str
    position_id: int = Field(..., description="Created position ID")
    legacy_stake_id: int = Field(..., description="Legacy stake ID for compatibility")
    wallet_address: str = Field(..., description="User wallet address")
    pool_id: int = Field(..., description="Pool ID")
    amount: float = Field(..., description="Staked amount")
    blockchain_tx_hash: str = Field(..., description="Blockchain transaction hash")
    predicted_reward: float = Field(..., description="Predicted annual reward")
    apy_snapshot: float = Field(..., description="APY at time of creation")
    status: str = Field(..., description="Position status")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class StakingRecordRequest(BaseModel):
    """Request to record a stake"""
    amount: float = Field(..., gt=0, description="Amount to stake")
    poolId: str = Field(..., description="Pool ID")
    lockPeriod: int = Field(default=0, ge=0, description="Lock period in days")
    txHash: str = Field(..., description="Transaction hash")
    
    model_config = ConfigDict(from_attributes=True)


class StakingRecordResponse(BaseModel):
    """Response after recording a stake"""
    success: bool
    message: str
    position: Optional[StakingPositionResponse] = None
    position_id: Optional[int] = Field(None, description="Position ID")
    stake_id: Optional[int] = Field(None, description="Stake ID")
    tx_hash: Optional[str] = Field(None, description="Transaction hash")
    
    model_config = ConfigDict(from_attributes=True)


class RecordStakeRequest(BaseModel):
    """Legacy request format for recording stakes"""
    amount: float = Field(..., gt=0, description="Amount to stake")
    poolId: str = Field(..., description="Pool ID")
    lockPeriod: int = Field(default=0, ge=0, description="Lock period in days")
    txHash: str = Field(..., min_length=66, max_length=66, description="Transaction hash")
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator("txHash")
    @classmethod
    def validate_tx_hash(cls, v):
        """Validate transaction hash format"""
        if not isinstance(v, str) or not v.startswith('0x') or len(v) != 66:
            raise ValueError('Transaction hash must be a valid Ethereum transaction hash (0x + 64 hex chars)')
        # Check if the hex part is valid
        try:
            int(v[2:], 16)
        except ValueError:
            raise ValueError('Transaction hash contains invalid hexadecimal characters')
        return v
    
    @field_validator("poolId")
    @classmethod
    def validate_pool_id(cls, v):
        """Validate pool ID"""
        if not v or not isinstance(v, str):
            raise ValueError("Pool ID must be a non-empty string")
        valid_pools = ['0', '1', '2']  # Define valid pool IDs for ETH staking
        if v not in valid_pools:
            raise ValueError(f"Invalid pool ID. Valid options: {valid_pools}")
        return v


class RecordStakeResponse(BaseModel):
    """Legacy response format for recording stakes"""
    success: bool
    message: str
    stakeId: int = Field(..., description="Stake ID")
    txHash: str = Field(..., description="Transaction hash")
    
    model_config = ConfigDict(populate_by_name=True)


class UnstakeSyncRequest(BaseModel):
    """Request schema for unstaking synchronization"""
    stake_id: int = Field(..., description="Stake ID to unstake")
    tx_hash: str = Field(..., min_length=66, max_length=66, description="Unstake transaction hash")
    
    @field_validator("tx_hash")
    @classmethod
    def validate_tx_hash(cls, v):
        """Validate transaction hash format"""
        if not v.startswith('0x') or len(v) != 66:
            raise ValueError('Transaction hash must be a valid Ethereum transaction hash (0x + 64 hex chars)')
        return v
    
    model_config = ConfigDict(from_attributes=True)


class UnstakeSyncResponse(BaseModel):
    """Response schema for unstaking synchronization"""
    success: bool
    message: str
    stake_id: int = Field(..., description="Stake ID")
    unstaked_at: datetime = Field(..., description="Unstake timestamp")
    tx_hash: str = Field(..., description="Unstake transaction hash")
    status: str = Field(..., description="Updated stake status")
    is_early_withdrawal: bool = Field(default=False, description="Whether this was an early withdrawal")
    penalty_amount: float = Field(default=0.0, description="Penalty amount for early withdrawal")
    
    model_config = ConfigDict(from_attributes=True)