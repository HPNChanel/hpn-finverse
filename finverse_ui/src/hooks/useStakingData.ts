import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { useToast } from './use-toast';
import { 
  loadContractInfo, 
  ERC20_ABI, 
  STAKE_VAULT_ABI, 
  FALLBACK_CONTRACTS, 
  loadUserStakesFromContract, 
  ContractStakingSummary 
} from '@/lib/contracts';
import { ErrorHandler } from '@/utils/errorHandler';
import { stakingService } from '@/services/stakingService';
import type { ContractStakePosition } from '@/types/contracts';

// Add missing interface definitions
interface StakingPool {
  id: number;
  name: string;
  description: string;
  apy: number;
  min_stake: number;
  max_stake: number;
  lock_period: number;
  is_active: boolean;
  total_staked: number;
  participants: number;
}

interface RewardHistory {
  id: number;
  amount: number;
  claimed_at: string;
  stake_id: number;
}

interface TokenBalances {
  fvtBalance: string;
  stakedBalance: string;
  ethBalance: string;
  allowance: string;
}

interface GlobalStats {
  totalStaked: string;
  apy: number;
  lockPeriodSeconds: number;
  lockPeriodDays: number;
  totalStakers: number;
}

interface UseStakingDataReturn {
  // Data
  pools: StakingPool[];
  stakes: ContractStakePosition[]; // Updated to use contract positions
  contractSummary: ContractStakingSummary | null; // New: direct contract data
  rewards: RewardHistory[];
  claimableRewards: number;
  tokenBalances: TokenBalances | null;
  globalStats: GlobalStats | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  refreshContractData: () => Promise<void>; // New: refresh only contract data
  clearError: () => void;
  
  // Blockchain functions
  getAllowance: () => Promise<string>;
  approveTokens: (amount: string) => Promise<void>;
  stakeTokens: (amount: string) => Promise<void>;
  stakeTokensWithPool: (amount: string, poolId: number) => Promise<void>;
}

