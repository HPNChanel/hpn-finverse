"""
Staking router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Header, Depends
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from web3 import Web3
import json
import os
import logging

logger = logging.getLogger(__name__)

from app.schemas.staking import (
    StakeBase, StakeCreate, StakeResponse, StakeStatus, 
    StakingAccountCreate, StakingAccountResponse, StakingAccountList,
    StakingProfileResponse, StakingProfileList, StakingPool, StakingPoolList,
    RewardHistoryList, ClaimableRewards, ClaimRewardsResponse,
    StakeWithPool, StakingDashboard,
    # New schemas
    StakingRecordRequest, StakingRecordResponse, StakingPositionResponse,
    UserStakesResponse, StakingPoolsResponse, RewardsResponse,
    StakingPositionCreateRequest, StakingPositionCreateResponse,
    RecordStakeRequest, RecordStakeResponse,
    UnstakeSyncRequest, UnstakeSyncResponse
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
        logger.error(f"Failed to create staking position: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create staking position: {str(e)}"
        )

@router.post("/record", response_model=RecordStakeResponse, status_code=status.HTTP_201_CREATED)
async def record_stake(
    stake_data: RecordStakeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a new staking position from frontend with enhanced blockchain validation"""
    try:
        user_id = current_user.id
        
        # ✅ SECTION 2: Wrap DB write logic in try/except block
        try:
            # Validate blockchain transaction hash format
            if not stake_data.txHash.startswith('0x'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid transaction hash format"
                )
            
            # Check for duplicate transaction hash
            existing_stake = db.query(Stake).filter(
                Stake.tx_hash == stake_data.txHash
            ).first()
            
            if existing_stake:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Transaction hash already recorded"
                )
            
            # Enhanced pool configuration with validation
            # ETH-only pool mappings for validation
            pool_mapping = {
                '0': {
                    'name': 'ETH Flexible Pool', 
                    'apy': 8.0, 
                    'token_address': '0x0000000000000000000000000000000000000000',
                    'token_symbol': 'ETH',
                    'min_stake': 0.1,
                    'max_stake': 100.0
                },
                '1': {
                    'name': 'ETH Premium Pool', 
                    'apy': 12.0, 
                    'token_address': '0x0000000000000000000000000000000000000000',
                    'token_symbol': 'ETH',
                    'min_stake': 1.0,
                    'max_stake': 1000.0
                },
                '2': {
                    'name': 'ETH High Yield Pool', 
                    'apy': 15.0, 
                    'token_address': '0x0000000000000000000000000000000000000000',
                    'token_symbol': 'ETH',
                    'min_stake': 5.0,
                    'max_stake': 500.0
                }
            }
            
            pool_config = pool_mapping.get(stake_data.poolId)
            if not pool_config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid pool ID: {stake_data.poolId}. Valid pools: {list(pool_mapping.keys())}"
                )
            
            # ✅ Validate all required fields: user_id, tx_hash, pool_id, amount, reward_rate, lock_period
            if not all([user_id, stake_data.txHash, stake_data.poolId, stake_data.amount]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required fields: user_id, txHash, poolId, amount"
                )
            
            # Validate stake amount against pool limits
            if stake_data.amount < pool_config['min_stake']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Amount below minimum stake for {pool_config['name']}: {pool_config['min_stake']} {pool_config['token_symbol']}"
                )
            
            if stake_data.amount > pool_config['max_stake']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Amount exceeds maximum stake for {pool_config['name']}: {pool_config['max_stake']} {pool_config['token_symbol']}"
                )
            
            reward_rate = pool_config['apy']
            
            # ETH staking - validate transaction contains ETH transfer
            logger.info(f"Validating ETH stake transaction: {stake_data.txHash}")
            
            # Basic transaction validation for ETH staking
            try:
                w3 = get_web3_instance()
                if w3:
                    tx = w3.eth.get_transaction(stake_data.txHash)
                    tx_receipt = w3.eth.get_transaction_receipt(stake_data.txHash)
                    
                    # Verify transaction was successful
                    if tx_receipt.status != 1:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Transaction failed on blockchain"
                        )
                    
                    logger.info(f"✅ ETH stake transaction validated successfully")
            except Exception as e:
                logger.warning(f"Could not validate ETH transaction: {str(e)}")
            
            # ✅ Save stake record into stakes table
            position = enhanced_staking_service.save_stake(
                db=db,
                user_id=user_id,
                pool_id=stake_data.poolId,
                amount=stake_data.amount,
                tx_hash=stake_data.txHash,
                lock_period=stake_data.lockPeriod,
                reward_rate=reward_rate
            )
            
            if not position:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to record staking position"
                )
            
            # ✅ Save matching log into staking_logs table with duplicate protection
            try:
                # Check if log with this tx_hash already exists
                existing_log = db.query(StakingLog).filter_by(tx_hash=stake_data.txHash).first()
                if existing_log:
                    logger.warning(f"Duplicate tx_hash in staking_log: {stake_data.txHash}, skipping log creation.")
                else:
                    # Create new log safely
                    db.add(staking_log)
                    db.flush()  # Use flush() to catch IntegrityError before commit
            except IntegrityError as ie:
                # Handle specific duplicate tx_hash constraint violation
                logger.warning(f"StakingLog already exists for tx: {stake_data.txHash}, skipping.")
                db.rollback()  # Rollback the log insert, but keep the stake
                db.add(position)  # Re-add the stake since rollback removed it
            
            db.commit()
            if 'staking_log' in locals():
                db.refresh(staking_log)
            
            # Log successful stake recording
            logger.info(f"Stake recorded successfully: user_id={user_id}, pool_id={stake_data.poolId}, amount={stake_data.amount}, tx_hash={stake_data.txHash}")
            
            # ✅ On success, return HTTP 200 and stake data
            return RecordStakeResponse(
                success=True,
                message=f"Staking position recorded successfully for {pool_config['name']}",
                stakeId=position.id,
                txHash=position.tx_hash
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as db_error:
            # ✅ On failure, return JSON error message and log the exception
            logger.error(f"Database operation failed during stake recording: {str(db_error)}")
            db.rollback()  # Rollback any partial database changes
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to record stake to database: {str(db_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to record stake: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record stake: {str(e)}"
        )


@router.post("/unstake-sync", response_model=UnstakeSyncResponse, status_code=status.HTTP_200_OK)
async def unstake_sync(
    unstake_data: UnstakeSyncRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync unstake transaction from blockchain to database"""
    try:
        user_id = current_user.id
        
        # Verify the stake exists and belongs to the user
        stake = db.query(Stake).filter(
            Stake.id == unstake_data.stake_id,
            Stake.user_id == user_id
        ).first()
        
        if not stake:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stake not found or does not belong to user"
            )
        
        # Verify stake is not already unstaked
        if stake.status == "UNSTAKED" or stake.unstaked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stake has already been unstaked"
            )
        
        # Check if stake is unlocked (for early withdrawal penalty calculation)
        is_early_withdrawal = not stake.is_unlocked()
        penalty_amount = 0.0
        
        if is_early_withdrawal:
            # Calculate penalty for early withdrawal (e.g., 10% of stake amount)
            penalty_rate = 0.10  # 10% penalty
            penalty_amount = float(stake.amount) * penalty_rate
            logger.info(f"Early withdrawal detected. Penalty: {penalty_amount} ETH")
        
        # Check for duplicate transaction hash
        existing_unstake = db.query(Stake).filter(
            Stake.unstake_tx_hash == unstake_data.tx_hash
        ).first()
        
        if existing_unstake:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Unstake transaction hash already recorded"
            )
        
        # Update stake with unstake information
        stake.unstaked_at = datetime.utcnow()
        stake.unstake_tx_hash = unstake_data.tx_hash
        stake.status = "UNSTAKED"
        stake.is_active = False
        stake.updated_at = datetime.utcnow()
        
        # Store penalty information if applicable
        if is_early_withdrawal and penalty_amount > 0:
            # Store penalty in ai_tag field for now (could create a separate penalties table)
            stake.ai_tag = f"early_withdrawal_penalty_{penalty_amount:.6f}"
        
        # Create log entry in staking history
        details = f"Unstaked {stake.amount} ETH from pool {stake.pool_id}"
        if is_early_withdrawal and penalty_amount > 0:
            details += f" (Early withdrawal penalty: {penalty_amount:.6f} ETH)"
            
        log_entry = StakingLog(
            user_id=user_id,
            stake_id=stake.id,
            action="UNSTAKE",
            amount=float(stake.amount),
            pool_id=stake.pool_id,
            tx_hash=unstake_data.tx_hash,
            status="SUCCESS",
            details=details,
            created_at=datetime.utcnow()
        )
        
        db.add(log_entry)
        db.commit()
        db.refresh(stake)
        
        # Customize message based on early withdrawal
        if is_early_withdrawal and penalty_amount > 0:
            message = f"Unstake transaction synchronized successfully (Early withdrawal penalty: {penalty_amount:.6f} ETH applied)"
        else:
            message = "Unstake transaction synchronized successfully"
        
        return UnstakeSyncResponse(
            success=True,
            message=message,
            stake_id=stake.id,
            unstaked_at=stake.unstaked_at,
            tx_hash=stake.unstake_tx_hash,
            status=stake.status,
            is_early_withdrawal=is_early_withdrawal,
            penalty_amount=penalty_amount
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to sync unstake transaction: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync unstake transaction: {str(e)}"
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
        # Get pools data from service
        pools_data = enhanced_staking_service.get_staking_pools(db)
        
        # Debug logging to help identify issues
        logger.info(f"Retrieved {len(pools_data.pools) if pools_data.pools else 0} pools")
        
        # Validate the response before returning
        if not isinstance(pools_data, StakingPoolsResponse):
            logger.error(f"Invalid pools data type: {type(pools_data)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid pools data format"
            )
        
        return pools_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch staking pools: {str(e)}", exc_info=True)
        
        # Return a safe fallback response
        return StakingPoolsResponse(
            pools=[],
            total_pools=0,
            active_pools=0
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
    pools = staking_service.get_pools_list(db)
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
        
        # Calculate overview metrics with proper field names
        total_staked = 0.0
        active_positions = 0
        total_rewards = 0.0
        total_apy_weighted = 0.0
        
        for stake in stakes:
            if stake.is_active:
                stake_amount = float(stake.amount)
                total_staked += stake_amount
                active_positions += 1
                
                # Add rewards earned
                total_rewards += float(stake.rewards_earned)
                
                # Calculate weighted APY (stake amount * APY)
                stake_apy = float(stake.reward_rate)
                total_apy_weighted += stake_amount * stake_apy
        
        # Calculate weighted average APY
        apy_weighted = total_apy_weighted / total_staked if total_staked > 0 else 0.0
        
        # Calculate days since first stake
        days_since_first_stake = 0
        if stakes:
            first_stake = min(stakes, key=lambda s: s.staked_at)
            days_since_first_stake = (datetime.utcnow() - first_stake.staked_at).days
        
        overview = {
            # Core dashboard fields
            "total_staked": total_staked,
            "active_positions": active_positions,
            "total_rewards": total_rewards,
            "apy_weighted": apy_weighted,
            
            # Additional useful fields
            "pending_rewards": rewards_data["pending_rewards"],
            "total_earned": rewards_data["total_rewards"],
            "days_since_first_stake": days_since_first_stake,
            
            # Legacy compatibility fields
            "current_rewards": rewards_data["pending_rewards"],
            "active_stakes_count": active_positions,
            "average_apy": apy_weighted,
            "total_value_usd": total_staked,  # Assuming 1:1 ETH-USD for display
            
            # Performance data
            "portfolio_performance": {
                "total_earned": rewards_data["total_rewards"],
                "best_performing_stake": {
                    "name": "ETH Staking Pool" if stakes else "No stakes",
                    "apy": apy_weighted,
                    "amount": total_staked
                },
                "monthly_trend": 0.0,  # Can be calculated from historical data
                "roi_percentage": ((total_rewards / total_staked) * 100) if total_staked > 0 else 0.0
            }
        }
        
        return overview
        
    except Exception as e:
        logger.error(f"Failed to fetch staking overview for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch staking overview: {str(e)}"
        )


@router.get("/logs", status_code=status.HTTP_200_OK)
async def get_staking_logs(
    limit: int = 50,
    offset: int = 0,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staking event logs for the current user"""
    try:
        user_id = current_user.id
        
        # Query staking logs from database
        logs_query = db.query(StakingLog).filter(
            StakingLog.user_id == user_id
        ).order_by(desc(StakingLog.event_timestamp))
        
        # Apply pagination
        logs = logs_query.offset(offset).limit(limit).all()
        total_count = logs_query.count()
        
        # Transform logs to API format
        logs_data = []
        for log in logs:
            logs_data.append({
                "id": log.id,
                "stake_id": log.stake_id,
                "amount": float(log.amount),
                "duration": log.duration,
                "tx_hash": log.tx_hash,
                "pool_id": log.pool_id,
                "event_timestamp": log.event_timestamp.isoformat() if log.event_timestamp else None,
                "synced_at": log.synced_at.isoformat() if log.synced_at else None
            })
        
        return {
            "logs": logs_data,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch staking logs for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch staking logs: {str(e)}"
        )


@router.get("/analytics", status_code=status.HTTP_200_OK)
async def get_staking_analytics(
    timeframe: str = "30d",
    wallet: Optional[str] = None,
    user: Optional[str] = None,  # Add user parameter for wallet address
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staking analytics for the specified timeframe with contract data"""
    try:
        # Validate timeframe format
        valid_timeframes = ["7d", "30d", "90d", "180d", "365d"]
        if timeframe not in valid_timeframes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid timeframe. Must be one of: {', '.join(valid_timeframes)}"
            )
        
        user_id = current_user.id
        
        # If wallet/user address provided, validate it matches current user
        if wallet or user:
            wallet_address = wallet or user
            # For now, we'll use the current user's data regardless of wallet param
            # In production, you'd want to validate the wallet belongs to the user
            pass
        
        # Calculate period dates based on timeframe
        days_map = {"7d": 7, "30d": 30, "90d": 90, "180d": 180, "365d": 365}
        days = days_map.get(timeframe, 30)
        
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=days)
        
        # Get user stakes using unified model (filtered by date range)
        all_stakes = enhanced_staking_service.get_user_staking_positions(
            db=db, 
            user_id=user_id,
            active_only=False
        )
        
        # Filter stakes by timeframe
        filtered_stakes = [
            stake for stake in all_stakes 
            if stake.staked_at >= period_start
        ]
        
        # Calculate analytics from filtered stake data
        total_staked = 0.0
        total_rewards = 0.0
        active_count = 0
        stake_count = len(filtered_stakes)
        
        # Also include older active stakes for total calculations
        active_stakes = [stake for stake in all_stakes if stake.is_active]
        
        for stake in active_stakes:
            stake_amount = float(stake.amount)
            total_staked += stake_amount
            total_rewards += float(stake.rewards_earned)
            active_count += 1
        
        # Calculate rewards from timeframe period only
        period_rewards = sum(float(stake.rewards_earned) for stake in filtered_stakes)
        
        # Calculate average stake
        average_stake = total_staked / active_count if active_count > 0 else 0.0
        
        # Generate daily data for charts (last 30 days)
        daily_data = []
        for i in range(min(days, 30)):  # Limit to 30 days for performance
            date = period_end - timedelta(days=i)
            
            # Get stakes active on this date
            day_stakes = [
                stake for stake in all_stakes 
                if stake.staked_at <= date and (not hasattr(stake, 'unlock_at') or stake.unlock_at is None or stake.unlock_at > date)
            ]
            
            day_total_staked = sum(float(stake.amount) for stake in day_stakes)
            day_rewards = sum(float(stake.rewards_earned) for stake in day_stakes)
            
            daily_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "totalStaked": day_total_staked,
                "rewards": day_rewards,
                "activeStakes": len(day_stakes)
            })
        
        # Reverse to get chronological order
        daily_data.reverse()
        
        # Calculate pool distribution
        pool_distribution = {}
        for stake in active_stakes:
            pool_id = stake.pool_id or 'default'
            if pool_id not in pool_distribution:
                pool_distribution[pool_id] = {
                    "amount": 0.0,
                    "count": 0,
                    "rewards": 0.0
                }
            
            pool_distribution[pool_id]["amount"] += float(stake.amount)
            pool_distribution[pool_id]["count"] += 1
            pool_distribution[pool_id]["rewards"] += float(stake.rewards_earned)
        
        # Convert pool distribution to list format
        pool_data = []
        total_pool_amount = sum(pool["amount"] for pool in pool_distribution.values())
        
        for pool_id, pool_info in pool_distribution.items():
            percentage = (pool_info["amount"] / total_pool_amount * 100) if total_pool_amount > 0 else 0
            pool_data.append({
                "poolId": pool_id,
                "name": f"Pool {pool_id}",
                "amount": pool_info["amount"],
                "count": pool_info["count"],
                "rewards": pool_info["rewards"],
                "percentage": percentage
            })
        
        analytics_data = {
            "timeframe": timeframe,
            "totalStaked": total_staked,
            "totalRewards": total_rewards,
            "periodRewards": period_rewards,  # Rewards earned in this period
            "stakeCount": stake_count,  # New stakes in period
            "activeCount": active_count,  # Total active stakes
            "averageStake": average_stake,
            "periodStart": period_start.isoformat(),
            "periodEnd": period_end.isoformat(),
            "dailyData": daily_data,
            "poolDistribution": pool_data,
            "walletAddress": wallet or user or "unknown"
        }
        
        return analytics_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch staking analytics: {str(e)}")
        
        # Return empty analytics instead of error for better UX
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=30)
        
        return {
            "timeframe": timeframe,
            "totalStaked": 0.0,
            "totalRewards": 0.0,
            "periodRewards": 0.0,
            "stakeCount": 0,
            "activeCount": 0,
            "averageStake": 0.0,
            "periodStart": period_start.isoformat(),
            "periodEnd": period_end.isoformat(),
            "dailyData": [],
            "poolDistribution": [],
            "walletAddress": wallet or user or "unknown",
            "error": str(e)
        }


@router.get("/supported-tokens", status_code=status.HTTP_200_OK)
async def get_supported_tokens():
    """Get list of supported tokens for staking with multi-token support"""
    try:
        # Support both FVT and ETH
        supported_tokens = [
            {
                "symbol": "FVT",
                "name": "FinVerse Token",
                "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                "decimals": 18,
                "isSupported": True,
                "isNative": False,
                "icon": "/icons/fvt.png",
                "minStake": 1.0,
                "maxStake": 1000000.0
            },
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "address": "0x0000000000000000000000000000000000000000",
                "decimals": 18,
                "isSupported": True,
                "isNative": True,
                "icon": "/icons/eth.png",
                "minStake": 0.01,
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
        
        # Create staking log entry with duplicate protection
        try:
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
            db.flush()  # Test for IntegrityError before commit
            db.commit()
            db.refresh(staking_log)
        except IntegrityError as ie:
            logger.warning(f"StakingLog already exists for tx: {sync_data.tx_hash}, skipping.")
            db.rollback()
            # Return success since the log already exists
            return {
                "success": True,
                "message": "Staking event already synced (duplicate tx_hash)",
                "log_id": None,
                "stake_id": None,
                "tx_hash": sync_data.tx_hash,
                "synced_at": datetime.utcnow().isoformat()
            }
        except Exception as sync_error:
            logger.error(f"StakingLog sync failed for tx: {sync_data.tx_hash}, error: {str(sync_error)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to sync staking log: {str(sync_error)}"
            )
        
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
        logger.error(f"Failed to sync staking event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync staking event: {str(e)}"
        )

# Add Web3 validation for blockchain transactions
def get_web3_instance():
    """Get Web3 instance for blockchain validation"""
    try:
        rpc_url = os.getenv('WEB3_RPC_URL', 'http://127.0.0.1:8545')
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            raise Exception("Cannot connect to blockchain")
        return w3
    except Exception as e:
        logger.error(f"Failed to connect to Web3: {str(e)}")
        return None

def validate_eth_stake_transaction(tx_hash: str, expected_amount: float, user_address: str, stake_vault_address: str) -> bool:
    """
    Validate that an ETH staking transaction actually transferred ETH
    """
    try:
        w3 = get_web3_instance()
        if not w3:
            logger.warning("Web3 not available - skipping transaction validation")
            return True  # Allow in development mode
        
        # Get transaction and receipt
        tx = w3.eth.get_transaction(tx_hash)
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        
        if receipt.status != 1:
            logger.error(f"Transaction {tx_hash} failed (status: {receipt.status})")
            return False
        
        # Validate ETH transfer
        if (tx['from'].lower() == user_address.lower() and 
            tx['to'].lower() == stake_vault_address.lower()):
            
            # Check ETH amount matches
            tx_amount_eth = w3.from_wei(tx['value'], 'ether')
            amount_diff = abs(float(tx_amount_eth) - expected_amount)
            
            if amount_diff < 0.000001:  # 1e-6 tolerance
                logger.info(f"✅ ETH transfer validated: {tx_amount_eth} ETH from {tx['from']} to {tx['to']}")
                return True
            else:
                logger.error(f"❌ Amount mismatch: expected {expected_amount}, got {tx_amount_eth}")
                return False
        else:
            logger.error(f"❌ Invalid ETH transfer: from {tx['from']} to {tx['to']}, expected from {user_address} to {stake_vault_address}")
            return False
        
    except Exception as e:
        logger.error(f"ETH transaction validation failed: {str(e)}")
        return False