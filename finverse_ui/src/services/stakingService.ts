import api from '@/lib/api';

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
}

export interface StakingPool {
  id: number;
  name: string;
  apy: number;
  lockPeriod: number;
  minStake: number;
  description?: string;
}

export interface RewardHistory {
  id: number;
  amount: number;
  claimedAt: Date;
  poolId: string;
}

export interface StakedEventData {
  user: string;
  amount: string;
  stakeIndex: number;
  timestamp: number;
}

// Service class for staking operations
class StakingService {
  private eventListeners: any[] = [];

  async initialize() {
    // Initialize service if needed
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
            icon: '/icons/fvt.png'
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            isSupported: false, // ETH not supported yet
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

  async getUserStakes(activeOnly: boolean = false) {
    const response = await api.get(`/staking/user-stakes?active_only=${activeOnly}`);
    return response.data;
  }

  async getStakingPools() {
    const response = await api.get('/staking/pools');
    return response.data;
  }

  async getStakingRewards() {
    const response = await api.get('/staking/rewards');
    return response.data;
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

  async claimRewards(stakeId: string) {
    const response = await api.post(`/staking/rewards/claim/${stakeId}`);
    return response.data;
  }

  async unstakeTokens(stakeId: string, amount: number) {
    const response = await api.post('/staking/unstake', { stakeId, amount });
    return response.data;
  }

  async updateStakingPosition(positionId: number, updateData: any) {
    const response = await api.put(`/staking/positions/${positionId}`, updateData);
    return response.data;
  }
}

export const stakingService = new StakingService();
