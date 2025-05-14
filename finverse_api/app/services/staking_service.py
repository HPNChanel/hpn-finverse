"""
Staking service for FinVerse API
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import uuid
import hashlib

from app.models.user import User
from app.models.staking import Stake, StakingAccount
from app.models.transaction import Transaction, TransactionType
from app.schemas.staking import StakingAccountCreate


def create_stake(db: Session, user_id: int, amount: float):
    """Create or update a stake for a user"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        amount=amount,
        transaction_type=TransactionType.STAKE
    )
    db.add(transaction)
    
    # Create or update stake
    stake = db.query(Stake).filter(Stake.user_id == user_id).first()
    if stake:
        # Update existing stake
        new_amount = stake.amount + amount
        stake.update_amount(new_amount)
    else:
        # Create new stake
        stake = Stake(user_id=user_id, amount=amount)
        db.add(stake)
    
    db.commit()
    db.refresh(stake)
    return stake


def remove_stake(db: Session, user_id: int, amount: float):
    """Remove stake amount for a user"""
    # Check if user exists and has a stake
    stake = db.query(Stake).filter(Stake.user_id == user_id).first()
    if not stake:
        return None
    
    # Check if unstake amount is valid
    if amount > stake.amount:
        return None
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        amount=amount,
        transaction_type=TransactionType.UNSTAKE
    )
    db.add(transaction)
    
    # Update stake
    new_amount = stake.amount - amount
    if new_amount == 0:
        # Remove stake entirely
        db.delete(stake)
        db.commit()
        return None
    else:
        # Update with remaining amount
        stake.update_amount(new_amount)
        db.commit()
        return stake


def get_stake_status(db: Session, user_id: int):
    """Get stake status for a user"""
    stake = db.query(Stake).filter(Stake.user_id == user_id).first()
    if not stake:
        return {
            "user_id": user_id,
            "total_staked": 0,
            "last_updated": datetime.utcnow()
        }
    
    return {
        "user_id": stake.user_id,
        "total_staked": stake.amount,
        "last_updated": stake.updated_at
    }


def generate_address(name: str) -> str:
    """Generate a deterministic wallet address based on name and random UUID"""
    unique_id = str(uuid.uuid4())
    combined = f"{name}:{unique_id}"
    return hashlib.sha256(combined.encode()).hexdigest()


def create_staking_account(db: Session, user_id: int, account_data: StakingAccountCreate) -> Optional[StakingAccount]:
    """Create a new staking account for user"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    # Generate address
    address = generate_address(account_data.name)
    
    # Create account
    staking_account = StakingAccount(
        user_id=user_id,
        name=account_data.name,
        address=address,
        balance=account_data.initial_balance or 0.0
    )
    
    # Add transaction if initial balance > 0
    if account_data.initial_balance and account_data.initial_balance > 0:
        transaction = Transaction(
            user_id=user_id,
            amount=account_data.initial_balance,
            transaction_type=TransactionType.DEPOSIT,
            description=f"Initial deposit to staking account: {account_data.name}"
        )
        db.add(transaction)
    
    db.add(staking_account)
    db.commit()
    db.refresh(staking_account)
    
    return staking_account


def get_staking_account(db: Session, account_id: int, user_id: Optional[int] = None) -> Optional[StakingAccount]:
    """Get staking account by ID and optionally filter by user_id"""
    query = db.query(StakingAccount).filter(StakingAccount.id == account_id)
    
    if user_id:
        query = query.filter(StakingAccount.user_id == user_id)
    
    return query.first()


def get_user_staking_accounts(db: Session, user_id: int) -> List[StakingAccount]:
    """Get all staking accounts for a user"""
    return db.query(StakingAccount).filter(
        StakingAccount.user_id == user_id,
        StakingAccount.is_active == True
    ).all()


def get_staking_reward(staked_amount: float, days: int, apy: float = 5.0) -> float:
    """Calculate staking rewards based on amount, days staked, and APY"""
    # Convert APY to daily rate
    daily_rate = apy / 100 / 365
    
    # Calculate rewards
    return staked_amount * daily_rate * days


def get_staking_profile(db: Session, user_id: int, account_id: Optional[int] = None):
    """Get staking profile with account, status and rewards"""
    # Get accounts
    if account_id:
        accounts = [get_staking_account(db, account_id, user_id)]
        if not accounts[0]:
            return None
    else:
        accounts = get_user_staking_accounts(db, user_id)
        if not accounts:
            return None
    
    # Get stake status
    stake_status = get_stake_status(db, user_id)
    
    # Calculate rewards and create profiles
    profiles = []
    for account in accounts:
        # Calculate days staked
        days_staked = (datetime.utcnow() - account.created_at).days
        
        # Calculate rewards
        apy = 7.5 if days_staked > 90 else 5.0
        earned = get_staking_reward(account.balance, days_staked, apy)
        
        # Create profile
        profile = {
            "account": account,
            "status": {
                "total_staked": stake_status["total_staked"],
                "last_updated": stake_status["last_updated"].isoformat()
            },
            "rewards": {
                "earned": earned,
                "apy": apy,
                "duration_days": days_staked
            }
        }
        profiles.append(profile)
    
    if account_id:
        return profiles[0]
    
    return {"accounts": profiles} 