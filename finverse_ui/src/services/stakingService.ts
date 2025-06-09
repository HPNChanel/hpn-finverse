import api from '@/lib/api';
import { StakingPool, StakePool, StakePosition, StakedEventData } from '@/types/contracts';
import { BrowserProvider, Contract, EventLog } from 'ethers';
import { STAKE_VAULT_ABI, formatTokenAmount } from '@/lib/contracts';
import { getStakeVaultAddress } from '@/utils/contractLoader';

// Re-export types for backward compatibility
export type { StakingPool, StakePool, StakePosition };

// Types for unified staking model
export interface StakeProfile {
  id: number;
  poolId: string;
  amount: number;
  stakedAt: Date;
  rewardRate: number;
  rewardsEarned: number;
  claimableRewards: number;
  isActive: boolean;
  isUnlocked: boolean;
  daysRemaining: number;
  status: string;
  unstakedAt?: Date;
  unstakeTxHash?: string;
  stake: {
    id: number;
    name: string;
    amount: number;
    balance: number;
    created_at: string;
    blockchain_tx_hash?: string;
    is_active: boolean;
    predicted_reward?: number;
    model_confidence?: number;
    apy_snapshot?: number;
    claimable_rewards?: number;
    linked_account?: any;
  };
  rewards: {
    earned: number;
    apy: number;
    duration_days: number;
  };
}

export interface RewardHistory {
  id: number;
  amount: number;
  claimedAt: Date;
  poolId: string;
}

// Service class for staking operations
class StakingService {
  private provider: BrowserProvider | null = null;
  private contract: Contract | null = null;
  private eventListeners: Array<() => void> = [];
  private isInitialized = false;
  private initialized = false;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      this.provider = new BrowserProvider(window.ethereum);
      const vaultAddress = await getStakeVaultAddress();
      
      this.contract = new Contract(vaultAddress, STAKE_VAULT_ABI, this.provider);
      this.isInitialized = true;
      
