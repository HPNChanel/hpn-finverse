"""
Staking service for FinVerse API - Enhanced with unified Stake model
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from decimal import Decimal

from app.models.stake import Stake
from app.models.user import User
from app.schemas.staking import (
    StakeCreate, StakeUpdate, StakingPositionResponse,
    UserStakesResponse, StakingPoolInfo, StakingPoolsResponse, RewardsResponse,
    StakingRecordRequest
)

logger = logging.getLogger(__name__)

class StakingService:
    """Enhanced staking service with unified Stake model"""
    
    def create_stake(self, db: Session, user_id: int, amount: float, pool_id: str = "default-pool") -> Optional[Stake]:
        """Create a new stake using unified model - replaces legacy create_stake"""
        try:
            return self.save_stake(
                db=db,
                user_id=user_id,
                pool_id=pool_id,
                amount=amount,
                tx_hash=None,
                lock_period=0,
                reward_rate=5.0
            )
        except Exception as e:
            logger.error(f"Error creating stake: {str(e)}")
            return None
    
    def save_stake(
        self, 
        db: Session, 
        user_id: int, 
        pool_id: str, 
        amount: float, 
        tx_hash: Optional[str] = None, 
        lock_period: int = 0,
        reward_rate: float = 5.0
    ) -> Optional[Stake]:
        """Save a new staking position to database using unified model"""
        try:
            stake = Stake.create_with_unlock_calculation(
                user_id=user_id,
                pool_id=pool_id,
                amount=Decimal(str(amount)),
                staked_at=datetime.utcnow(),
                lock_period=lock_period,
                reward_rate=Decimal(str(reward_rate)),
                apy_snapshot=Decimal(str(reward_rate)),
                tx_hash=tx_hash,
                is_active=True,
                status="ACTIVE",
                rewards_earned=Decimal('0'),
                claimable_rewards=Decimal('0'),
                model_confidence=0.8,
                ai_tag="system_created"
            )
            
            db.add(stake)
            db.commit()
            db.refresh(stake)
            return stake
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving stake: {str(e)}")
            return None
    
    def get_user_stakes(self, db: Session, user_id: int) -> List[Stake]:
        """Get all stakes for a user using unified model"""
        return self.get_user_staking_positions(db, user_id)
    
    def get_user_staking_positions(
        self, 
        db: Session, 
        user_id: int,
        active_only: bool = False
    ) -> List[Stake]:
        """Get all staking positions for a user using unified model"""
        query = db.query(Stake).filter(Stake.user_id == user_id)
        
        if active_only:
            query = query.filter(Stake.is_active == True)
        
        return query.order_by(desc(Stake.created_at)).all()
    
    def get_stake_status(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get staking status using unified model"""
        stakes = self.get_user_stakes(db, user_id)
        
        total_staked = sum(float(stake.amount) for stake in stakes if stake.is_active)
        total_rewards = sum(float(stake.rewards_earned) for stake in stakes)
        active_stakes = len([stake for stake in stakes if stake.is_active])
        
        return {
            "user_id": user_id,
            "total_staked": total_staked,
            "total_rewards": total_rewards,
            "active_stakes": active_stakes,
            "stakes": stakes
        }
    
    def remove_stake(self, db: Session, user_id: int, amount: float) -> Optional[bool]:
        """Remove/unstake funds from active stakes"""
        try:
            # Find active stakes with sufficient amount
            remaining_amount = amount
            stakes_to_update = []
            
            active_stakes = db.query(Stake).filter(
                and_(
                    Stake.user_id == user_id,
                    Stake.is_active == True
                )
            ).order_by(Stake.created_at).all()
            
            for stake in active_stakes:
                if remaining_amount <= 0:
                    break
                    
                stake_amount = float(stake.amount)
                if stake_amount <= remaining_amount:
                    # Remove entire stake
                    stake.is_active = False
                    stake.status = "COMPLETED"
                    remaining_amount -= stake_amount
                    stakes_to_update.append(stake)
                else:
                    # Partially remove stake
                    stake.amount = Decimal(str(stake_amount - remaining_amount))
                    remaining_amount = 0
                    stakes_to_update.append(stake)
            
            if remaining_amount > 0:
                return None  # Not enough stake to remove
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error removing stake: {str(e)}")
            return None
    
    def update_stake_rewards(self, db: Session, stake_id: int, rewards_earned: float, claimable_rewards: float = None) -> Optional[Stake]:
        """Update rewards for a specific stake"""
        try:
            stake = db.query(Stake).filter(Stake.id == stake_id).first()
            if not stake:
                return None
            
            stake.rewards_earned = Decimal(str(rewards_earned))
            if claimable_rewards is not None:
                stake.claimable_rewards = Decimal(str(claimable_rewards))
            stake.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(stake)
            return stake
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating stake rewards: {str(e)}")
            return None
    
    def claim_stake_rewards(self, db: Session, stake_id: int, claimed_amount: float) -> Optional[bool]:
        """Claim rewards from a specific stake"""
        try:
            stake = db.query(Stake).filter(Stake.id == stake_id).first()
            if not stake:
                return None
            
            current_claimable = float(stake.claimable_rewards)
            if claimed_amount > current_claimable:
                return None  # Cannot claim more than available
            
            stake.claimable_rewards = Decimal(str(current_claimable - claimed_amount))
            stake.updated_at = datetime.utcnow()
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error claiming stake rewards: {str(e)}")
            return None
    
    def calculate_stake_rewards(self, stake: Stake) -> float:
        """Calculate current rewards for a stake"""
        try:
            # Simple APY calculation based on time staked
            days_staked = (datetime.utcnow() - stake.staked_at).days
            if days_staked <= 0:
                return 0.0
            
            annual_rate = float(stake.reward_rate) / 100.0
            daily_rate = annual_rate / 365.0
            
            principal = float(stake.amount)
            rewards = principal * daily_rate * days_staked
            
            return rewards
            
        except Exception as e:
            logger.error(f"Error calculating stake rewards: {str(e)}")
            return 0.0
    
    def get_user_stakes_summary(self, db: Session, user_id: int) -> UserStakesResponse:
        """Get comprehensive stakes summary for a user"""
        try:
            stakes = self.get_user_staking_positions(db, user_id)
            
            # Convert to response format
            positions = []
            for stake in stakes:
                position = StakingPositionResponse(
                    id=stake.id,
                    user_id=stake.user_id,
                    pool_id=stake.pool_id,
                    amount=float(stake.amount),
                    staked_at=stake.staked_at,
                    lock_period=stake.lock_period,
                    reward_rate=float(stake.reward_rate),
                    tx_hash=stake.tx_hash,
                    is_active=stake.is_active,
                    unlock_date=stake.unlock_at,
                    rewards_earned=float(stake.rewards_earned),
                    last_reward_calculation=stake.updated_at,
                    status=stake.status,
                    created_at=stake.created_at,
                    updated_at=stake.updated_at,
                    is_unlocked=stake.is_unlocked(),
                    days_remaining=stake.days_remaining()
                )
                positions.append(position)
            
            # Calculate summary stats
            total_staked = sum(float(s.amount) for s in stakes if s.is_active)
            total_rewards = sum(float(s.rewards_earned) for s in stakes)
            active_count = len([s for s in stakes if s.is_active])
            
            return UserStakesResponse(
                positions=positions,
                total_staked=total_staked,
                total_rewards=total_rewards,
                total_positions=len(positions),
                active_positions=active_count
            )
            
        except Exception as e:
            logger.error(f"Error getting user stakes summary: {str(e)}")
            return UserStakesResponse(
                positions=[],
                total_staked=0.0,
                total_rewards=0.0,
                total_positions=0,
                active_positions=0
            )
    
    def update_staking_position(
        self,
        db: Session,
        position_id: int,
        user_id: int,
        update_data: Dict[str, Any]
    ) -> Optional[Stake]:
        """Update a staking position"""
        try:
            stake = db.query(Stake).filter(
                and_(
                    Stake.id == position_id,
                    Stake.user_id == user_id
                )
            ).first()
            
            if not stake:
                return None
            
            # Update allowed fields
            for field, value in update_data.items():
                if hasattr(stake, field) and field not in ['id', 'user_id', 'created_at']:
                    if field in ['amount', 'reward_rate', 'rewards_earned', 'claimable_rewards']:
                        setattr(stake, field, Decimal(str(value)))
                    else:
                        setattr(stake, field, value)
            
            stake.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(stake)
            return stake
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating staking position: {str(e)}")
            return None
    
    def get_staking_pools(self, db: Session) -> StakingPoolsResponse:
        """Get available staking pools"""
        # Mock pools for now - in production this would come from database
        pools = [
            StakingPoolInfo(
                pool_id="flexible",
                name="Flexible Staking",
                description="Stake with no lock period",
                apy=5.0,
                min_stake=0.01,
                max_stake=10000.0,
                lock_period=0,
                is_active=True
            ),
            StakingPoolInfo(
                pool_id="30day",
                name="30-Day Lock",
                description="Higher rewards with 30-day lock",
                apy=7.5,
                min_stake=0.1,
                max_stake=50000.0,
                lock_period=30,
                is_active=True
            ),
            StakingPoolInfo(
                pool_id="90day",
                name="90-Day Lock",
                description="Best rewards with 90-day lock",
                apy=12.0,
                min_stake=1.0,
                max_stake=100000.0,
                lock_period=90,
                is_active=True
            )
        ]
        
        return StakingPoolsResponse(pools=pools)
    
    def get_user_rewards(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get rewards summary for a user"""
        try:
            stakes = self.get_user_staking_positions(db, user_id)
            
            total_rewards = sum(float(s.rewards_earned) for s in stakes)
            pending_rewards = sum(float(s.claimable_rewards) for s in stakes if s.is_active)
            
            return {
                "total_rewards": total_rewards,
                "pending_rewards": pending_rewards,
                "last_calculation": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Error getting user rewards: {str(e)}")
            return {
                "total_rewards": 0.0,
                "pending_rewards": 0.0,
                "last_calculation": datetime.utcnow()
            }
    
    def get_analytics(self, db: Session, timeframe: str, user_id: int = None) -> Dict[str, Any]:
        """Get staking analytics for timeframe"""
        try:
            # Parse timeframe
            days = int(timeframe.replace('d', ''))
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = db.query(Stake).filter(Stake.created_at >= start_date)
            if user_id:
                query = query.filter(Stake.user_id == user_id)
            
            stakes = query.all()
            
            # Calculate analytics
            total_staked = sum(float(s.amount) for s in stakes if s.is_active)
            total_rewards = sum(float(s.rewards_earned) for s in stakes)
            stake_count = len(stakes)
            active_count = len([s for s in stakes if s.is_active])
            
            return {
                "timeframe": timeframe,
                "total_staked": total_staked,
                "total_rewards": total_rewards,
                "stake_count": stake_count,
                "active_count": active_count,
                "average_stake": total_staked / active_count if active_count > 0 else 0,
                "period_start": start_date.isoformat(),
                "period_end": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting analytics: {str(e)}")
            return {"error": str(e)}

# Create singleton instance
staking_service = StakingService()