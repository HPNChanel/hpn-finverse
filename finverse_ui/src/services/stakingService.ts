import api from './api';
// Import from utils/stakingUtils instead of direct crypto-browserify
import { generateWalletAddress, calculateRewards } from '../utils/stakingUtils';
import type { StakingProfile } from '../utils/importFixes';
import { handleErrorResponse } from '../utils/importFixes';
import axios from 'axios';

export interface Stake {
  id: number;
  user_id: number;
  name: string;
  address: string;
  amount: number;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StakeStatus {
  total_staked: number;
  apy: number;
  rewards: number;
  lastUpdated: string;
}

interface StakingReward {
  earned: number;
  apy: number;
  duration_days: number;
}

// Types for staking
export interface StakeRequest {
  amount: number;
  stake_id?: number;
}

export interface CreateStakeRequest {
  name: string;
  amount: number;
  address?: string;
}

// Create a mock stake status with required fields
const createMockStakeStatus = (total_staked: number): StakeStatus => {
  return {
    total_staked,
    apy: 5.2,
    rewards: total_staked * 0.052 / 12, // Simple monthly reward calculation
    lastUpdated: new Date().toISOString()
  };
};

// Staking service
const stakingService = {
  /**
   * Get staking status
   */
  getStatus: async (stakeId?: number): Promise<StakeStatus> => {
    try {
      const endpoint = stakeId 
        ? `/staking/status/${stakeId}` 
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
            lastUpdated: new Date().toISOString()
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
   * Get all stakes for the current user
   */
  getAllStakes: async (): Promise<Stake[]> => {
    try {
      const response = await api.get<{ stakes: Stake[] }>('/staking/stakes');
      return response.data.stakes;
    } catch (error) {
      console.error('Error fetching stakes:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Stakes endpoint not found. Using mock data temporarily.');
          // Return mock data for development
          return mockStakes();
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
   * Get all staking profiles
   */
  getStakingProfiles: async (): Promise<StakingProfile[]> => {
    try {
      const response = await api.get<{ stakes: StakingProfile[] }>('/staking/profiles');
      return response.data.stakes;
    } catch (error) {
      console.error('Error fetching staking profiles:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Staking profiles endpoint not found. Calculating profiles from stakes.');
          
          try {
            // Get stakes and convert them to profiles
            const stakes = await stakingService.getAllStakes();
            const profiles: StakingProfile[] = [];
            
            for (const stake of stakes) {
              const status = await stakingService.getStatus(stake.id);
              const rewards = stakingService.calculateRewards(status, stake);
              
              profiles.push({
                stake,
                status: {
                  total_staked: stake.amount,
                  last_updated: status.lastUpdated
                },
                rewards
              });
            }
            
            return profiles;
          } catch (profileError) {
            console.error('Error generating profiles from stakes:', profileError);
            return mockStakingProfiles();
          }
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
  stake: async (amount: number, stakeId?: number): Promise<StakeStatus> => {
    try {
      const endpoint = stakeId 
        ? `/staking/stake/${stakeId}` 
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
  unstake: async (amount: number, stakeId?: number): Promise<StakeStatus> => {
    try {
      const endpoint = stakeId 
        ? `/staking/unstake/${stakeId}` 
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

  // Get stake by ID
  getStake: async (id: number): Promise<Stake | null> => {
    try {
      const response = await api.get<Stake>(`/staking/stakes/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching stake:", error);
      
      if (axios.isAxiosError(error)) {
        // If no stake exists, return null
        if (error.response?.status === 404) {
          console.warn(`Stake ${id} not found. Using mock data temporarily.`);
          return mockStakeById(id);
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

  // Create stake
  createStake: async (data: CreateStakeRequest): Promise<Stake> => {
    try {
      // Generate address on client if not provided
      const stakeData = {
        ...data,
        address: data.address || generateWalletAddress(data.name)
      };
      
      const response = await api.post<Stake>('/staking/stakes', stakeData);
      return response.data;
    } catch (error) {
      console.error("Error creating stake:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn('Create stake endpoint not found. Using mock data temporarily.');
          // Mock response
          return {
            id: Math.floor(Math.random() * 1000) + 3, // Random ID for mock
            user_id: 1,
            name: data.name,
            address: data.address || generateWalletAddress(data.name),
            amount: data.amount,
            balance: data.amount,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.detail || 'Invalid stake data';
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
  calculateRewards: (status: StakeStatus, stake: Stake): StakingReward => {
    const stakingStartDate = new Date(stake.created_at);
    const now = new Date();
    const daysStaked = Math.max(0, Math.floor((now.getTime() - stakingStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Default APY of 5%, but more for longer staking periods
    const apy = daysStaked > 90 ? 7.5 : 5.0;
    const earned = calculateRewards(stake.amount, daysStaked, apy);
    
    return {
      earned,
      apy,
      duration_days: daysStaked
    };
  },

  // Get staking profile for a specific stake
  getStakingProfile: async (stakeId: number): Promise<StakingProfile | null> => {
    try {
      // Try getting the profile directly from the API
      try {
        const response = await api.get<StakingProfile>(`/staking/profiles/${stakeId}`);
        return response.data;
      } catch (profileError) {
        // If not found, build it manually
        if (axios.isAxiosError(profileError) && profileError.response?.status === 404) {
          const stake = await stakingService.getStake(stakeId);
          if (!stake) return null;
          
          const status = await stakingService.getStatus(stakeId);
          const rewards = stakingService.calculateRewards(status, stake);
          
          return { 
            stake, 
            status: {
              total_staked: stake.amount,
              last_updated: status.lastUpdated
            }, 
            rewards 
          };
        }
        throw profileError;
      }
    } catch (error) {
      console.error("Error fetching staking profile:", error);
      if (stakeId <= 2) {
        // Return mock profile for common IDs
        return mockStakingProfileById(stakeId);
      }
      return null;
    }
  }
};

// Mock data functions
function mockStakeById(id: number): Stake {
  const mockDate = new Date(Date.now() - (id === 1 ? 90 : 180) * 24 * 60 * 60 * 1000);
  
  return {
    id,
    user_id: 1,
    name: id === 1 ? "Main Staking Pool" : "Long-term Staking",
    address: generateWalletAddress(id.toString()),
    amount: id === 1 ? 250 : 500,
    balance: id === 1 ? 1000 : 500,
    is_active: true,
    created_at: mockDate.toISOString(),
    updated_at: mockDate.toISOString()
  };
}

function mockStakes(): Stake[] {
  return [1, 2].map(id => mockStakeById(id));
}

function mockStakingProfileById(id: number): StakingProfile {
  const stake = mockStakeById(id);
  const days = id === 1 ? 30 : 90;
  
  return {
    stake,
    status: {
      total_staked: stake.amount,
      last_updated: new Date().toISOString()
    },
    rewards: {
      earned: stake.amount * 0.05 * days / 365,
      apy: id === 1 ? 5.0 : 7.5,
      duration_days: days
    }
  };
}

function mockStakingProfiles(): StakingProfile[] {
  return [1, 2].map(id => mockStakingProfileById(id));
}

export default stakingService;