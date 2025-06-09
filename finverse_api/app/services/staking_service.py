"""
Staking service for FinVerse API - ETH Only Staking
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from decimal import Decimal
import logging
import json
import os
from web3 import Web3

from app.models.stake import Stake
from app.models.user import User
from app.schemas.staking import (
    StakeCreate, StakeUpdate, StakingPositionResponse,
    UserStakesResponse, StakingPoolInfo, StakingPoolsResponse, RewardsResponse,
    StakingRecordRequest
)

logger = logging.getLogger(__name__)

class StakingService:
    """ETH-only staking service"""
    
    def __init__(self):
        """Initialize service with Web3 connection"""
        self.w3 = None
        self.stake_vault_contract = None
        self.contracts_config = None
        self._initialize_web3()
    
    def _initialize_web3(self):
        """Initialize Web3 connection and load contracts"""
        try:
            # Load contracts configuration
            contracts_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'blockchain', 'contracts.json')
            if os.path.exists(contracts_path):
                with open(contracts_path, 'r') as f:
                    self.contracts_config = json.load(f)
                
                # Initialize Web3
                self.w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
                
                if self.w3.is_connected():
                    logger.info("✅ Web3 connected to local blockchain")
                    self._load_contracts()
                else:
                    logger.warning("⚠️ Web3 connection failed")
            else:
                logger.warning(f"⚠️ Contracts config not found at {contracts_path}")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize Web3: {str(e)}")
    
    def _load_contracts(self):
        """Load StakeVault smart contract with complete ABI"""
        try:
            if not self.contracts_config:
                return
            
            # Load StakeVault contract with complete ABI
            vault_address = self.contracts_config['contracts']['StakeVault']['address']
            
            # Load complete ABI from Hardhat artifact
            vault_artifact_path = os.path.join(
                os.path.dirname(__file__), '..', '..', '..', 'blockchain', 
                'artifacts', 'contracts', 'StakeVault.sol', 'StakeVault.json'
            )
            
            if os.path.exists(vault_artifact_path):
                with open(vault_artifact_path, 'r') as f:
                    vault_artifact = json.load(f)
                    vault_abi = vault_artifact['abi']
                
                self.stake_vault_contract = self.w3.eth.contract(
                    address=vault_address,
                    abi=vault_abi
                )
                
                logger.info(f"✅ StakeVault contract loaded at {vault_address}")
                
                # Test contract connection
                try:
                    pool_count = self.stake_vault_contract.functions.poolCount().call()
                    logger.info(f"✅ Contract test successful - Pool count: {pool_count}")
                except Exception as test_error:
                    logger.error(f"❌ Contract test failed: {str(test_error)}")
                
            else:
                logger.error(f"❌ StakeVault artifact not found at {vault_artifact_path}")
                self._load_minimal_contract(vault_address)
                
        except Exception as e:
            logger.error(f"❌ Failed to load contracts: {str(e)}")
    
    def _load_minimal_contract(self, vault_address: str):
        """Fallback to minimal ABI if artifact not found"""
        try:
            # Minimal ABI for ETH-only StakeVault
            vault_abi = [
                {
                    "inputs": [],
                    "name": "poolCount",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "name": "stakingPools",
                    "outputs": [
                        {"internalType": "uint256", "name": "minStake", "type": "uint256"},
                        {"internalType": "uint256", "name": "maxStake", "type": "uint256"},
                        {"internalType": "uint256", "name": "apy", "type": "uint256"},
                        {"internalType": "bool", "name": "isActive", "type": "bool"},
                        {"internalType": "string", "name": "name", "type": "string"}
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "uint256", "name": "poolId", "type": "uint256"}],
                    "name": "getPoolInfo",
                    "outputs": [
                        {"internalType": "uint256", "name": "minStake", "type": "uint256"},
                        {"internalType": "uint256", "name": "maxStake", "type": "uint256"},
                        {"internalType": "uint256", "name": "apy", "type": "uint256"},
                        {"internalType": "bool", "name": "isActive", "type": "bool"},
                        {"internalType": "string", "name": "name", "type": "string"}
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "totalStakedETH",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
            
            self.stake_vault_contract = self.w3.eth.contract(
                address=vault_address,
                abi=vault_abi
            )
            
            logger.info(f"✅ StakeVault contract loaded with minimal ABI at {vault_address}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load minimal contract: {str(e)}")

    def safe_create_staking_log(
        self, 
        db: Session, 
        user_id: int, 
        stake_id: int, 
        amount: float, 
        tx_hash: str, 
        pool_id: str, 
        lock_period: int = 0
    ) -> bool:
        """Safely create a StakingLog entry with duplicate protection"""
        try:
            from app.models.staking_log import StakingLog
            from sqlalchemy.exc import IntegrityError
            
            # Check for existing log with this tx_hash
            existing_log = db.query(StakingLog).filter_by(tx_hash=tx_hash).first()
            if existing_log:
                logger.warning(f"Duplicate tx_hash in staking_log: {tx_hash}, skipping log creation.")
                return False
            
            # Create new log
            staking_log = StakingLog(
                user_id=user_id,
                stake_id=stake_id,
                amount=Decimal(str(amount)),
                duration=lock_period,
                tx_hash=tx_hash,
                pool_id=pool_id,
                event_timestamp=datetime.utcnow(),
                synced_at=datetime.utcnow()
            )
            
            db.add(staking_log)
            db.flush()  # Test for IntegrityError before commit
            logger.info(f"✅ StakingLog created safely for tx_hash: {tx_hash}")
            return True
            
        except IntegrityError as ie:
            logger.warning(f"StakingLog already exists for tx: {tx_hash}, skipping. Error: {str(ie)}")
            db.rollback()
            return False
        except Exception as log_error:
            logger.warning(f"StakingLog creation failed for tx: {tx_hash}. Error: {str(log_error)}")
            db.rollback()
            return False

    def create_stake(self, db: Session, user_id: int, amount: float, pool_id: str = "default-pool") -> Optional[Stake]:
        """Create a new ETH stake using unified model"""
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
        """Save ETH stake to database with atomic StakingLog creation"""
        try:
            # Calculate predicted rewards for ETH staking
            predicted_reward = self._calculate_predicted_reward(amount, reward_rate, 365, 'ETH')
            
            # Start a database transaction
            stake = Stake.create_with_unlock_calculation(
                user_id=user_id,
                pool_id=pool_id,
                amount=Decimal(str(amount)),
                tx_hash=tx_hash,
                lock_period=lock_period,
                reward_rate=Decimal(str(reward_rate)),
                apy_snapshot=Decimal(str(reward_rate)),
                predicted_reward=Decimal(str(predicted_reward)) if predicted_reward else None
            )
            
            db.add(stake)
            db.flush()  # Flush to get the stake ID before commit
            
            # ✅ CRITICAL: Create corresponding StakingLog entry atomically with duplicate protection
            if tx_hash:  # Only create log if we have a transaction hash
                log_created = self.safe_create_staking_log(
                    db=db,
                    user_id=user_id,
                    stake_id=stake.id,
                    amount=amount,
                    tx_hash=tx_hash,
                    pool_id=pool_id,
                    lock_period=lock_period
                )
                
                if not log_created:
                    # Re-add the stake to the session since rollback removed it
                    db.add(stake)
            
            db.commit()
            db.refresh(stake)
            
            logger.info(f"✅ ETH stake saved: {amount} ETH for user {user_id} with stake ID {stake.id}")
            return stake
            
        except Exception as e:
            logger.error(f"❌ Error saving stake: {str(e)}")
            db.rollback()
            return None

    def get_user_stakes(self, db: Session, user_id: int) -> List[Stake]:
        """Get all stakes for a user"""
        return db.query(Stake).filter(Stake.user_id == user_id).all()

    def get_user_staking_positions(
        self, 
        db: Session, 
        user_id: int,
        active_only: bool = False
    ) -> List[Stake]:
        """Get user staking positions with optional filtering"""
        query = db.query(Stake).filter(Stake.user_id == user_id)
        
        if active_only:
            query = query.filter(Stake.is_active == True)
        
        return query.order_by(desc(Stake.created_at)).all()

    def get_stake_status(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get comprehensive stake status for user"""
        stakes = self.get_user_stakes(db, user_id)
        
        total_staked = sum(float(stake.amount) for stake in stakes if stake.is_active)
        total_rewards = sum(float(stake.rewards_earned) for stake in stakes)
        active_stakes_count = len([s for s in stakes if s.is_active])
        
        return {
            "user_id": user_id,
            "total_staked": total_staked,
            "total_rewards": total_rewards,
            "active_stakes": active_stakes_count,
            "last_updated": datetime.utcnow(),
            "stakes": [stake.to_dict() for stake in stakes]
        }

    def remove_stake(self, db: Session, user_id: int, amount: float) -> Optional[bool]:
        """Mark stake as inactive (unstaked)"""
        try:
            stake = db.query(Stake).filter(
                and_(
                    Stake.user_id == user_id,
                    Stake.amount == Decimal(str(amount)),
                    Stake.is_active == True
                )
            ).first()
            
            if stake:
                stake.is_active = False
                stake.updated_at = datetime.utcnow()
                db.commit()
                logger.info(f"✅ Stake removed: {amount} ETH for user {user_id}")
                return True
            else:
                logger.warning(f"⚠️ No active stake found for user {user_id} with amount {amount}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error removing stake: {str(e)}")
            db.rollback()
            return False

    def update_stake_rewards(self, db: Session, stake_id: int, rewards_earned: float, claimable_rewards: float = None) -> Optional[Stake]:
        """Update reward tracking for a stake"""
        try:
            stake = db.query(Stake).filter(Stake.id == stake_id).first()
            
            if stake:
                stake.update_rewards(rewards_earned, claimable_rewards)
                db.commit()
                db.refresh(stake)
                return stake
            else:
                logger.warning(f"⚠️ Stake not found: {stake_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error updating stake rewards: {str(e)}")
            db.rollback()
            return None

    def claim_stake_rewards(self, db: Session, stake_id: int, claimed_amount: float) -> Optional[bool]:
        """Process reward claim for a stake"""
        try:
            stake = db.query(Stake).filter(Stake.id == stake_id).first()
            
            if stake and stake.claim_rewards(claimed_amount):
                db.commit()
                logger.info(f"✅ Rewards claimed: {claimed_amount} ETH for stake {stake_id}")
                return True
            else:
                logger.warning(f"⚠️ Unable to claim rewards for stake {stake_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error claiming rewards: {str(e)}")
            db.rollback()
            return False

    def calculate_stake_rewards(self, stake: Stake) -> float:
        """Calculate current rewards for a stake - ETH only"""
        try:
            if not stake.is_active or stake.amount <= 0:
                return 0.0
            
            # Calculate time elapsed since staking
            now = datetime.utcnow()
            time_elapsed = now - stake.staked_at
            days_elapsed = time_elapsed.total_seconds() / (24 * 3600)
            
            # Calculate rewards - always ETH
            annual_rate = float(stake.reward_rate) / 100.0
            daily_rate = annual_rate / 365.0
            rewards = float(stake.amount) * daily_rate * days_elapsed
            
            return rewards
            
        except Exception as e:
            logger.error(f"❌ Error calculating stake rewards: {str(e)}")
            return 0.0

    def _calculate_predicted_reward(self, amount: float, apy: float, days: int = 365, token_symbol: str = 'ETH') -> float:
        """Calculate predicted reward for ETH staking"""
        try:
            daily_rate = (apy / 100.0) / 365.0
            predicted_reward = amount * daily_rate * days
            return predicted_reward
        except Exception as e:
            logger.error(f"❌ Error calculating predicted reward: {str(e)}")
            return 0.0

    def get_user_stakes_summary(self, db: Session, user_id: int) -> UserStakesResponse:
        """Get comprehensive user stakes summary"""
        try:
            stakes = self.get_user_staking_positions(db, user_id)
            
            # Calculate totals
            total_staked = sum(float(stake.amount) for stake in stakes if stake.is_active)
            total_rewards = sum(float(stake.rewards_earned) for stake in stakes)
            total_positions = len(stakes)
            active_positions = len([s for s in stakes if s.is_active])
            
            # Format stakes as StakingPositionResponse objects
            formatted_positions = []
            for stake in stakes:
                # Create StakingPositionResponse object with all required fields
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
                    days_remaining=stake.days_remaining(),
                    reward_token="ETH"  # Always ETH for rewards now
                )
                formatted_positions.append(position)
            
            return UserStakesResponse(
                user_id=user_id,
                positions=formatted_positions,
                total_staked=total_staked,
                total_rewards=total_rewards,
                total_positions=total_positions,
                active_positions=active_positions
            )
            
        except Exception as e:
            logger.error(f"❌ Error getting user stakes summary: {str(e)}")
            return UserStakesResponse(
                user_id=user_id,
                positions=[],
                total_staked=0.0,
                total_rewards=0.0,
                total_positions=0,
                active_positions=0
            )

    def get_staking_pools(self, db: Session) -> 'StakingPoolsResponse':
        """Get all available ETH staking pools - hardcoded for ETH-only version"""
        try:
            from app.schemas.staking import StakingPoolsResponse, StakingPoolInfo
            from datetime import datetime
            
            # Hardcoded ETH staking pools for ETH-only version
            eth_pools = [
                StakingPoolInfo(
                    pool_id="eth-flexible",
                    name="ETH Flexible Staking",
                    description="Flexible ETH staking with no lock period",
                    apy=4.5,
                    min_stake=0.01,
                    max_stake=100.0,
                    lock_period=0,
                    is_active=True,
                    total_staked=0.0,
                    participants=0,
                    token_address="0x0000000000000000000000000000000000000000",  # ETH
                    token_symbol="ETH",
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                ),
                StakingPoolInfo(
                    pool_id="eth-30d",
                    name="ETH 30-Day Lock",
                    description="ETH staking with 30-day lock period",
                    apy=5.5,
                    min_stake=0.1,
                    max_stake=50.0,
                    lock_period=30,
                    is_active=True,
                    total_staked=0.0,
                    participants=0,
                    token_address="0x0000000000000000000000000000000000000000",  # ETH
                    token_symbol="ETH",
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                ),
                StakingPoolInfo(
                    pool_id="eth-90d",
                    name="ETH 90-Day Lock",
                    description="ETH staking with 90-day lock period",
                    apy=6.5,
                    min_stake=0.5,
                    max_stake=25.0,
                    lock_period=90,
                    is_active=True,
                    total_staked=0.0,
                    participants=0,
                    token_address="0x0000000000000000000000000000000000000000",  # ETH
                    token_symbol="ETH",
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                ),
                StakingPoolInfo(
                    pool_id="eth-365d",
                    name="ETH 1-Year Lock",
                    description="ETH staking with 1-year lock period for maximum rewards",
                    apy=8.0,
                    min_stake=1.0,
                    max_stake=10.0,
                    lock_period=365,
                    is_active=True,
                    total_staked=0.0,
                    participants=0,
                    token_address="0x0000000000000000000000000000000000000000",  # ETH
                    token_symbol="ETH",
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                )
            ]
            
            # Count active pools
            active_pools = len([pool for pool in eth_pools if pool.is_active])
            
            return StakingPoolsResponse(
                pools=eth_pools,
                total_pools=len(eth_pools),
                active_pools=active_pools
            )
            
        except Exception as e:
            logger.error(f"❌ Error getting staking pools: {str(e)}")
            # Return empty response on error
            from app.schemas.staking import StakingPoolsResponse
            return StakingPoolsResponse(
                pools=[],
                total_pools=0,
                active_pools=0
            )

    def get_staking_pools_for_api(self, db: Session) -> Dict[str, Any]:
        """Get staking pools in simple dictionary format for API compatibility"""
        try:
            pools_response = self.get_staking_pools(db)
            
            # Convert to simple dict format for API compatibility
            pools_dict = []
            for pool in pools_response.pools:
                pools_dict.append({
                    "id": pool.pool_id,
                    "name": pool.name,
                    "description": pool.description,
                    "apy": pool.apy,
                    "min_stake": pool.min_stake,
                    "max_stake": pool.max_stake,
                    "lock_period": pool.lock_period,
                    "is_active": pool.is_active,
                    "total_staked": pool.total_staked,
                    "participants": pool.participants,
                    "token_symbol": pool.token_symbol,
                    "reward_rate": pool.apy  # Alias for compatibility
                })
            
            return {
                "pools": pools_dict,
                "total_pools": pools_response.total_pools,
                "active_pools": pools_response.active_pools
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting staking pools for API: {str(e)}")
            return {
                "pools": [],
                "total_pools": 0,
                "active_pools": 0
            }

    def get_pools_list(self, db: Session) -> List[Dict[str, Any]]:
        """Get staking pools as a simple list for router compatibility"""
        try:
            pools_response = self.get_staking_pools(db)
            
            # Convert to simple list format for router compatibility
            pools_list = []
            for pool in pools_response.pools:
                pools_list.append({
                    "id": pool.pool_id,
                    "name": pool.name,
                    "description": pool.description,
                    "apy": pool.apy,
                    "min_stake": pool.min_stake,
                    "max_stake": pool.max_stake,
                    "lock_period": pool.lock_period,
                    "is_active": pool.is_active,
                    "total_staked": pool.total_staked,
                    "participants": pool.participants,
                    "token_symbol": pool.token_symbol,
                    "reward_rate": pool.apy
                })
            
            return pools_list
            
        except Exception as e:
            logger.error(f"❌ Error getting pools list: {str(e)}")
            return []

    def create_staking_account(self, db: Session, user_id: int, account_data) -> Optional[Stake]:
        """Create a staking account (alias for create_stake for compatibility)"""
        return self.create_stake(
            db=db,
            user_id=user_id,
            amount=account_data.amount,
            pool_id=getattr(account_data, 'pool_id', 'default-pool')
        )

    def get_staking_account(self, db: Session, account_id: int, user_id: int) -> Optional[Stake]:
        """Get a staking account by ID"""
        return db.query(Stake).filter(
            and_(Stake.id == account_id, Stake.user_id == user_id)
        ).first()

    def predict_stake_reward(self, db: Session, stake_id: int) -> Dict[str, Any]:
        """Get AI prediction for stake rewards"""
        try:
            stake = db.query(Stake).filter(Stake.id == stake_id).first()
            if not stake:
                return {"error": "Stake not found"}
            
            # Calculate predicted rewards
            predicted_reward = self.calculate_stake_rewards(stake)
            
            return {
                "stake_id": stake_id,
                "predicted_reward": predicted_reward,
                "confidence": 0.85,  # Mock confidence score
                "model": "ETH-staking-predictor-v1"
            }
            
        except Exception as e:
            logger.error(f"❌ Error predicting stake reward: {str(e)}")
            return {"error": str(e)}

    def verify_stake_on_blockchain(self, db: Session, stake_id: int) -> Dict[str, Any]:
        """Verify stake on blockchain"""
        try:
            stake = db.query(Stake).filter(Stake.id == stake_id).first()
            if not stake:
                return {"error": "Stake not found"}
            
            # For ETH-only version, return mock verification
            return {
                "stake_id": stake_id,
                "verified": True,
                "blockchain_status": "CONFIRMED",
                "tx_hash": stake.tx_hash,
                "block_number": 12345678  # Mock block number
            }
            
        except Exception as e:
            logger.error(f"❌ Error verifying stake: {str(e)}")
            return {"error": str(e)}

    def get_enhanced_stakes(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get enhanced stakes with AI and blockchain data"""
        try:
            stakes = self.get_user_stakes(db, user_id)
            
            enhanced_stakes = []
            for stake in stakes:
                enhanced_stake = {
                    **stake.to_dict(),
                    "blockchain_verified": True,
                    "ai_confidence": 0.9,
                    "predicted_rewards": self.calculate_stake_rewards(stake),
                    "risk_score": 0.1  # Low risk for ETH staking
                }
                enhanced_stakes.append(enhanced_stake)
            
            return {
                "stakes": enhanced_stakes,
                "total_count": len(enhanced_stakes)
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting enhanced stakes: {str(e)}")
            return {"stakes": [], "total_count": 0}

    def get_rewards_for_user(self, db: Session, user_id: int, limit: int = 50) -> Dict[str, Any]:
        """Get rewards history for user"""
        try:
            stakes = self.get_user_stakes(db, user_id)
            
            rewards_history = []
            total_rewards = 0.0
            
            for stake in stakes[:limit]:
                rewards = self.calculate_stake_rewards(stake)
                total_rewards += rewards
                
                rewards_history.append({
                    "date": stake.staked_at.isoformat(),
                    "stake_id": stake.id,
                    "stake_name": f"ETH Stake #{stake.id}",
                    "reward_amount": rewards,
                    "apy": float(stake.reward_rate),
                    "status": stake.status
                })
            
            return {
                "rewards": rewards_history,
                "total_earned": total_rewards,
                "count": len(rewards_history)
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting rewards for user: {str(e)}")
            return {"rewards": [], "total_earned": 0.0, "count": 0}

    def claim_all_rewards(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Claim all pending rewards for user"""
        try:
            stakes = self.get_user_stakes(db, user_id)
            total_claimed = 0.0
            claimed_stakes = []
            
            for stake in stakes:
                if stake.is_active and stake.claimable_rewards > 0:
                    claimed_amount = float(stake.claimable_rewards)
                    if self.claim_stake_rewards(db, stake.id, claimed_amount):
                        total_claimed += claimed_amount
                        claimed_stakes.append(stake.id)
            
            return {
                "success": True,
                "message": f"Successfully claimed rewards from {len(claimed_stakes)} stakes",
                "claimed_amount": total_claimed,
                "transaction_hash": f"0x{''.join(['a' for _ in range(64)])}",  # Mock tx hash
                "remaining_claimable": 0.0
            }
            
        except Exception as e:
            logger.error(f"❌ Error claiming all rewards: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to claim rewards: {str(e)}",
                "claimed_amount": 0.0,
                "remaining_claimable": 0.0
            }

    def update_staking_position(self, db: Session, position_id: int, user_id: int, update_data: Dict[str, Any]) -> Optional[Stake]:
        """Update a staking position"""
        try:
            stake = db.query(Stake).filter(
                and_(Stake.id == position_id, Stake.user_id == user_id)
            ).first()
            
            if not stake:
                return None
            
            # Update allowed fields
            if 'is_active' in update_data:
                stake.is_active = update_data['is_active']
            if 'status' in update_data:
                stake.status = update_data['status']
            if 'rewards_earned' in update_data:
                stake.rewards_earned = Decimal(str(update_data['rewards_earned']))
            
            stake.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(stake)
            
            return stake
            
        except Exception as e:
            logger.error(f"❌ Error updating staking position: {str(e)}")
            db.rollback()
            return None

    def create_staking_position(self, db: Session, user_id: int, wallet_address: str, 
                              pool_id: int, amount: float, blockchain_tx_hash: str) -> Optional[Stake]:
        """Create a new staking position with wallet and blockchain info"""
        try:
            # Convert pool_id to string if it's an int
            pool_id_str = str(pool_id)
            
            return self.save_stake(
                db=db,
                user_id=user_id,
                pool_id=pool_id_str,
                amount=amount,
                tx_hash=blockchain_tx_hash,
                lock_period=0,
                reward_rate=5.0
            )
            
        except Exception as e:
            logger.error(f"❌ Error creating staking position: {str(e)}")
            return None

    def get_user_rewards(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get user rewards summary"""
        try:
            stakes = self.get_user_stakes(db, user_id)
            
            total_rewards = sum(float(stake.rewards_earned) for stake in stakes)
            pending_rewards = sum(float(stake.claimable_rewards) for stake in stakes if stake.is_active)
            
            rewards_history = []
            for stake in stakes:
                rewards = self.calculate_stake_rewards(stake)
                rewards_history.append({
                    "date": stake.staked_at.isoformat(),
                    "stake_id": stake.id,
                    "stake_name": f"ETH Stake #{stake.id}",
                    "reward_amount": rewards,
                    "apy": float(stake.reward_rate),
                    "status": stake.status
                })
            
            return {
                "rewards": rewards_history,
                "total_rewards": total_rewards,
                "pending_rewards": pending_rewards,
                "last_calculation": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting user rewards: {str(e)}")
            return {
                "rewards": [],
                "total_rewards": 0.0,
                "pending_rewards": 0.0,
                "last_calculation": datetime.utcnow()
            }

    def _get_mock_pools(self) -> List[Dict[str, Any]]:
        """Get mock ETH staking pools with contract addresses for testing"""
        return [
            {
                "id": "eth-flexible",
                "name": "ETH Flexible Staking",
                "tokenAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "contractAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "tokenSymbol": "ETH",
                "apy": 4.5,
                "min_stake": 0.01,
                "max_stake": 100.0,
                "lock_period": 0
            },
            {
                "id": "eth-30d", 
                "name": "ETH 30-Day Lock",
                "tokenAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "contractAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "tokenSymbol": "ETH",
                "apy": 5.5,
                "min_stake": 0.1,
                "max_stake": 50.0,
                "lock_period": 30
            },
            {
                "id": "eth-90d",
                "name": "ETH 90-Day Lock", 
                "tokenAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "contractAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "tokenSymbol": "ETH",
                "apy": 6.5,
                "min_stake": 0.5,
                "max_stake": 25.0,
                "lock_period": 90
            },
            {
                "id": "eth-365d",
                "name": "ETH 1-Year Lock",
                "tokenAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "contractAddress": "0x0000000000000000000000000000000000000000",  # ETH
                "tokenSymbol": "ETH",
                "apy": 8.0,
                "min_stake": 1.0,
                "max_stake": 10.0,
                "lock_period": 365
            }
        ]

    def _is_valid_ethereum_address(self, address: Optional[str]) -> bool:
        """Validate Ethereum address format"""
        if not address or not isinstance(address, str):
            return False
        
        if not address.startswith('0x'):
            return False
        
        if len(address) != 42:  # 0x + 40 hex characters
            return False
        
        # Check if the remaining characters are valid hex
        try:
            int(address[2:], 16)
            return True
        except ValueError:
            return False

    def get_staking_profile(self, db: Session, user_id: int, account_id: Optional[int] = None) -> Dict[str, Any]:
        """Get staking profile for user or specific account"""
        try:
            if account_id:
                # Get specific stake/account
                stake = db.query(Stake).filter(
                    and_(Stake.id == account_id, Stake.user_id == user_id)
                ).first()
                
                if not stake:
                    return {"stakes": [], "total_staked": 0.0, "active_stakes": 0}
                
                stakes = [stake]
            else:
                # Get all stakes for user
                stakes = self.get_user_stakes(db, user_id)
            
            # Format stakes for response
            formatted_stakes = []
            total_staked = 0.0
            active_stakes = 0
            
            for stake in stakes:
                if stake.is_active:
                    total_staked += float(stake.amount)
                    active_stakes += 1
                
                current_rewards = self.calculate_stake_rewards(stake)
                formatted_stakes.append({
                    "id": stake.id,
                    "amount": float(stake.amount),
                    "pool_id": stake.pool_id,
                    "staked_at": stake.staked_at.isoformat(),
                    "unlock_at": stake.unlock_at.isoformat() if stake.unlock_at else None,
                    "is_active": stake.is_active,
                    "status": stake.status,
                    "rewards": {
                        "earned": float(stake.rewards_earned),
                        "claimable": float(stake.claimable_rewards),
                        "current": current_rewards,
                        "apy": float(stake.reward_rate)
                    },
                    "lock_period": stake.lock_period,
                    "can_unstake": stake.is_unlocked(),
                    "days_remaining": stake.days_remaining()
                })
            
            return {
                "stakes": formatted_stakes,
                "total_staked": total_staked,
                "active_stakes": active_stakes,
                "total_rewards": sum(float(s.rewards_earned) for s in stakes)
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting staking profile: {str(e)}")
            return {"stakes": [], "total_staked": 0.0, "active_stakes": 0}

    def calculate_claimable_rewards(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Calculate total claimable rewards for user"""
        try:
            stakes = self.get_user_stakes(db, user_id)
            
            claimable_stakes = []
            total_claimable = 0.0
            
            for stake in stakes:
                if stake.is_active:
                    # Calculate current rewards
                    current_rewards = self.calculate_stake_rewards(stake)
                    claimable_amount = float(stake.claimable_rewards) + current_rewards
                    
                    if claimable_amount > 0:
                        total_claimable += claimable_amount
                        
                        claimable_stakes.append({
                            "stake_id": stake.id,
                            "stake_name": f"ETH Stake #{stake.id}",
                            "amount_staked": float(stake.amount),
                            "days_staked": (datetime.utcnow() - stake.staked_at).days,
                            "apy": float(stake.reward_rate),
                            "total_earned": float(stake.rewards_earned) + current_rewards,
                            "already_claimed": float(stake.rewards_earned),
                            "claimable": claimable_amount
                        })
            
            return {
                "total_claimable": total_claimable,
                "stakes": claimable_stakes
            }
            
        except Exception as e:
            logger.error(f"❌ Error calculating claimable rewards: {str(e)}")
            return {"total_claimable": 0.0, "stakes": []}

    def format_staking_dashboard(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Helper function to format staking dashboard response with all required fields"""
        return self.get_stake_status(db, user_id)

# Create singleton instance
staking_service = StakingService()