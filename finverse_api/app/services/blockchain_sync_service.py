"""
Blockchain Sync Service for FinVerse API
Handles synchronization between smart contract and database
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
import json

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from web3 import Web3
from web3.exceptions import ContractLogicError, Web3Exception

from app.db.session import SessionLocal
from app.models.stake import Stake
from app.models.user import User
from app.services.staking_service import staking_service  # Fix: use correct import
from app.core.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BlockchainSyncService:
    """Service to sync staking data between blockchain and database"""
    
    def __init__(self):
        self.web3 = None
        self.token_contract = None
        self.vault_contract = None
        self.is_initialized = False
        self.sync_running = False
        self.last_sync_block = 0
        
        # Contract addresses from environment or fallback
        self.token_address = getattr(settings, 'TOKEN_ADDRESS', '0x5FbDB2315678afecb367f032d93F642f64180aa3')
        self.vault_address = getattr(settings, 'STAKE_VAULT_ADDRESS', '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512')
        self.rpc_url = getattr(settings, 'WEB3_RPC_URL', 'http://127.0.0.1:8545')
        
        # Contract ABIs
        self.token_abi = [
            "function balanceOf(address) view returns (uint256)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)"
        ]
        
        self.vault_abi = [
            "function getUserStakeCount(address) view returns (uint256)",
            "function getUserStake(address, uint256) view returns (tuple(uint256,uint256,bool))",
            "function getUserStakeIds(address) view returns (uint256[])",
            "function getUserStakesDetails(address, uint256[]) view returns (uint256[],uint256[],bool[],uint256[],bool[])",
            "function totalStakedAmount() view returns (uint256)",
            "function totalStaked(address) view returns (uint256)",
            "function APY_PERCENTAGE() view returns (uint256)",
            "function LOCK_PERIOD() view returns (uint256)",
            "event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 stakeIndex)",
            "event Claimed(address indexed user, uint256 reward, uint256 stakeIndex)",
            "event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 stakeIndex)"
        ]
    
    async def initialize(self) -> bool:
        """Initialize Web3 connection and contracts"""
        try:
            logger.info("🔗 Initializing blockchain sync service...")
            
            # Initialize Web3
            self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
            
            if not self.web3.is_connected():
                logger.error("❌ Failed to connect to Web3 provider")
                return False
            
            logger.info(f"✅ Connected to Web3 at {self.rpc_url}")
            
            # Initialize contracts
            self.token_contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(self.token_address),
                abi=self.token_abi
            )
            
            self.vault_contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(self.vault_address),
                abi=self.vault_abi
            )
            
            # Verify contracts are working
            total_staked = await self._safe_contract_call(
                self.vault_contract.functions.totalStakedAmount().call
            )
            
            if total_staked is not None:
                logger.info(f"✅ Contracts initialized. Total staked: {self.web3.from_wei(total_staked, 'ether')} tokens")
                self.is_initialized = True
                return True
            else:
                logger.error("❌ Failed to verify contract initialization")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize blockchain sync: {str(e)}")
            return False
    
    async def _safe_contract_call(self, call_func, *args, **kwargs):
        """Safely execute contract call with error handling"""
        try:
            if asyncio.iscoroutinefunction(call_func):
                return await call_func(*args, **kwargs)
            else:
                return call_func(*args, **kwargs)
        except (ContractLogicError, Web3Exception) as e:
            logger.warning(f"Contract call failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in contract call: {str(e)}")
            return None
    
    async def fetch_user_stakes_from_contract(self, user_address: str) -> List[Dict[str, Any]]:
        """Fetch all stakes for a user from the smart contract"""
        if not self.is_initialized:
            logger.warning("Sync service not initialized")
            return []
        
        try:
            user_address = Web3.to_checksum_address(user_address)
            
            # Get stake count
            stake_count = await self._safe_contract_call(
                self.vault_contract.functions.getUserStakeCount(user_address).call
            )
            
            if stake_count is None or stake_count == 0:
                return []
            
            # Get stake IDs
            stake_ids = await self._safe_contract_call(
                self.vault_contract.functions.getUserStakeIds(user_address).call
            )
            
            if not stake_ids:
                return []
            
            # Get detailed stake information
            stake_details = await self._safe_contract_call(
                self.vault_contract.functions.getUserStakesDetails(user_address, stake_ids).call
            )
            
            if not stake_details:
                return []
            
            amounts, timestamps, claimed, rewards, can_unstake = stake_details
            
            # Get contract constants
            apy = await self._safe_contract_call(
                self.vault_contract.functions.APY_PERCENTAGE().call
            ) or 10
            
            lock_period = await self._safe_contract_call(
                self.vault_contract.functions.LOCK_PERIOD().call
            ) or (30 * 24 * 60 * 60)
            
            # Process stakes
            stakes = []
            for i in range(len(stake_ids)):
                if amounts[i] > 0:  # Only active stakes
                    stake_data = {
                        'stake_index': stake_ids[i],
                        'user_address': user_address,
                        'amount': self.web3.from_wei(amounts[i], 'ether'),
                        'timestamp': timestamps[i],
                        'staked_at': datetime.fromtimestamp(timestamps[i]),
                        'claimed': claimed[i],
                        'reward': self.web3.from_wei(rewards[i], 'ether'),
                        'can_unstake': can_unstake[i],
                        'apy': apy,
                        'lock_period_seconds': lock_period,
                        'lock_period_days': lock_period // (24 * 60 * 60),
                        'is_active': not claimed[i] and amounts[i] > 0
                    }
                    stakes.append(stake_data)
            
            return stakes
            
        except Exception as e:
            logger.error(f"Error fetching user stakes from contract: {str(e)}")
            return []
    
    async def sync_user_stakes(self, user_address: str, db: Session) -> Dict[str, Any]:
        """Sync stakes for a specific user"""
        try:
            # Fetch stakes from contract
            contract_stakes = await self.fetch_user_stakes_from_contract(user_address)
            
            # Find user in database
            user = db.query(User).filter(
                or_(
                    User.email == user_address,
                    User.wallet_address == user_address
                )
            ).first()
            
            if not user:
                logger.warning(f"User not found for address: {user_address}")
                return {"error": "User not found", "synced": 0, "created": 0, "updated": 0}
            
            synced_count = 0
            created_count = 0
            updated_count = 0
            
            # Process each stake from contract
            for stake_data in contract_stakes:
                stake_index = stake_data['stake_index']
                
                # Check if we already have this stake in database
                existing_stake = db.query(Stake).filter(
                    and_(
                        Stake.user_id == user.id,
                        Stake.pool_id.like(f"%stake_{stake_index}%")
                    )
                ).first()
                
                if not existing_stake:
                    # Create new stake record using unified service
                    new_stake = staking_service.save_stake(
                        db=db,
                        user_id=user.id,
                        pool_id=f"contract_stake_{stake_index}",
                        amount=stake_data['amount'],
                        tx_hash=None,  # Contract doesn't store tx hash
                        lock_period=stake_data['lock_period_days'],
                        reward_rate=stake_data['apy']
                    )
                    
                    if new_stake:
                        # Update additional fields
                        new_stake.status = "ACTIVE" if stake_data['is_active'] else "COMPLETED"
                        new_stake.rewards_earned = Decimal(str(stake_data['reward']))
                        new_stake.claimable_rewards = Decimal(str(stake_data['reward'])) if stake_data['is_active'] else Decimal('0')
                        new_stake.ai_tag = "contract_synced"
                        
                        created_count += 1
                        logger.info(f"📝 Created new stake record for user {user.id}, stake {stake_index}")
                    
                else:
                    # Update existing stake
                    existing_stake.amount = Decimal(str(stake_data['amount']))
                    existing_stake.rewards_earned = Decimal(str(stake_data['reward']))
                    existing_stake.claimable_rewards = Decimal(str(stake_data['reward'])) if stake_data['is_active'] else Decimal('0')
                    existing_stake.is_active = stake_data['is_active']
                    existing_stake.status = "ACTIVE" if stake_data['is_active'] else "COMPLETED"
                    existing_stake.updated_at = datetime.utcnow()
                    
                    updated_count += 1
                    logger.info(f"🔄 Updated stake record for user {user.id}, stake {stake_index}")
                
                synced_count += 1
            
            # Check for stakes in DB that are no longer on contract (mark as unstaked)
            db_stakes = db.query(Stake).filter(
                and_(
                    Stake.user_id == user.id,
                    Stake.is_active == True,
                    Stake.ai_tag == "contract_synced"
                )
            ).all()
            
            contract_stake_indexes = [s['stake_index'] for s in contract_stakes]
            
            for db_stake in db_stakes:
                # Extract stake index from pool_id
                if "stake_" in db_stake.pool_id:
                    try:
                        stake_index = int(db_stake.pool_id.split("stake_")[1])
                        if stake_index not in contract_stake_indexes:
                            # This stake is no longer on contract, mark as completed
                            db_stake.is_active = False
                            db_stake.status = "COMPLETED"
                            db_stake.updated_at = datetime.utcnow()
                            updated_count += 1
                            logger.info(f"🔚 Marked stake {stake_index} as completed (not found on contract)")
                    except (ValueError, IndexError):
                        continue
            
            db.commit()
            
            return {
                "success": True,
                "user_address": user_address,
                "synced": synced_count,
                "created": created_count,
                "updated": updated_count,
                "contract_stakes": len(contract_stakes)
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing user stakes: {str(e)}")
            return {"error": str(e), "synced": 0, "created": 0, "updated": 0}
    
    async def sync_all_users(self, db: Session) -> Dict[str, Any]:
        """Sync stakes for all users with wallet addresses"""
        try:
            # Get all users with wallet addresses or email addresses that look like addresses
            users = db.query(User).filter(
                or_(
                    User.wallet_address.isnot(None),
                    User.email.like('0x%')
                )
            ).all()
            
            total_synced = 0
            total_created = 0
            total_updated = 0
            errors = []
            
            for user in users:
                user_address = user.wallet_address or user.email
                if user_address and user_address.startswith('0x'):
                    try:
                        result = await self.sync_user_stakes(user_address, db)
                        if result.get('success'):
                            total_synced += result.get('synced', 0)
                            total_created += result.get('created', 0)
                            total_updated += result.get('updated', 0)
                        else:
                            errors.append(f"User {user_address}: {result.get('error', 'Unknown error')}")
                    except Exception as e:
                        errors.append(f"User {user_address}: {str(e)}")
                        continue
            
            return {
                "success": True,
                "total_users": len(users),
                "total_synced": total_synced,
                "total_created": total_created,
                "total_updated": total_updated,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Error in sync_all_users: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def run_sync_cycle(self) -> Dict[str, Any]:
        """Run a complete sync cycle"""
        if not self.is_initialized:
            if not await self.initialize():
                return {"success": False, "error": "Failed to initialize"}
        
        logger.info("🔄 Starting blockchain sync cycle...")
        start_time = datetime.utcnow()
        
        db = SessionLocal()
        try:
            result = await self.sync_all_users(db)
            
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"✅ Sync cycle completed in {duration:.2f}s: "
                       f"Created: {result.get('total_created', 0)}, "
                       f"Updated: {result.get('total_updated', 0)}, "
                       f"Errors: {len(result.get('errors', []))}")
            
            return {
                **result,
                "duration_seconds": duration,
                "timestamp": end_time.isoformat()
            }
            
        finally:
            db.close()
    
    async def start_continuous_sync(self, interval_seconds: int = 10):
        """Start continuous synchronization every N seconds"""
        logger.info(f"🚀 Starting continuous blockchain sync every {interval_seconds} seconds...")
        self.sync_running = True
        
        while self.sync_running:
            try:
                await self.run_sync_cycle()
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                logger.error(f"Error in continuous sync: {str(e)}")
                await asyncio.sleep(interval_seconds)  # Continue even if there's an error
    
    def stop_continuous_sync(self):
        """Stop continuous synchronization"""
        logger.info("🛑 Stopping continuous blockchain sync...")
        self.sync_running = False

# Create singleton instance
blockchain_sync_service = BlockchainSyncService()