      console.log('✅ StakingService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize StakingService:', error);
      throw error;
    }
  }

  async startListeningToStakedEvents(callback: (eventData: StakedEventData) => void): Promise<void> {
    if (!this.contract) {
      throw new Error('Service not initialized');
    }

    const handleStakedEvent = async (...args: any[]) => {
      try {
        const [user, amount, timestamp, stakeIndex, poolId, tokenAddress, event] = args;
        
        const eventData: StakedEventData = {
          user,
          amount: formatTokenAmount(amount),
          timestamp: Number(timestamp),
          stakeIndex: Number(stakeIndex),
          poolId: Number(poolId),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        };

        callback(eventData);
      } catch (error) {
        console.error('Error processing Staked event:', error);
      }
    };

    this.contract.on('Staked', handleStakedEvent);
    this.eventListeners.push(() => this.contract?.off('Staked', handleStakedEvent));
    
    console.log('🎧 Started listening to Staked events');
  }

  async getPastStakedEvents(userAddress: string, blocksBack: number = 1000): Promise<StakedEventData[]> {
    if (!this.contract || !this.provider) {
      throw new Error('Service not initialized');
    }

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock + blocksBack); // blocksBack is negative

      const filter = this.contract.filters.Staked(userAddress);
      const events = await this.contract.queryFilter(filter, fromBlock);

      return events.map((event: EventLog) => ({
        user: event.args[0],
        amount: formatTokenAmount(event.args[1]),
        timestamp: Number(event.args[2]),
        stakeIndex: Number(event.args[3]),
        poolId: Number(event.args[4]),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      }));
    } catch (error) {
      console.error('Failed to fetch past staked events:', error);
      throw new Error(`Failed to fetch staking events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  stopListeningToEvents(): void {
    this.eventListeners.forEach(removeListener => removeListener());
    this.eventListeners = [];
    console.log('🔇 Stopped listening to staking events');
  }

  cleanup(): void {
    this.stopListeningToEvents();
    this.provider = null;
    this.contract = null;
    this.isInitialized = false;
  }

  async getSupportedTokens() {
    try {
      const response = await api.get('/staking/supported-tokens');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch supported tokens:', error);
      return {
        tokens: [
          {
            symbol: 'FVT',
            name: 'FinVerse Token',
            address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            decimals: 18,
            isSupported: true,
            isNative: false,
            icon: '/icons/fvt.png'
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            isSupported: true,
            isNative: true,
            icon: '/icons/eth.png'
          }
        ]
      };
    }
  }

  async validateTokenForStaking(tokenAddress: string, amount: number) {
    try {
      const response = await api.post('/staking/validate-token', {
        token_address: tokenAddress,
        amount: amount
      });
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error(error.response?.data?.detail || 'Token validation failed');
    }
  }

  async recordStake(stakeData: {
    poolId: string;
    amount: number;
    txHash: string;
    lockPeriod: number;
    walletAddress: string;
    tokenAddress?: string; // Add token address support
  }) {
    try {
      const response = await api.post('/staking/record', stakeData);
      return response.data;
    } catch (error) {
      console.error('Failed to record stake:', error);
      throw new Error(error.response?.data?.detail || 'Failed to record stake to database');
    }
  }

  async getUserStakes(activeOnly: boolean = false) {
    const response = await api.get(`/staking/user-stakes?active_only=${activeOnly}`);
    return response.data;
  }

  async getStakingPools() {
    try {
      const response = await api.get('/staking/pools');
      return response.data;
    } catch (error) {
      console.warn('Using fallback pools data');
      return {
        pools: [
          {
            id: 1,
            name: "Default Pool",
            description: "Standard staking pool",
            apy: 10.0,
            min_stake: 0.01,
            max_stake: 10000.0,
            lock_period: 30,
            is_active: true,
            total_staked: 50000.0,
            participants: 25,
            tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',  // Add required contract address
            contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',  // Duplicate for compatibility
            token_symbol: 'FVT'
          }
        ]
      };
    }
  }

  async getStakingRewards() {
    try {
      const response = await api.get('/staking/rewards');
      return response.data;
    } catch (error) {
      console.warn('Using fallback rewards data');
      return { rewards: [] };
    }
  }

  async stakeTokens(poolId: string, amount: number, lockPeriod?: number, tokenAddress?: string) {
    // Validate token before staking
    if (tokenAddress) {
      await this.validateTokenForStaking(tokenAddress, amount);
    }

    const response = await api.post('/staking/stake', { 
      poolId, 
      amount, 
      lockPeriod: lockPeriod || 0,
      tokenAddress: tokenAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Default to FVT
    });
    return response.data;
  }

  async claimRewards(stakeId: string): Promise<void> {
    // Implementation would interact with smart contract
    console.log(`Claiming rewards for stake ${stakeId}`);
    throw new Error('Not implemented - would interact with smart contract');
  }

  async unstakeTokens(stakeId: string, amount: number): Promise<void> {
    // Implementation would interact with smart contract
    console.log(`Unstaking ${amount} tokens from stake ${stakeId}`);
    throw new Error('Not implemented - would interact with smart contract');
  }

  async updateStakingPosition(positionId: number, updateData: any) {
    const response = await api.put(`/staking/positions/${positionId}`, updateData);
    return response.data;
  }

  // Add method to refresh user stakes after transaction
  async refreshUserStakes(walletAddress: string) {
    try {
      const response = await api.get(`/staking/user-stakes?wallet=${walletAddress}&refresh=true`);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user stakes:', error);
      throw error;
    }
  }

  // Add method to verify stake on backend
  async verifyStakeTransaction(txHash: string, walletAddress: string) {
    try {
      const response = await api.post('/staking/verify-transaction', {
        tx_hash: txHash,
        wallet_address: walletAddress
      });
      return response.data;
    } catch (error) {
      console.error('Failed to verify stake transaction:', error);
      throw error;
    }
  }

  async unstakeETH(stakeId: number, txHash: string): Promise<void> {
    try {
      const response = await api.post('/staking/unstake-sync', {
        stake_id: stakeId,
        tx_hash: txHash
      });
      return response.data;
    } catch (error) {
      console.error('Failed to sync unstake transaction:', error);
      throw new Error('Failed to sync unstake transaction with backend');
    }
  }

  async unstakeFromAccount(stakeId: number, stakeData: { name: string; amount: number }): Promise<void> {
    // This is a legacy method - we'll redirect to the new unstake flow
    throw new Error('Please use the new unstake button to unstake your ETH');
  }

  async getPools(): Promise<StakePool[]> {
    // Updated mock pools data with both ETH and ERC20 token support
    return [
      {
        id: 1,
        name: 'ETH Flexible Pool',
        description: 'Stake ETH with no lock period - instant withdrawal',
        apy: 8,
        min_stake: 0.01,
        max_stake: 100,
        lock_period: 0,
        is_active: true,
        total_staked: 25.5,
        participants: 12,
        token_address: '0x0000000000000000000000000000000000000000',
        token_symbol: 'ETH'
      },
      {
        id: 2,
        name: 'ETH Premium Pool',
        description: 'Stake ETH with 30-day lock for higher rewards',
        apy: 12,
        min_stake: 1,
        max_stake: 1000,
        lock_period: 30,
        is_active: true,
        total_staked: 45.2,
        participants: 8,
        token_address: '0x0000000000000000000000000000000000000000',
        token_symbol: 'ETH'
      },
      {
        id: 3,
        name: 'FVT Standard Pool',
        description: 'Standard 30-day FVT staking pool',
        apy: 10,
        min_stake: 100,
        max_stake: 10000,
        lock_period: 30,
        is_active: true,
        total_staked: 50000,
        participants: 25,
        token_address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        token_symbol: 'FVT'
      },
      {
        id: 4,
        name: 'FVT Premium Pool',
        description: 'Premium 90-day FVT staking pool with highest APY',
        apy: 18,
        min_stake: 1000,
        max_stake: 100000,
        lock_period: 90,
        is_active: true,
        total_staked: 150000,
        participants: 8,
        token_address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        token_symbol: 'FVT'
      }
    ];
  }
}

export const stakingService = new StakingService();
export default stakingService;
