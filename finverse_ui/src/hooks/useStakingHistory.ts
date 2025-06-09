import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { useWallet } from './useWallet';
import { useToast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/utils/errorHandler';
import { getStakeVaultContract, formatTokenAmount, loadUserStakesFromContract, ContractStakingSummary } from '@/lib/contracts';

// Import types with fallback
interface StakeProfile {
  stake: {
    id: string | number;
    user_id: number;
    name: string;
    amount: number;
    balance: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    tx_hash?: string;
    pool_id: string;
    staked_at: string;
    lock_period: number;
    reward_rate: number;
    apy_snapshot: number;
    claimable_rewards: number;
    rewards_earned: number;
    unlock_at: string;
    status: string;
  };
  rewards: {
    apy: number;
    earned: number;
    duration_days: number;
  };
  isOverdue: boolean;
}

interface StakingEvent {
  type: 'Staked' | 'Unstaked' | 'RewardClaimed';
  stakeId: number;
  amount: string;
  timestamp: Date;
  transactionHash: string;
  blockNumber: number;
}

interface StakedEventData {
  user: string;
  amount: string;
  timestamp: number;
  stakeIndex: number;
  txHash: string;
  poolId?: string;
  lockPeriod?: number;
}

// Try to import stakingService with fallback
let stakingService: any = null;
try {
  // Dynamic import to handle missing service gracefully
  const serviceModule = await import('@/services/stakingService');
  stakingService = serviceModule.stakingService || serviceModule.default;
} catch (error) {
  console.warn('StakingService not available, using contract-only mode');
}

interface UseStakingHistoryReturn {
  stakingHistory: StakeProfile[]; // Updated to use unified model
  recentEvents: StakingEvent[];
  isLoading: boolean;
  error: string | null;
  refreshHistory: () => Promise<void>;
  claimRewards: (stakeId: string) => Promise<void>;
  unstakeTokens: (stakeId: string, amount: number) => Promise<void>;
  updateStakingPosition: (positionId: number, updateData: any) => Promise<void>;
}

export const useStakingHistory = (): UseStakingHistoryReturn => {
  const [stakingHistory, setStakingHistory] = useState<StakeProfile[]>([]);
  const [recentEvents, setRecentEvents] = useState<StakingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { accountAddress, isConnected, isCorrectNetwork } = useWallet();
  const { toast } = useToast();
  const eventListenersRef = useRef<any[]>([]);

  // Enhanced data fetching with database-first approach
  const fetchStakingHistory = useCallback(async () => {
    if (!isConnected || !accountAddress) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Primary: Load from database first (only if service is available)
      if (stakingService) {
        console.log('🗄️ Loading staking history from database...');
        try {
          const dbResponse = await fetch('/api/v1/staking/user-stakes', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
          });
          
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            
            if (dbData.positions && dbData.positions.length > 0) {
              // Transform database positions to history format
              const historyFromDb = dbData.positions.map((position: any) => ({
                stake: {
                  id: position.id,
                  user_id: position.userId,
                  name: `Stake #${position.id}`,
                  amount: position.amount,
                  balance: position.amount,
                  created_at: position.createdAt,
                  updated_at: position.updatedAt,
                  is_active: position.isActive,
                  tx_hash: position.txHash,
                  pool_id: position.poolId,
                  staked_at: position.stakedAt,
                  lock_period: position.lockPeriod,
                  reward_rate: position.rewardRate,
                  apy_snapshot: position.apySnapshot || position.rewardRate,
                  claimable_rewards: position.claimableRewards,
                  rewards_earned: position.rewardsEarned,
                  unlock_at: position.unlockDate,
                  status: position.status
                },
                rewards: {
                  apy: position.rewardRate,
                  earned: position.rewardsEarned,
                  duration_days: position.lockPeriod
                },
                isOverdue: position.isUnlocked && position.isActive
              }));

              console.log(`✅ Loaded ${historyFromDb.length} stakes from database`);
              setStakingHistory(historyFromDb);
              setIsLoading(false);
              return;
            }
          }
        } catch (dbError) {
          console.warn('Database fetch failed, falling back to contract:', dbError);
        }
      }
      
      // Fallback: Load from smart contract
      console.log('🔗 Loading staking history from smart contract...');
      
      let contractSummary: ContractStakingSummary;
      try {
        contractSummary = await loadUserStakesFromContract(accountAddress);
      } catch (error) {
        console.error('Failed to load from contract:', error);
        // Return empty history instead of crashing
        setStakingHistory([]);
        setIsLoading(false);
        return;
      }
      
      // Transform contract positions to history format
      const historyFromContract = contractSummary.positions.map(position => ({
        stake: {
          id: position.stakeIndex,
          user_id: 0, // Not relevant for contract data
          name: `Stake #${position.stakeIndex}`,
          amount: parseFloat(position.amountFormatted), // Use formatted amount to avoid BigInt issues
          balance: parseFloat(position.amountFormatted),
          created_at: position.startDate.toISOString(),
          updated_at: position.startDate.toISOString(),
          is_active: !position.claimed && parseFloat(position.amountFormatted) > 0,
          tx_hash: null,
          pool_id: "contract-pool",
          staked_at: position.startDate.toISOString(),
          lock_period: position.lockPeriodDays,
          reward_rate: position.apy,
          apy_snapshot: position.apy,
          claimable_rewards: position.claimed ? 0 : parseFloat(position.rewardFormatted),
          rewards_earned: parseFloat(position.rewardFormatted),
          unlock_at: new Date(position.timestamp * 1000 + position.lockPeriod * 1000).toISOString(),
          status: position.claimed ? "COMPLETED" : "ACTIVE"
        },
        rewards: {
          apy: position.apy,
          earned: parseFloat(position.rewardFormatted),
          duration_days: Math.floor((Date.now() - position.startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        isOverdue: position.isUnlocked && !position.claimed
      }));

      setStakingHistory(historyFromContract);
      console.log(`✅ Loaded ${historyFromContract.length} stakes from contract`);

    } catch (err: any) {
      console.error('Failed to fetch staking history:', err);
      
      // Ultimate fallback: empty state with user feedback
      setStakingHistory([]);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load staking history from blockchain';
      setError(errorMessage);
      
      toast({
        title: "Failed to Load History",
        description: "Could not load staking data from blockchain. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountAddress, isConnected, toast]);

  // Fetch past events
  const fetchPastEvents = useCallback(async () => {
    if (!accountAddress || !isConnected || !isCorrectNetwork || !window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = getStakeVaultContract(provider);

      // Get past events for the last 1000 blocks
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      const stakedFilter = contract.filters.Staked(accountAddress);
      const unstakedFilter = contract.filters.Unstaked(accountAddress);
      const claimedFilter = contract.filters.Claimed(accountAddress);

      const [stakedEvents, unstakedEvents, claimedEvents] = await Promise.all([
        contract.queryFilter(stakedFilter, fromBlock),
        contract.queryFilter(unstakedFilter, fromBlock),
        contract.queryFilter(claimedFilter, fromBlock)
      ]);

      const events: StakingEvent[] = [];

      // Process staked events
      stakedEvents.forEach(event => {
        if (event.args) {
          events.push({
            type: 'Staked',
            stakeId: Number(event.args.stakeIndex),
            amount: formatTokenAmount(event.args.amount),
            timestamp: new Date(Number(event.args.timestamp) * 1000),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        }
      });

      // Process unstaked events
      unstakedEvents.forEach(event => {
        if (event.args) {
          events.push({
            type: 'Unstaked',
            stakeId: Number(event.args.stakeIndex),
            amount: formatTokenAmount(event.args.amount),
            timestamp: new Date(), // Use current time as we don't have timestamp in event
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        }
      });

      // Process claimed events
      claimedEvents.forEach(event => {
        if (event.args) {
          events.push({
            type: 'RewardClaimed',
            stakeId: Number(event.args.stakeIndex),
            amount: formatTokenAmount(event.args.reward),
            timestamp: new Date(), // Use current time as we don't have timestamp in event
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        }
      });

      // Sort events by block number (newest first)
      events.sort((a, b) => b.blockNumber - a.blockNumber);
      setRecentEvents(events.slice(0, 20)); // Keep only 20 most recent events

    } catch (err) {
      console.error('Failed to fetch past events:', err);
    }
  }, [accountAddress, isConnected, isCorrectNetwork]);

  // Claim rewards function using unified API
  const claimRewards = useCallback(async (stakeId: string) => {
    if (!accountAddress || !isConnected || !isCorrectNetwork) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim rewards",
        variant: "destructive",
      });
      return;
    }

    try {
      if (stakingService) {
        await stakingService.claimRewards(stakeId);
      } else {
        throw new Error('Staking service not available');
      }
      
      toast({
        title: "Rewards Claimed",
        description: `Successfully claimed rewards for stake #${stakeId}`,
      });

      // Refresh history after claiming
      await fetchStakingHistory();
    } catch (err: any) {
      console.error('Failed to claim rewards:', err);
      const errorMessage = err.message || 'Failed to claim rewards';
      
      toast({
        title: "Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [accountAddress, isConnected, isCorrectNetwork, toast, fetchStakingHistory]);

  // Unstake tokens function using unified API
  const unstakeTokens = useCallback(async (stakeId: string, amount: number) => {
    if (!accountAddress || !isConnected || !isCorrectNetwork) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to unstake tokens",
        variant: "destructive",
      });
      return;
    }

    try {
      await stakingService.unstakeTokens(stakeId, amount);
      
      toast({
        title: "Unstake Successful",
        description: `Successfully unstaked tokens from stake #${stakeId}`,
      });

      // Refresh history after unstaking
      await fetchStakingHistory();
    } catch (err: any) {
      console.error('Failed to unstake tokens:', err);
      const errorMessage = err.message || 'Failed to unstake tokens';
      
      toast({
        title: "Unstake Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [accountAddress, isConnected, isCorrectNetwork, toast, fetchStakingHistory]);

  // Update staking position function using unified API
  const updateStakingPosition = useCallback(async (positionId: number, updateData: any) => {
    if (!accountAddress || !isConnected || !isCorrectNetwork) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to update staking position",
        variant: "destructive",
      });
      return;
    }

    try {
      await stakingService.updateStakingPosition(positionId, updateData);
      
      toast({
        title: "Position Updated",
        description: `Successfully updated staking position #${positionId}`,
      });

      // Refresh history after updating
      await fetchStakingHistory();
    } catch (err: any) {
      console.error('Failed to update staking position:', err);
      const errorMessage = err.message || 'Failed to update staking position';
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [accountAddress, isConnected, isCorrectNetwork, toast, fetchStakingHistory]);

  // Refresh history function
  const refreshHistory = useCallback(async () => {
    await fetchStakingHistory();
  }, [fetchStakingHistory]);

  // Initial data load
  useEffect(() => {
    fetchStakingHistory();
  }, [fetchStakingHistory]);

  // Enhanced event listener setup with proper event filtering and backend sync
  useEffect(() => {
    const setupEventListeners = async () => {
      if (!isConnected || !isCorrectNetwork || !accountAddress || !window.ethereum) return;

      try {
        await stakingService.initialize();
        
        // Listen for new Staked events with backend sync
        await stakingService.startListeningToStakedEvents(async (eventData: StakedEventData) => {
          if (eventData.user.toLowerCase() === accountAddress.toLowerCase()) {
            console.log('📡 New Staked event for current user, syncing to backend...');
            
            try {
              // Sync to backend via API
              await stakingApi.syncStakeEvent({
                user_id: accountAddress,
                stake_id: eventData.stakeIndex,
                amount: eventData.amount,
                duration: eventData.lockPeriod || 0,
                tx_hash: eventData.txHash,
                pool_id: eventData.poolId || 'default-pool',
                timestamp: new Date().toISOString()
              });
              
              console.log('✅ Successfully synced staking event to backend');
              
            } catch (syncError) {
              console.error('❌ Failed to sync to backend:', syncError);
            }
            
            // Refresh history after sync
            setTimeout(() => {
              fetchStakingHistory();
            }, 3000);
          }
        });

      } catch (error) {
        console.error('Failed to setup event listeners:', error);
      }
    };

    setupEventListeners();

    return () => {
      stakingService.stopListeningToEvents();
    };
  }, [isConnected, isCorrectNetwork, accountAddress, fetchStakingHistory]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach(listener => {
        if (listener.off) listener.off();
      });
    };
  }, []);

  return {
    stakingHistory,
    recentEvents,
    isLoading,
    error,
    refreshHistory,
    claimRewards,
    unstakeTokens,
    updateStakingPosition
  };
};
