"""
Staking router for FinVerse API
"""

from fastapi import APIRouter, HTTPException, status, Header, Depends
from typing import Optional
from sqlalchemy.orm import Session

from app.schemas.staking import (
    StakeBase, StakeCreate, StakeResponse, StakeStatus, 
    StakingAccountCreate, StakingAccountResponse, StakingAccountList,
    StakingProfileResponse, StakingProfileList
)
from app.services import staking_service, user_service
from app.db.session import get_db
from app.core.auth import get_current_user

router = APIRouter(
    prefix="/staking",
    tags=["Staking"]
)


@router.post("/stake", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def stake(
    stake_data: StakeBase, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stake funds"""
    user_id = current_user.id
    
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
    
    return staking_service.get_stake_status(db=db, user_id=user_id)


@router.post("/unstake", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def unstake(
    stake_data: StakeBase, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unstake funds"""
    user_id = current_user.id
    
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
    
    return staking_service.get_stake_status(db=db, user_id=user_id)


@router.get("/status", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def get_stake_status(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staking status for current user"""
    user_id = current_user.id
    return staking_service.get_stake_status(db=db, user_id=user_id)


@router.get("/status/{account_id}", response_model=StakeStatus, status_code=status.HTTP_200_OK)
async def get_stake_status_by_account(
    account_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
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
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
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