export const useStakingData = (): UseStakingDataReturn => {
  const [stakes, setStakes] = useState<ContractStakePosition[]>([]);
  const [contractSummary, setContractSummary] = useState<ContractStakingSummary | null>(null);
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [rewards, setRewards] = useState<RewardHistory[]>([]);
  const [claimableRewards, setClaimableRewards] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalances | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoization refs to prevent infinite loading
  const contractsLoadedRef = useRef(false);
  const contractInfoRef = useRef<any>(null);
  const lastAccountRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { accountAddress, isConnected, isCorrectNetwork } = useWallet();
  const { toast } = useToast();

  // Load contract information only once
  const loadContractsOnce = useCallback(async () => {
    if (contractsLoadedRef.current && contractInfoRef.current) {
      return contractInfoRef.current;
    }

    try {
      console.log('🔄 Loading contract information...');
      const info = await loadContractInfo();
      
      if (info) {
        contractInfoRef.current = info.contracts;
        console.log('✅ Contract info loaded successfully');
      } else {
        contractInfoRef.current = FALLBACK_CONTRACTS;
        console.warn('⚠️ Using fallback contract addresses');
      }
      
      contractsLoadedRef.current = true;
      return contractInfoRef.current;
    } catch (error) {
      console.error('❌ Failed to load contract info:', error);
      ErrorHandler.logError(error, 'Load contract info');
      contractInfoRef.current = FALLBACK_CONTRACTS;
      contractsLoadedRef.current = true;
      setError('Failed to load contract information. Using fallback addresses.');
      return contractInfoRef.current;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!accountAddress || !isConnected || !isCorrectNetwork || !contractInfoRef.current) {
      setTokenBalances(null);
      return;
    }

    try {
      await stakingService.initialize();
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(contractInfoRef.current.MockERC20.address, ERC20_ABI, provider);
      const vaultContract = new ethers.Contract(contractInfoRef.current.StakeVault.address, STAKE_VAULT_ABI, provider);

      const [fvtBalance, stakedBalance, ethBalance, allowance] = await Promise.allSettled([
        tokenContract.balanceOf(accountAddress),
        vaultContract.totalStaked(accountAddress),
        provider.getBalance(accountAddress),
        tokenContract.allowance(accountAddress, contractInfoRef.current.StakeVault.address)
      ]);

      setTokenBalances({
        fvtBalance: fvtBalance.status === 'fulfilled' ? ethers.formatEther(fvtBalance.value) : '0',
        stakedBalance: stakedBalance.status === 'fulfilled' ? ethers.formatEther(stakedBalance.value) : '0',
        ethBalance: ethBalance.status === 'fulfilled' ? ethers.formatEther(ethBalance.value) : '0',
        allowance: allowance.status === 'fulfilled' ? ethers.formatEther(allowance.value) : '0'
      });
    } catch (err) {
      console.error('Failed to fetch token balances:', err);
      setError('Failed to fetch token balances');
    }
  }, [accountAddress, isConnected, isCorrectNetwork]);

  // Fetch global stats
  const fetchGlobalStats = useCallback(async () => {
    if (!contractInfoRef.current) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vaultContract = new ethers.Contract(contractInfoRef.current.StakeVault.address, STAKE_VAULT_ABI, provider);

      const [apy, lockPeriod] = await Promise.allSettled([
        vaultContract.APY_PERCENTAGE(),
        vaultContract.LOCK_PERIOD()
      ]);

      setGlobalStats({
        totalStaked: '150000',
        apy: apy.status === 'fulfilled' ? Number(apy.value) : 10,
        lockPeriodSeconds: lockPeriod.status === 'fulfilled' ? Number(lockPeriod.value) : 2592000,
        lockPeriodDays: lockPeriod.status === 'fulfilled' ? Number(lockPeriod.value) / (24 * 60 * 60) : 30,
        totalStakers: 42
      });
    } catch (err) {
      console.error('Failed to fetch global stats:', err);
    }
  }, []);

  // Load staking positions directly from smart contract
  const loadContractStakingData = useCallback(async () => {
    if (!accountAddress || !isConnected || !isCorrectNetwork) {
      setContractSummary(null);
      setStakes([]);
      return;
    }

    try {
      console.log('🔗 Loading staking data directly from smart contract...');
      
      const summary = await loadUserStakesFromContract(accountAddress);
      
      setContractSummary(summary);
      setStakes(summary.positions);
      
      // Update claimable rewards from contract data
      const claimableAmount = parseFloat(summary.totalClaimable);
      setClaimableRewards(claimableAmount);
      
      console.log(`✅ Loaded ${summary.positions.length} stake positions from contract`);
      console.log(`📊 Total staked: ${summary.totalStakedFormatted} FVT`);
      console.log(`💰 Total claimable: ${summary.totalClaimableFormatted} FVT`);
      
    } catch (error) {
      console.error('❌ Failed to load contract staking data:', error);
      
      // Fallback to empty data instead of throwing
      setContractSummary({
        userAddress: accountAddress,
        totalStaked: '0',
        totalStakedFormatted: '0.0000',
        stakeCount: 0,
        positions: [],
        totalRewards: '0',
        totalRewardsFormatted: '0.000000',
        totalClaimable: '0',
        totalClaimableFormatted: '0.000000',
        lastUpdated: Date.now()
      });
      setStakes([]);
      setClaimableRewards(0);
    }
  }, [accountAddress, isConnected, isCorrectNetwork]);

  // Load API-based data (pools, etc.) with fallback
  const loadApiStakingData = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork) {
      return;
    }

    try {
      console.log('📡 Loading supplementary data from API...');
      
      // Load pools and rewards from API (these don't depend on user stakes)
      const poolsResponse = await stakingService.getStakingPools();
      setPools(poolsResponse.pools || []);
      
      // Load rewards history if available
      try {
        const rewardsResponse = await stakingService.getStakingRewards();
        setRewards(rewardsResponse.rewards || []);
      } catch (rewardsError) {
        console.warn('Could not load rewards from API, using empty array');
        setRewards([]);
      }

    } catch (error) {
      console.warn('Failed to load API data, using fallbacks:', error);
      
      // Use fallback pool data
      setPools([
        {
          id: 1,
          name: "Stable Pool",
          description: "Low risk, stable returns",
          apy: 10.0,
          min_stake: 0.01,
          max_stake: 10000.0,
          lock_period: 30,
          is_active: true,
          total_staked: 50000.0,
          participants: 25
        }
      ]);
      setRewards([]);
    }
  }, [isConnected, isCorrectNetwork]);

  // Refresh only contract data
  const refreshContractData = useCallback(async (): Promise<void> => {
    await loadContractStakingData();
  }, [loadContractStakingData]);

  // Enhanced data loading that prioritizes contract data
  const loadStakingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load contract data first (most important)
      await loadContractStakingData();
      
      // Load supplementary API data
      await loadApiStakingData();

    } catch (err: any) {
      console.error('Error in loadStakingData:', err);
      setError('Failed to load staking data from blockchain');
    } finally {
      setIsLoading(false);
    }
  }, [loadContractStakingData, loadApiStakingData]);

  // Refresh all data
  const refreshData = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        loadStakingData(),
        fetchTokenBalances(),
        fetchGlobalStats()
      ]);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadStakingData, fetchTokenBalances, fetchGlobalStats]);

  // Initialize contracts on mount
  useEffect(() => {
    loadContractsOnce();
  }, [loadContractsOnce]);

  // Load data when wallet state changes (with account change detection)
  useEffect(() => {
    const hasAccountChanged = lastAccountRef.current !== accountAddress;
    lastAccountRef.current = accountAddress;

    if (isConnected && isCorrectNetwork && accountAddress && contractsLoadedRef.current) {
      if (hasAccountChanged) {
        console.log('Account changed, reloading data...');
        setIsLoading(true);
        refreshData().finally(() => setIsLoading(false));
      } else {
        // Just refresh without showing loading state
        refreshData();
      }
    } else {
      // Clear data when disconnected
      setTokenBalances(null);
      setGlobalStats(null);
      setStakes([]);
      setRewards([]);
      setClaimableRewards(0);
      setPools([]);
    }
  }, [isConnected, isCorrectNetwork, accountAddress, refreshData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Blockchain interaction functions
  const getAllowance = useCallback(async (): Promise<string> => {
    if (!accountAddress || !contractInfoRef.current) {
      throw new Error('No account connected');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(contractInfoRef.current.MockERC20.address, ERC20_ABI, provider);
    const allowance = await tokenContract.allowance(accountAddress, contractInfoRef.current.StakeVault.address);
    return ethers.formatEther(allowance);
  }, [accountAddress]);

  const approveTokens = useCallback(async (amount: string): Promise<void> => {
    if (!accountAddress || !contractInfoRef.current) {
      throw new Error('No account connected');
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(contractInfoRef.current.MockERC20.address, ERC20_ABI, signer);
      
      const amountWei = ethers.parseEther(amount);
      const tx = await tokenContract.approve(contractInfoRef.current.StakeVault.address, amountWei);
      await tx.wait();
      
      await fetchTokenBalances();
      
      toast({
        title: "Approval Successful",
        description: `Approved ${amount} FVT tokens for staking`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed';
      setError(message);
      throw err;
    }
  }, [accountAddress, fetchTokenBalances, toast]);

  const stakeTokens = useCallback(async (amount: string): Promise<void> => {
    if (!accountAddress || !contractInfoRef.current) {
      throw new Error('No account connected');
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(contractInfoRef.current.StakeVault.address, STAKE_VAULT_ABI, signer);
      
      const amountWei = ethers.parseEther(amount);
      const tx = await vaultContract.stake(amountWei);
      await tx.wait();
      
      await refreshData();
      
      toast({
        title: "Staking Successful",
        description: `Successfully staked ${amount} FVT tokens`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Staking failed';
      setError(message);
      throw err;
    }
  }, [accountAddress, refreshData, toast]);

  const stakeTokensWithPool = useCallback(async (amount: string, poolId: number): Promise<void> => {
    await stakeTokens(amount);
  }, [stakeTokens]);

  return {
    // Data
    pools,
    stakes, // Now returns contract-loaded positions
    contractSummary, // New: complete contract summary
    rewards,
    claimableRewards,
    tokenBalances,
    globalStats,
    
    // Loading states
    isLoading,
    isRefreshing,
    
    // Error handling
    error,
    
    // Actions
    refreshData,
    refreshContractData, // New: refresh only contract data
    clearError,
    
    // Blockchain functions
    getAllowance,
    approveTokens,
    stakeTokens,
    stakeTokensWithPool,
  };
};

