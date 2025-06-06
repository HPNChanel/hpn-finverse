"""
Staking router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Header, Depends
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.staking import (
    StakeBase, StakeCreate, StakeResponse, StakeStatus, 
    StakingAccountCreate, StakingAccountResponse, StakingAccountList,
    StakingProfileResponse, StakingProfileList, StakingPool, StakingPoolList,
    RewardHistoryList, ClaimableRewards, ClaimRewardsResponse,
    StakeWithPool, StakingDashboard,
    # New schemas
    StakingRecordRequest, StakingRecordResponse, StakingPositionResponse,
    UserStakesResponse, StakingPoolsResponse, RewardsResponse,
    StakingPositionCreateRequest, StakingPositionCreateResponse
)
from app.services import staking_service, user_service
from app.services.staking_service import staking_service as enhanced_staking_service
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.stake import Stake
from app.models.staking_log import StakingLog

router = APIRouter(
    prefix="/staking",
    tags=["Staking"]
)

# New Enhanced Staking Endpoints

@router.post("/positions", response_model=StakingPositionCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_staking_position(
    position_data: StakingPositionCreateRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new staking position with wallet address and blockchain transaction hash"""
    try:
        user_id = current_user.id
        
        # Create the staking position using the service
        position = enhanced_staking_service.create_staking_position(
            db=db,
            user_id=user_id,
            wallet_address=position_data.wallet_address,
            pool_id=position_data.pool_id,
            amount=position_data.amount,
            blockchain_tx_hash=position_data.blockchain_tx_hash
        )
        
        if not position:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create staking position"
            )
        
        # Get the legacy stake ID (now just the stake ID since it's unified)
        stake_id = position.id
        
        # Calculate predicted reward
        predicted_reward = enhanced_staking_service._calculate_predicted_reward(
            position_data.amount, 
            float(position.reward_rate), 
            365
        )
        
        return StakingPositionCreateResponse(
            success=True,
            message="Staking position created successfully",
            position_id=position.id,
            legacy_stake_id=position.id,  # Same ID now since it's unified
            wallet_address=position_data.wallet_address,
            pool_id=position_data.pool_id,
            amount=position_data.amount,
            blockchain_tx_hash=position_data.blockchain_tx_hash,
            predicted_reward=predicted_reward,
            apy_snapshot=float(position.reward_rate),
            status=position.status,
            created_at=position.created_at
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create staking position: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create staking position: {str(e)}"
        )

