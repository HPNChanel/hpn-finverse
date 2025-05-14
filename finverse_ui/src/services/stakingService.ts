import api from './api';
// Import from utils/stakingUtils instead of direct crypto-browserify
import { generateWalletAddress, calculateRewards } from '../utils/stakingUtils';
import type { StakingProfile } from '../utils/importFixes';
import { handleErrorResponse } from '../utils/importFixes';
import axios from 'axios';

interface StakingAccount {
  id: number;
  user_id: number;
  name: string;
  address: string;
  balance: number;
  created_at: string;
}

export interface StakeStatus {
  total_staked: number;
  apy: number;
  rewards: number;
  lastUpdated: string;
  user_id?: number;
  last_updated?: string;
}

interface StakingReward {
  amount: number;
  apy: number;
  earned: number;
  duration_days: number;
}

// Types for staking
export interface StakeRequest {
  amount: number;
  account_id?: number;
}

export interface CreateStakingAccountRequest {
  name: string;
  initial_balance?: number;
}

// Create a mock stake status with required fields
const createMockStakeStatus = (total_staked: number): StakeStatus => {
  return {
    total_staked,
    apy: 5.2,
    rewards: total_staked * 0.052 / 12, // Simple monthly reward calculation
    lastUpdated: new Date().toISOString(),
    user_id: 1,
    last_updated: new Date().toISOString()
  };
};

// Staking service
const stakingService = {
  /**
   * Get staking status
   */
  getStatus: async (accountId?: number): Promise<StakeStatus> => {
    try {
      const endpoint = accountId 
        ? `/staking/status/${accountId}` 
        : '/staking/status';
      
      const response = await api.get<StakeStatus>(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching staking status:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Staking status endpoint not found. Using mock data temporarily.');
          // For development, return mock data if API fails
          return {
            total_staked: 250,
            apy: 5.2,
            rewards: 12.5,
            lastUpdated: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            user_id: 1
          };
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Get all staking accounts
   */
  getStakingAccounts: async (): Promise<StakingProfile[]> => {
    try {
      const response = await api.get<{ accounts: StakingProfile[] }>('/staking/accounts');
      return response.data.accounts;
    } catch (error) {
      console.error('Error fetching staking accounts:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Staking accounts endpoint not found. Using mock data temporarily.');
          // Return mock data for development
          return mockStakingAccounts();
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  // Stake funds
  stake: async (amount: number, accountId?: number): Promise<StakeStatus> => {
    try {
      const endpoint = accountId 
        ? `/staking/stake/${accountId}` 
        : '/staking/stake';
      
      const response = await api.post<StakeStatus>(endpoint, { amount });
      return response.data;
    } catch (error) {
      console.error("Error staking funds:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Staking endpoint not found. Using mock data temporarily.');
          // Mock response
          return createMockStakeStatus(500 + amount);
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.detail || 'Invalid staking data';
          throw new Error(errorDetail);
        }
        
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  // Unstake funds
  unstake: async (amount: number, accountId?: number): Promise<StakeStatus> => {
    try {
      const endpoint = accountId 
        ? `/staking/unstake/${accountId}` 
        : '/staking/unstake';
      
      const response = await api.post<StakeStatus>(endpoint, { amount });
      return response.data;
    } catch (error) {
      console.error("Error unstaking funds:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Unstaking endpoint not found. Using mock data temporarily.');
          // Mock response
          return createMockStakeStatus(Math.max(0, 500 - amount));
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.detail || 'Invalid unstaking data';
          throw new Error(errorDetail);
        }
        
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  // Get staking account by ID
  getStakingAccount: async (id: number): Promise<StakingAccount | null> => {
    try {
      const response = await api.get<StakingAccount>(`/staking/account/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching staking account:", error);
      
      if (axios.isAxiosError(error)) {
        // If no staking account exists, return null
        if (error.response?.status === 404) {
          console.warn(`Staking account ${id} not found. Using mock data temporarily.`);
          return {
            id,
            user_id: 1,
            name: id === 1 ? "Main Staking Account" : "Long-term Staking",
            address: generateWalletAddress(id === 1 ? "Main Staking Account" : "Long-term Staking"),
            balance: id === 1 ? 1000 : 500,
            created_at: new Date(Date.now() - (id === 1 ? 90 : 180) * 24 * 60 * 60 * 1000).toISOString()
          };
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  // Create staking account
  createStakingAccount: async (data: CreateStakingAccountRequest): Promise<StakingAccount> => {
    try {
      const response = await api.post<StakingAccount>('/staking/account/create', {
        ...data,
        address: generateWalletAddress(data.name) // Generate address on client for now
      });
      return response.data;
    } catch (error) {
      console.error("Error creating staking account:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Create staking account endpoint not found. Using mock data temporarily.');
          // Mock response
          return {
            id: Math.floor(Math.random() * 1000) + 3, // Random ID for mock
            user_id: 1,
            name: data.name,
            address: generateWalletAddress(data.name),
            balance: data.initial_balance || 0,
            created_at: new Date().toISOString()
          };
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.detail || 'Invalid account data';
          throw new Error(errorDetail);
        }
        
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  // Calculate rewards helper function
  calculateRewards: (status: StakeStatus, account: StakingAccount): StakingReward => {
    const stakingStartDate = new Date(account.created_at);
    const now = new Date();
    const daysStaked = Math.max(0, Math.floor((now.getTime() - stakingStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Default APY of 5%, but more for longer staking periods
    const apy = daysStaked > 90 ? 7.5 : 5.0;
    const earned = calculateRewards(status.total_staked, daysStaked, apy);
    
    return {
      amount: status.total_staked,
      apy,
      earned,
      duration_days: daysStaked
    };
  },

  // Get staking profile for a specific account
  getStakingProfile: async (accountId?: number): Promise<StakingProfile | null> => {
    try {
      if (accountId) {
        const account = await stakingService.getStakingAccount(accountId);
        if (!account) return null;
        
        const status = await stakingService.getStatus(accountId);
        const rewards = stakingService.calculateRewards(status, account);
        
        return { 
          account, 
          status: {
            total_staked: status.total_staked,
            last_updated: status.lastUpdated || status.last_updated || new Date().toISOString()
          }, 
          rewards 
        };
      } else {
        // Legacy method when no account ID is specified
        // Try to get the default staking account
        const account = await stakingService.getStakingAccount(1);
        if (!account) return null;
        
        const status = await stakingService.getStatus();
        const rewards = stakingService.calculateRewards(status, account);
        
        return { 
          account, 
          status: {
            total_staked: status.total_staked,
            last_updated: status.lastUpdated || status.last_updated || new Date().toISOString()
          }, 
          rewards 
        };
      }
    } catch (error) {
      console.error("Error fetching staking profile:", error);
      return null;
    }
  }
};

// Mock data generation without direct crypto dependencies
function mockStakingAccounts(): StakingProfile[] {
  return [
    {
      account: {
        id: 1,
        name: "Main Staking Account",
        address: generateWalletAddress("staking1"),
        balance: 500,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      status: {
        total_staked: 250,
        last_updated: new Date().toISOString()
      },
      rewards: {
        earned: 12.5,
        apy: 5.2,
        duration_days: 30
      }
    },
    // ...other mock accounts...
  ];
}

export default stakingService;