"""
Unified Staking model for FinVerse API
"""

from __future__ import annotations
from datetime import datetime, timedelta
from enum import Enum as PyEnum
from sqlalchemy import Column, BigInteger, Float, String, DateTime, ForeignKey, Integer, Boolean, DECIMAL
from sqlalchemy.orm import relationship

from app.db.session import Base


class StakeStatus(str, PyEnum):
    """Enum for stake status"""
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Stake(Base):
    """Unified Stake model combining legacy stakes and staking_positions functionality"""
    
    __tablename__ = "stakes"
    
    # Core identification
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    pool_id = Column(String(50), nullable=False, index=True, comment="Staking pool identifier")
    
    # Financial fields with high precision
    amount = Column(DECIMAL(18, 8), nullable=False, comment="Staked amount with crypto precision")
    claimable_rewards = Column(DECIMAL(18, 8), default=0.00000000, nullable=False, comment="Rewards available to claim")
    rewards_earned = Column(DECIMAL(18, 8), default=0.00000000, nullable=False, comment="Total rewards earned")
    predicted_reward = Column(DECIMAL(18, 8), nullable=True, comment="ML predicted reward for this stake")
    
    # Time tracking
    staked_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="When the stake was created")
    unlock_at = Column(DateTime, nullable=True, comment="When stake can be withdrawn")
    lock_period = Column(Integer, nullable=False, default=0, comment="Lock period in days")
    
    # Rate tracking with snapshots
    reward_rate = Column(DECIMAL(5, 4), nullable=False, default=0.0000, comment="Annual reward rate as percentage (4 decimals)")
    apy_snapshot = Column(DECIMAL(5, 2), nullable=True, comment="APY at the time of staking (2 decimals)")
    
    # Blockchain & status
    tx_hash = Column(String(100), nullable=True, unique=True, comment="Blockchain transaction hash")
    is_active = Column(Boolean, default=True, nullable=False, comment="Whether stake is currently active")
    status = Column(String(20), nullable=False, default=StakeStatus.ACTIVE, comment="Stake status enum")
    
    # AI & Analytics fields
    model_confidence = Column(Float, nullable=True, comment="AI model confidence score (0.0-1.0)")
    ai_tag = Column(String(50), nullable=True, comment="AI-assigned tag for stake pattern")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="stakes")
    # TEMPORARILY COMMENTED OUT - financial_account relationship until properly configured
    # financial_account = relationship("FinancialAccount", back_populates="stakes")
    
    def calculate_unlock_at(self):
        """Calculate unlock_at based on staked_at and lock_period"""
        if self.staked_at and self.lock_period > 0:
            self.unlock_at = self.staked_at + timedelta(days=self.lock_period)
    
    def is_unlocked(self):
        """Check if stake is unlocked"""
        if not self.unlock_at:
            return True
        return datetime.utcnow() >= self.unlock_at
    
    def days_remaining(self):
        """Calculate days remaining until unlock"""
        if not self.unlock_at:
            return None
        
        now = datetime.utcnow()
        if now >= self.unlock_at:
            return 0
        
        delta = self.unlock_at - now
        return delta.days
    
    def to_dict(self):
        """Convert stake to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "pool_id": self.pool_id,
            "amount": float(self.amount) if self.amount else 0.0,
            "staked_at": self.staked_at.isoformat() if self.staked_at else None,
            "unlock_at": self.unlock_at.isoformat() if self.unlock_at else None,
            "lock_period": self.lock_period,
            "reward_rate": float(self.reward_rate) if self.reward_rate else 0.0,
            "apy_snapshot": float(self.apy_snapshot) if self.apy_snapshot else None,
            "claimable_rewards": float(self.claimable_rewards) if self.claimable_rewards else 0.0,
            "rewards_earned": float(self.rewards_earned) if self.rewards_earned else 0.0,
            "tx_hash": self.tx_hash,
            "is_active": self.is_active,
            "status": self.status,
            "model_confidence": self.model_confidence,
            "ai_tag": self.ai_tag,
            "predicted_reward": float(self.predicted_reward) if self.predicted_reward else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_unlocked": self.is_unlocked(),
            "days_remaining": self.days_remaining()
        }
    
    def update_rewards(self, new_rewards_earned: float, new_claimable: float = None):
        """Update reward tracking"""
        self.rewards_earned = new_rewards_earned
        if new_claimable is not None:
            self.claimable_rewards = new_claimable
        self.updated_at = datetime.utcnow()
    
    def claim_rewards(self, claimed_amount: float):
        """Process reward claim"""
        if claimed_amount <= float(self.claimable_rewards):
            self.claimable_rewards = float(self.claimable_rewards) - claimed_amount
            self.updated_at = datetime.utcnow()
            return True
        return False
    
    @classmethod
    def create_with_unlock_calculation(cls, **kwargs):
        """Create stake with automatic unlock_at calculation"""
        stake = cls(**kwargs)
        stake.calculate_unlock_at()
        return stake