@router.post("/record", response_model=StakingRecordResponse, status_code=status.HTTP_201_CREATED)
async def record_stake(
    stake_data: StakingRecordRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a new staking position from frontend"""
    try:
        user_id = current_user.id
        
        # Validate blockchain transaction hash format
        if stake_data.tx_hash and not stake_data.tx_hash.startswith('0x'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid transaction hash format"
            )
        
        # Get pool info to determine reward rate
        pools_response = enhanced_staking_service.get_staking_pools(db)
        pool = next((p for p in pools_response.pools if p.pool_id == stake_data.pool_id), None)
        
        if not pool:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid pool ID: {stake_data.pool_id}"
            )
        
        # Validate amount against pool limits
        if stake_data.amount < pool.min_stake:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount below minimum stake for pool {pool.name}: {pool.min_stake}"
            )
        
        if stake_data.amount > pool.max_stake:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount exceeds maximum stake for pool {pool.name}: {pool.max_stake}"
            )
        
        # Check for duplicate transaction hash (updated to use unified model)
        if stake_data.tx_hash:
            existing_stake = db.query(Stake).filter(
                Stake.tx_hash == stake_data.tx_hash
            ).first()
            
            if existing_stake:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Transaction hash already recorded"
                )
        
        # Save the staking position using unified model
        position = enhanced_staking_service.save_stake(
            db=db,
            user_id=user_id,
            pool_id=stake_data.pool_id,
            amount=stake_data.amount,
            tx_hash=stake_data.tx_hash,
            lock_period=stake_data.lock_period,
            reward_rate=pool.apy
        )
        
        if not position:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record staking position"
            )
        
        # Convert to response format using unified model
        position_response = StakingPositionResponse(
            id=position.id,
            user_id=position.user_id,
            pool_id=position.pool_id,
            amount=float(position.amount),
            staked_at=position.staked_at,
            lock_period=position.lock_period,
            reward_rate=float(position.reward_rate),
            tx_hash=position.tx_hash,
            is_active=position.is_active,
            unlock_date=position.unlock_at,  # Updated field name
            rewards_earned=float(position.rewards_earned),
            last_reward_calculation=position.updated_at,  # Use updated_at
            status=position.status,
            created_at=position.created_at,
            updated_at=position.updated_at,
            is_unlocked=position.is_unlocked(),
            days_remaining=position.days_remaining()
        )
        
        return StakingRecordResponse(
            success=True,
            message="Staking position recorded successfully",
            position=position_response,
            position_id=position.id,
            stake_id=position.id  # Same ID now since it's unified
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to record stake from frontend: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record stake: {str(e)}"
        )


@router.get("/user-stakes", response_model=UserStakesResponse, status_code=status.HTTP_200_OK)
async def get_user_stakes(
    active_only: bool = False,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all staking positions for the current user"""
    try:
        user_id = current_user.id
        stakes_summary = enhanced_staking_service.get_user_stakes_summary(db, user_id)
        
        if active_only:
            # Filter only active positions
            active_positions = [pos for pos in stakes_summary.positions if pos.is_active]
            stakes_summary.positions = active_positions
            stakes_summary.total_positions = len(active_positions)
        
        return stakes_summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user stakes: {str(e)}"
        )


@router.get("/rewards", response_model=RewardsResponse, status_code=status.HTTP_200_OK)
async def get_user_rewards(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staking rewards for the current user"""
    try:
        user_id = current_user.id
        rewards_data = enhanced_staking_service.get_user_rewards(db, user_id)
        
        return RewardsResponse(
            rewards=[],  # Detailed rewards history can be implemented later
            total_rewards=rewards_data["total_rewards"],
            pending_rewards=rewards_data["pending_rewards"],
            last_calculation=rewards_data["last_calculation"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch rewards: {str(e)}"
        )


@router.get("/pools", response_model=StakingPoolsResponse, status_code=status.HTTP_200_OK)
async def get_staking_pools(db: Session = Depends(get_db)):
    """Get all available staking pools"""
    try:
        pools_data = enhanced_staking_service.get_staking_pools(db)
        return pools_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch staking pools: {str(e)}"
        )


@router.put("/positions/{position_id}", response_model=StakingPositionResponse)
async def update_staking_position(
    position_id: int,
    update_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a staking position using unified model"""
    try:
        # Update using unified model service
        updated_position = enhanced_staking_service.update_staking_position(
            db=db,
            position_id=position_id,
            user_id=current_user.id,
            update_data=update_data
        )
        
        if not updated_position:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staking position not found"
            )
        
        return StakingPositionResponse(
            id=updated_position.id,
            user_id=updated_position.user_id,
            pool_id=updated_position.pool_id,
            amount=float(updated_position.amount),
            staked_at=updated_position.staked_at,
            lock_period=updated_position.lock_period,
            reward_rate=float(updated_position.reward_rate),
            tx_hash=updated_position.tx_hash,
            is_active=updated_position.is_active,
            unlock_date=updated_position.unlock_at,  # Updated field name
            rewards_earned=float(updated_position.rewards_earned),
            last_reward_calculation=updated_position.updated_at,
            status=updated_position.status,
            created_at=updated_position.created_at,
            updated_at=updated_position.updated_at,
            is_unlocked=updated_position.is_unlocked(),
            days_remaining=updated_position.days_remaining()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update staking position: {str(e)}"
        )

