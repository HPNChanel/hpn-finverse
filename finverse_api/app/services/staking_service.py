"""
Staking service for FinVerse API
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import uuid
import hashlib

from app.models.user import User
from app.models.staking import Stake
from app.models.transaction import Transaction, TransactionType
from app.schemas.staking import StakeCreate


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
    
    # Create a default stake if none exists
    default_stake = db.query(Stake).filter(
        Stake.user_id == user_id,
        Stake.name == "Main Staking Pool"
    ).first()
    
    if default_stake:
        # Update existing stake
        new_amount = default_stake.amount + amount
        default_stake.amount = new_amount
        default_stake.updated_at = datetime.utcnow()
    else:
        # Create new default stake
        address = generate_address("Main Staking Pool")
        default_stake = Stake(
            user_id=user_id, 
            name="Main Staking Pool",
            address=address,
            amount=amount,
            balance=amount,
            is_active=True
        )
        db.add(default_stake)
    
    db.commit()
    db.refresh(default_stake)
    return default_stake


def remove_stake(db: Session, user_id: int, amount: float):
    """Remove stake amount for a user"""
    # Check if user exists and has a stake
    stake = db.query(Stake).filter(
        Stake.user_id == user_id,
        Stake.name == "Main Staking Pool"
    ).first()
    
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
        # Set amount to 0 but keep the stake record
        stake.amount = 0
        stake.updated_at = datetime.utcnow()
    else:
        # Update with remaining amount
        stake.amount = new_amount
        stake.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(stake)
    return stake


def get_stake_status(db: Session, user_id: int):
    """Get stake status for a user"""
    # Sum all stakes for the user
    stakes = db.query(Stake).filter(Stake.user_id == user_id).all()
    if not stakes:
        return {
            "user_id": user_id,
            "total_staked": 0,
            "last_updated": datetime.utcnow()
        }
    
    total_staked = sum(stake.amount for stake in stakes)
    last_updated = max(stake.updated_at for stake in stakes)
    
    return {
        "user_id": user_id,
        "total_staked": total_staked,
        "last_updated": last_updated
    }


def generate_address(name: str) -> str:
    """Generate a deterministic wallet address based on name and random UUID"""
    unique_id = str(uuid.uuid4())
    combined = f"{name}:{unique_id}"
    return hashlib.sha256(combined.encode()).hexdigest()


def create_staking_account(db: Session, user_id: int, account_data: StakeCreate) -> Optional[Stake]:
    """Create a new staking account for user"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    # Generate address if not provided
    address = account_data.address if hasattr(account_data, 'address') and account_data.address else generate_address(account_data.name)
    
    # Create stake
    stake = Stake(
        user_id=user_id,
        name=account_data.name,
        address=address,
        amount=account_data.amount,
        balance=account_data.amount,
        is_active=True
    )
    
    # Add transaction if initial amount > 0
    if account_data.amount > 0:
        transaction = Transaction(
            user_id=user_id,
            amount=account_data.amount,
            transaction_type=TransactionType.STAKE,
            description=f"Initial stake: {account_data.name}"
        )
        db.add(transaction)
    
    db.add(stake)
    db.commit()
    db.refresh(stake)
    
    return stake


def get_staking_account(db: Session, account_id: int, user_id: Optional[int] = None) -> Optional[Stake]:
    """Get staking account by ID and optionally filter by user_id"""
    query = db.query(Stake).filter(Stake.id == account_id)
    
    if user_id:
        query = query.filter(Stake.user_id == user_id)
    
    return query.first()


def get_user_staking_accounts(db: Session, user_id: int) -> List[Stake]:
    """Get all staking accounts for a user"""
    return db.query(Stake).filter(
        Stake.user_id == user_id,
        Stake.is_active == True
    ).all()


def get_staking_reward(staked_amount: float, days: int, apy: float = 5.0) -> float:
    """Calculate staking rewards based on amount, days staked, and APY"""
    # Convert APY to daily rate
    daily_rate = apy / 100 / 365
    
    # Calculate rewards
    return staked_amount * daily_rate * days


def get_staking_profile(db: Session, user_id: int, account_id: Optional[int] = None):
    """Get staking profile with stake, status and rewards"""
    # Get accounts
    if account_id:
        stakes = [get_staking_account(db, account_id, user_id)]
        if not stakes[0]:
            return None
    else:
        stakes = get_user_staking_accounts(db, user_id)
        if not stakes:
            return {"stakes": []}
    
    # Get stake status
    stake_status = get_stake_status(db, user_id)
    
    # Calculate rewards and create profiles
    profiles = []
    for stake in stakes:
        # Calculate days staked
        days_staked = (datetime.utcnow() - stake.created_at).days
        
        # Calculate rewards
        apy = 7.5 if days_staked > 90 else 5.0
        earned = get_staking_reward(stake.amount, days_staked, apy)
        
        # Create profile
        profile = {
            "stake": stake,
            "rewards": {
                "earned": earned,
                "apy": apy,
                "duration_days": days_staked
            }
        }
        profiles.append(profile)
    
    if account_id:
        return profiles[0]
    
    return {"stakes": profiles} 