@router.post("/positions", response_model=StakingPositionCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_staking_position(
    position_data: StakingPositionCreateRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new staking position with wallet address and blockchain transaction hash"""
    try:
        user_id = current_user.id
        
        # Create the staking position using the service
        position = enhanced_staking_service.create_staking_position(
            db=db,
            user_id=user_id,
            wallet_address=position_data.wallet_address,
            pool_id=position_data.pool_id,
            amount=position_data.amount,
            blockchain_tx_hash=position_data.blockchain_tx_hash
        )
        
        if not position:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create staking position"
            )
        
        # Get the legacy stake ID (now just the stake ID since it's unified)
        stake_id = position.id
        
        # Calculate predicted reward
        predicted_reward = enhanced_staking_service._calculate_predicted_reward(
            position_data.amount, 
            float(position.reward_rate), 
            365
        )
        
        return StakingPositionCreateResponse(
            success=True,
            message="Staking position created successfully",
            position_id=position.id,
            legacy_stake_id=position.id,  # Same ID now since it's unified
            wallet_address=position_data.wallet_address,
            pool_id=position_data.pool_id,
            amount=position_data.amount,
            blockchain_tx_hash=position_data.blockchain_tx_hash,
            predicted_reward=predicted_reward,
            apy_snapshot=float(position.reward_rate),
            status=position.status,
            created_at=position.created_at
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create staking position: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create staking position: {str(e)}"
        )

# Legacy endpoints (existing code)

@router.post("/stake", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def stake(
    stake_data: StakeBase,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Stake funds using unified model"""
    user_id = current_user.id
    
    # Use unified model create_stake
    stake = enhanced_staking_service.create_stake(
        db=db,
        user_id=user_id, 
        amount=stake_data.amount,
        pool_id=stake_data.pool_id
    )
    
    if not stake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staking failed"
        )
    
    return enhanced_staking_service.get_stake_status(db=db, user_id=user_id)


@router.post("/unstake", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def unstake(
    stake_data: StakeBase,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Unstake funds using unified model"""
    user_id = current_user.id
    
    # Use unified model remove_stake
    result = enhanced_staking_service.remove_stake(
        db=db,
        user_id=user_id, 
        amount=stake_data.amount
    )
    
    if result is None and stake_data.amount > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stake amount"
        )
    
    return enhanced_staking_service.get_stake_status(db=db, user_id=user_id)


@router.get("/status", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def get_stake_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get staking status for current user using unified model"""
    user_id = current_user.id
    return enhanced_staking_service.get_stake_status(db=db, user_id=user_id)


@router.get("/status/{account_id}", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def get_stake_status_by_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get staking status for a specific account"""
    user_id = current_user.id
    
    # Check if account exists and belongs to user
    account = staking_service.get_staking_account(db, account_id, user_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staking account not found"
        )
    
    return staking_service.get_stake_status(db=db, user_id=user_id)


@router.get("/accounts", response_model=StakingProfileList, status_code=status.HTTP_200_OK)
async def get_staking_accounts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all staking accounts for the current user with profiles"""
    user_id = current_user.id
    
    result = staking_service.get_staking_profile(db, user_id)
    if not result or "stakes" not in result or not result["stakes"]:
        # If no accounts found, return empty list
        return {"stakes": []}
    
    return result


@router.get("/account/{account_id}", response_model=StakingProfileResponse, status_code=status.HTTP_200_OK)
async def get_staking_account(
    account_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific staking account by ID"""
    user_id = current_user.id
    
    profile = staking_service.get_staking_profile(db, user_id, account_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staking account not found"
        )
    
    return profile


@router.post("/account/create", response_model=StakingAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_staking_account(
    account_data: StakingAccountCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new staking account"""
    user_id = current_user.id
    
    account = staking_service.create_staking_account(db, user_id, account_data)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create staking account"
        )
    
    return account


@router.post("/stake/{account_id}", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def stake_to_account(
    account_id: int,
    stake_data: StakeBase,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stake funds to a specific account"""
    user_id = current_user.id
    
    # Check if account exists and belongs to user
    account = staking_service.get_staking_account(db, account_id, user_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staking account not found"
        )
    
    # Update account balance
    account.balance += stake_data.amount
    
    # Create stake
    stake = staking_service.create_stake(
        db=db,
        user_id=user_id, 
        amount=stake_data.amount
    )
    
    if not stake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staking failed"
        )
    
    db.commit()
    db.refresh(account)
    
    return staking_service.get_stake_status(db=db, user_id=user_id)


@router.post("/unstake/{account_id}", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def unstake_from_account(
    account_id: int,
    stake_data: StakeBase,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unstake funds from a specific account"""
    user_id = current_user.id
    
    # Check if account exists and belongs to user
    account = staking_service.get_staking_account(db, account_id, user_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staking account not found"
        )
    
    # Check if account has enough balance
    if account.balance < stake_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance in staking account"
        )
    
    # Update account balance
    account.balance -= stake_data.amount
    
    # Remove stake
    result = staking_service.remove_stake(
        db=db,
        user_id=user_id, 
        amount=stake_data.amount
    )
    
    if result is None and stake_data.amount > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stake amount"
        )
    
    db.commit()
    db.refresh(account)
    
    return staking_service.get_stake_status(db=db, user_id=user_id)


@router.get("/pools", response_model=StakingPoolList, status_code=status.HTTP_200_OK)
async def get_staking_pools_api(db: Session = Depends(get_db)):
    """Get all available staking pools"""
    try:
        result = staking_service.get_staking_pools_for_api(db)
        return result
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching staking pools: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch staking pools"
        )


@router.get("/dashboard", response_model=StakingDashboard, status_code=status.HTTP_200_OK)
async def get_staking_dashboard(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive staking dashboard data"""
    try:
        user_id = current_user.id
        
        # Get user stakes and profiles
        stakes_result = staking_service.get_staking_profile(db, user_id)
        stakes = stakes_result.get("stakes", []) if stakes_result else []
        
        # Calculate dashboard metrics
        total_staked = sum(stake.get("amount", 0) for stake in stakes)
        total_earned = sum(stake.get("rewards", {}).get("earned", 0) for stake in stakes)
        active_stakes = len([s for s in stakes if s.get("is_active", True)])
        average_apy = sum(stake.get("rewards", {}).get("apy", 0) for stake in stakes) / len(stakes) if stakes else 0
        
        # Get claimable rewards
        claimable_data = staking_service.calculate_claimable_rewards(db, user_id)
        claimable_rewards = claimable_data["total_claimable"]
        
        # Get pools
        pools_data = staking_service.get_staking_pools_for_api(db)
        pools = pools_data.get("pools", [])
        
        # Get recent rewards
        rewards_history_data = staking_service.get_rewards_for_user(db, user_id, 10)
        recent_rewards = rewards_history_data.get("rewards", [])
        
        return {
            "total_staked": total_staked,
            "total_earned": total_earned,
            "active_stakes": active_stakes,
            "average_apy": average_apy,
            "claimable_rewards": claimable_rewards,
            "stakes": stakes,
            "pools": pools,
            "recent_rewards": recent_rewards
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard data"
        )


@router.get("/rewards/history", response_model=RewardHistoryList, status_code=status.HTTP_200_OK)
async def get_rewards_history(
    limit: int = 50,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staking rewards history"""
    try:
        user_id = current_user.id
        result = staking_service.get_rewards_for_user(db, user_id, limit)
        return result
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching rewards history for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch rewards history"
        )


@router.get("/rewards/claimable", response_model=ClaimableRewards, status_code=status.HTTP_200_OK)
async def get_claimable_rewards(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get claimable rewards for user"""
    user_id = current_user.id
    return staking_service.calculate_claimable_rewards(db, user_id)


@router.post("/rewards/claim", response_model=ClaimRewardsResponse, status_code=status.HTTP_200_OK)
async def claim_rewards(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Claim all pending rewards"""
    try:
        user_id = current_user.id
        return staking_service.claim_all_rewards(db, user_id)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error claiming rewards for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to claim rewards"
        )


@router.post("/stake/pool", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def stake_to_pool(
    stake_data: StakeWithPool,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stake to a specific pool with duration"""
    user_id = current_user.id
    
    # Get pool info to determine stake name
    pools = staking_service.get_staking_pools(db)
    pool = next((p for p in pools if p["id"] == stake_data.pool_id), None)
    
    if not pool:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pool ID"
        )
    
    # Check amount limits
    if stake_data.amount < pool["min_stake"] or stake_data.amount > pool["max_stake"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must be between {pool['min_stake']} and {pool['max_stake']}"
        )
    
    # Create stake account with pool name
    account_data = StakeCreate(
        name=pool["name"],
        amount=stake_data.amount,
        balance=stake_data.amount
    )
    
    stake = staking_service.create_staking_account(db, user_id, account_data)
    if not stake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create stake"
        )
    
    return staking_service.get_stake_status(db=db, user_id=user_id)


@router.post("/stakes/{stake_id}/predict", status_code=status.HTTP_200_OK)
async def predict_stake_reward(
    stake_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get AI prediction for stake rewards"""
    return staking_service.predict_stake_reward(db, stake_id)


@router.post("/stakes/{stake_id}/verify", status_code=status.HTTP_200_OK)
async def verify_stake_on_blockchain(
    stake_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Verify stake on blockchain"""
    return staking_service.verify_stake_on_blockchain(db, stake_id)


@router.get("/stakes/enhanced", status_code=status.HTTP_200_OK)
async def get_enhanced_stakes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get enhanced stakes with AI and blockchain data"""
    user_id = current_user.id
    return staking_service.get_enhanced_stakes(db, user_id)


@router.post("/stakes/create-linked", status_code=status.HTTP_201_CREATED)
async def create_stake_with_account(
    stake_data: StakeBase,
    account_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create stake with optional account linking"""
    user_id = current_user.id
    
    # If account_id provided, link to that account
    if account_id:
        account = staking_service.get_staking_account(db, account_id, user_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staking account not found"
            )
    
    stake = staking_service.create_stake(
        db=db,
        user_id=user_id,
        amount=stake_data.amount
    )
    
    if not stake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staking failed"
        )
    
    return stake


@router.get("/user-stakes", status_code=status.HTTP_200_OK)
async def get_user_stakes_api(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user stakes with claimable rewards - API endpoint"""
    try:
        user_id = current_user.id
        result = staking_service.get_user_stakes(db, user_id)
        return result
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching user stakes for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user stakes"
        )


@router.get("/rewards", status_code=status.HTTP_200_OK)
async def get_rewards_api(
    limit: int = 50,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rewards for user - API endpoint"""
    try:
        user_id = current_user.id
        result = staking_service.get_rewards_for_user(db, user_id, limit)
        return result
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching rewards for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch rewards"
        )


@router.post("/claim-all", response_model=ClaimRewardsResponse, status_code=status.HTTP_200_OK)
async def claim_all_rewards_api(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Claim all pending rewards - API endpoint"""
    try:
        user_id = current_user.id
        return staking_service.claim_all_rewards(db, user_id)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error claiming all rewards for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to claim all rewards"
        )


@router.get("/overview", response_model=dict, status_code=status.HTTP_200_OK)
async def get_staking_overview(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staking overview for the current user"""
    try:
        user_id = current_user.id
        
        # Get all user stakes using unified model
        stakes = enhanced_staking_service.get_user_staking_positions(
            db=db, 
            user_id=user_id,
            active_only=False
        )
        
        # Get user rewards data
        rewards_data = enhanced_staking_service.get_user_rewards(db, user_id)
        
        # Calculate overview metrics
        total_staked = 0.0
        active_stake_count = 0
        total_value_usd = 0.0
        
        for stake in stakes:
            if stake.is_active:
                stake_amount = float(stake.amount)
                total_staked += stake_amount
                total_value_usd += stake_amount  # Assuming 1:1 USD for now
                active_stake_count += 1
        
        # Calculate average APY
        average_apy = 0.0
        if stakes:
            active_stakes = [s for s in stakes if s.is_active]
            if active_stakes:
                average_apy = sum(float(s.reward_rate) for s in active_stakes) / len(active_stakes)
        
        # Calculate days since first stake
        days_since_first_stake = 0
        if stakes:
            first_stake = min(stakes, key=lambda s: s.staked_at)
            days_since_first_stake = (datetime.utcnow() - first_stake.staked_at).days
        
        overview = {
            "total_staked": total_staked,
            "current_rewards": rewards_data["pending_rewards"],
            "active_stakes_count": active_stake_count,
            "total_value_usd": total_value_usd,
            "average_apy": average_apy,
            "next_reward_date": "",  # Can be calculated based on stake periods
            "days_since_first_stake": days_since_first_stake,
            "portfolio_performance": {
                "total_earned": rewards_data["total_rewards"],
                "best_performing_stake": {
                    "name": "High Yield Pool" if stakes else "No stakes",
                    "apy": average_apy,
                    "amount": total_staked
                },
                "monthly_trend": 0.0  # Can be calculated from historical data
            }
        }
        
        return overview
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to fetch staking overview for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch staking overview: {str(e)}"
        )


@router.get("/analytics", status_code=status.HTTP_200_OK)
async def get_staking_analytics(
    timeframe: str = "30d",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staking analytics for the specified timeframe"""
    try:
        # Validate timeframe format
        valid_timeframes = ["7d", "30d", "90d", "180d", "365d"]
        if timeframe not in valid_timeframes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid timeframe. Must be one of: {', '.join(valid_timeframes)}"
            )
        
        # Get analytics data using the service
        analytics_data = enhanced_staking_service.get_analytics(db, timeframe, current_user.id)
        
        return analytics_data
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to fetch staking analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch staking analytics: {str(e)}"
        )


@router.get("/supported-tokens", status_code=status.HTTP_200_OK)
async def get_supported_tokens():
    """Get list of supported tokens for staking"""
    try:
        # For now, only FVT is supported
        supported_tokens = [
            {
                "symbol": "FVT",
                "name": "FinVerse Token",
                "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                "decimals": 18,
                "isSupported": True,
                "icon": "/icons/fvt.png",
                "minStake": 0.01,
                "maxStake": 1000000.0
            },
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "address": "0x0000000000000000000000000000000000000000",
                "decimals": 18,
                "isSupported": False,
                "icon": "/icons/eth.png",
                "minStake": 0.001,
                "maxStake": 1000.0
            }
        ]
        
        return {
            "tokens": supported_tokens,
            "total_supported": len([t for t in supported_tokens if t["isSupported"]])
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch supported tokens: {str(e)}"
        )


@router.post("/validate-token", status_code=status.HTTP_200_OK)
async def validate_token_for_staking(
    validation_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate if a token can be used for staking"""
    try:
        token_address = validation_data.get("token_address")
        amount = validation_data.get("amount", 0)
        
        if not token_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token address is required"
            )
        
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be greater than 0"
            )
        
        # Get supported tokens
        supported_tokens_response = await get_supported_tokens()
        supported_tokens = supported_tokens_response["tokens"]
        
        # Find the token
        token = next((t for t in supported_tokens if t["address"].lower() == token_address.lower()), None)
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token is not supported for staking"
            )
        
        if not token["isSupported"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{token['symbol']} staking is not available yet"
            )
        
        # Validate amount limits
        if amount < token["minStake"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount below minimum stake for {token['symbol']}: {token['minStake']}"
            )
        
        if amount > token["maxStake"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount exceeds maximum stake for {token['symbol']}: {token['maxStake']}"
            )
        
        # Additional validation for FVT token (check if it matches our contract)
        if token["symbol"] == "FVT":
            expected_fvt_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
            if token_address.lower() != expected_fvt_address.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid FVT token address"
                )
        
        return {
            "valid": True,
            "token": token,
            "amount": amount,
            "message": f"Token {token['symbol']} is valid for staking"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token validation failed: {str(e)}"
        )


@router.post("/stake", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def stake(
    stake_data: StakeBase,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Stake funds using unified model with token validation"""
    user_id = current_user.id
    
    # Extract token address from stake data if provided
    token_address = getattr(stake_data, 'token_address', None)
    
    # Validate token if address provided
    if token_address:
        try:
            validation_result = await validate_token_for_staking(
                {"token_address": token_address, "amount": stake_data.amount},
                current_user,
                db
            )
            if not validation_result["valid"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token validation failed"
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Token validation error: {str(e)}"
            )
    
    # Use unified model create_stake
    stake = enhanced_staking_service.create_stake(
        db=db,
        user_id=user_id, 
        amount=stake_data.amount,
        pool_id=stake_data.pool_id
    )
    
    if not stake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staking failed"
        )
    
    return enhanced_staking_service.get_stake_status(db=db, user_id=user_id)


class StakeEventSyncRequest(BaseModel):
    """Schema for syncing blockchain staking events"""
    user_id: str = Field(..., description="User wallet address or ID")
    stake_id: int = Field(..., description="Blockchain stake ID")
    amount: float = Field(..., gt=0, description="Staked amount")
    duration: int = Field(default=0, ge=0, description="Stake duration in days")
    tx_hash: str = Field(..., min_length=66, max_length=66, description="Transaction hash")
    pool_id: str = Field(default='default-pool', description="Pool identifier")
    timestamp: str = Field(..., description="Event timestamp")


@router.post("/sync", status_code=status.HTTP_201_CREATED)
async def sync_staking_event(
    sync_data: StakeEventSyncRequest,
    db: Session = Depends(get_db)
):
    """Sync blockchain staking event to database"""
    try:
        # Validate transaction hash format
        if not sync_data.tx_hash.startswith('0x') or len(sync_data.tx_hash) != 66:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid transaction hash format"
            )
        
        # Check for duplicate transaction hash
        existing_log = db.query(StakingLog).filter(
            StakingLog.tx_hash == sync_data.tx_hash
        ).first()
        
        if existing_log:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Transaction hash already synced"
            )
        
        # Find user by wallet address (assuming user_id is wallet address)
        from app.models.user import User
        user = db.query(User).filter(User.email == sync_data.user_id).first()
        
        if not user:
            # For now, create a temporary user record or use a default user_id
            # In production, you'd want proper user mapping
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found for wallet address"
            )
        
        # Parse event timestamp
        try:
            event_timestamp = datetime.fromisoformat(sync_data.timestamp.replace('Z', '+00:00'))
        except ValueError:
            event_timestamp = datetime.utcnow()
        
        # Create staking log entry
        staking_log = StakingLog(
            user_id=user.id,
            stake_id=sync_data.stake_id,
            amount=sync_data.amount,
            duration=sync_data.duration,
            tx_hash=sync_data.tx_hash,
            pool_id=sync_data.pool_id,
            event_timestamp=event_timestamp,
            synced_at=datetime.utcnow()
        )
        
        db.add(staking_log)
        db.commit()
        db.refresh(staking_log)
        
        # Also create/update the main stake record if needed
        existing_stake = db.query(Stake).filter(
            Stake.tx_hash == sync_data.tx_hash
        ).first()
        
        if not existing_stake:
            # Create unified stake record
            stake = enhanced_staking_service.save_stake(
                db=db,
                user_id=user.id,
                pool_id=sync_data.pool_id,
                amount=sync_data.amount,
                tx_hash=sync_data.tx_hash,
                lock_period=sync_data.duration,
                reward_rate=5.0  # Default reward rate
            )
            
            if stake:
                staking_log_id = stake.id
            else:
                staking_log_id = None
        else:
            staking_log_id = existing_stake.id
        
        return {
            "success": True,
            "message": "Staking event synced successfully",
            "log_id": staking_log.id,
            "stake_id": staking_log_id,
            "tx_hash": sync_data.tx_hash,
            "synced_at": staking_log.synced_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to sync staking event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync staking event: {str(e)}"
        )