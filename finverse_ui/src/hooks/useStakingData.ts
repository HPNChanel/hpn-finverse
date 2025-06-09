import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BrowserProvider, JsonRpcSigner, Contract, formatEther } from 'ethers';
import { useWallet } from './useWallet';
import { getTokenAddress, getStakeVaultAddress } from '@/utils/contractLoader';
import { stakingApi } from '@/lib/api';
import { extractErrorMessage } from '@/utils/errorHelpers';

// Add proper type definitions
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Add missing type definitions
interface ContractStakePosition {
  stakeIndex: number;
  amount: string;
  amountFormatted: string;
  timestamp: number;
  startDate: Date;
  claimed: boolean;
  reward: string;
  rewardFormatted: string;
  canUnstake: boolean;
  apy: number;
  lockPeriod: number;
  lockPeriodDays: number;
  daysRemaining: number;
  isUnlocked: boolean;
  txHash?: string;
  blockNumber?: number;
  syncedToBackend?: boolean;
  tokenAddress?: string;
  tokenSymbol?: string;
  isNativeToken?: boolean;
}

interface ContractStakingSummary {
  userAddress: string;
  totalStaked: string;
  totalStakedFormatted: string;
  stakeCount: number;
  positions: ContractStakePosition[];
  totalRewards: string;
  totalRewardsFormatted: string;
  totalClaimable: string;
  totalClaimableFormatted: string;
  lastUpdated: number;
}

interface StakePool {
  id: string;
  name: string;
  apy: number;
  lockPeriodDays: number;
  minStake: number;
  maxStake?: number;
  description: string;
  isActive: boolean;
  tokenAddress?: string;
  tokenSymbol?: string;
  rewardTokenSymbol?: string;
}

interface RewardHistory {
  id: number;
  amount: number;
  claimed_at: string;
  stake_id: number;
}

interface TokenBalances {
  fvtBalance: string | undefined;
  stakedBalance: string | undefined;
  ethBalance: string | undefined;
  allowance: string | undefined;
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
  pools: StakePool[];
  stakes: ContractStakePosition[];
  contractSummary: ContractStakingSummary | null;
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
  clearError: () => void;
  
  // Blockchain functions
  getAllowance: () => Promise<string>;
  approveTokens: (amount: string) => Promise<void>;
  stakeTokens: (amount: string) => Promise<void>;
  stakeTokensWithPool: (amount: string, poolId: number) => Promise<void>;
}

// Contract ABIs
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

const STAKE_VAULT_ABI = [
  'function getTotalStaked(address user) view returns (uint256)',
  'function getUserStakeCount(address user) view returns (uint256)',
  'function getUserStake(address user, uint256 stakeIndex) view returns (tuple(uint256 amount, uint256 timestamp, bool claimed, address tokenAddress, uint256 poolId))',
  'function getPendingReward(address user, uint256 stakeIndex) view returns (uint256)',
  'function canUnstake(address user, uint256 stakeIndex) view returns (bool)',
  'function totalStakedAmount() view returns (uint256)',
  'function APY_PERCENTAGE() view returns (uint256)',
  'function LOCK_PERIOD() view returns (uint256)'
];

// Add call tracking for debugging infinite loops
let loadPoolsCallCount = 0;
let setPoolsCallCount = 0;
let effectRunCount = 0;

export const useStakingData = (): UseStakingDataReturn => {
  // Get wallet state
  const { 
    isConnected, 
    accountAddress, 
    isCorrectNetwork 
  } = useWallet();

  // State management
  const [pools, setPools] = useState<StakePool[]>([]);
  const [stakes, setStakes] = useState<ContractStakePosition[]>([]);
  const [contractSummary] = useState<ContractStakingSummary | null>(null);
  const [rewards] = useState<RewardHistory[]>([]);
  const [claimableRewards] = useState<number>(0);
  const [tokenBalances] = useState<TokenBalances | null>(null);
  const [globalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web3 state
  const [provider] = useState<BrowserProvider | null>(null);
  const [signer] = useState<JsonRpcSigner | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [web3Ready, setWeb3Ready] = useState(false);
  
  // Add request state tracking
  const [isRequesting] = useState(false);
  
  // One-time initialization and fetching flags
  const initializationLoggedRef = useRef(false);
  const providerWarningLoggedRef = useRef(false);
  
  // Add additional guards to prevent concurrent operations
  const isRequestingAccountsRef = useRef(false);
  const isInitializingRef = useRef(false);
  const alreadyInitializedRef = useRef(false);

  // Add refs to track previous values for comparison
  const prevPoolsRef = useRef<StakePool[]>([]);
  const prevStakesRef = useRef<ContractStakePosition[]>([]);
  const isInitializedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Web3 initialization with proper request state management
  const initializeWeb3 = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      console.log('⏳ Web3 initialization already in progress, waiting...');
      return false;
    }

    // Skip if already successfully initialized
    if (alreadyInitializedRef.current && web3Ready && userAddress) {
      console.log('✅ Web3 already initialized, skipping...');
      return true;
    }

    // Prevent multiple simultaneous requests
    if (isRequestingAccountsRef.current) {
      console.log('⏳ Account request already in progress, waiting...');
      return false;
    }

    try {
      isInitializingRef.current = true;
      
      // Check if window.ethereum is available
      if (typeof window === 'undefined' || !window.ethereum) {
        if (!providerWarningLoggedRef.current) {
          console.warn('⚠️ MetaMask not detected. Web3 functionality will be limited.');
          providerWarningLoggedRef.current = true;
        }
        return false;
      }

      const ethereum = window.ethereum;
      
      // Request accounts with proper error handling
      const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
      
      if (accounts && accounts.length > 0) {
        setUserAddress(accounts[0]);
        setWeb3Ready(true);
        alreadyInitializedRef.current = true;
        return true;
      }

      return false;
    } catch (error: unknown) {
      console.error('Web3 initialization failed:', error);
      setError(error instanceof Error ? error.message : 'Web3 initialization failed');
      return false;
    } finally {
      isInitializingRef.current = false;
    }
  }, [web3Ready, userAddress]);

  // Enhanced Web3 readiness check
  const isWeb3Ready = useMemo(() => {
    const ready = !!(
      accountAddress && 
      accountAddress !== '0x' && 
      isConnected && 
      isCorrectNetwork &&
      !isRequesting
    );
    
    if (!ready) {
      console.log('🔍 Web3 not ready:', {
        accountAddress: !!accountAddress,
        isConnected,
        isCorrectNetwork,
        isRequesting
      });
    }
    
    return ready;
  }, [accountAddress, isConnected, isCorrectNetwork, isRequesting]);

  // Safe state comparison function
  const isPoolsEqual = useCallback((newPools: StakePool[], currentPools: StakePool[]): boolean => {
    if (newPools.length !== currentPools.length) {
      return false;
    }
    
    return newPools.every((newPool, index) => {
      const currentPool = currentPools[index];
      return (
        newPool.id === currentPool.id &&
        newPool.name === currentPool.name &&
        newPool.apy === currentPool.apy &&
        newPool.isActive === currentPool.isActive
      );
    });
  }, []);

  // Fallback pools function
  const getFallbackPools = useCallback((): StakePool[] => {
    console.log('📋 Using fallback pools');
    return [
      {
        id: '0',
        name: 'ETH Flexible Pool',
        apy: 8,
        lockPeriodDays: 0,
        minStake: 0.01,
        maxStake: 100.0,
        description: 'Stake ETH with no lock period',
        isActive: true,
        tokenSymbol: 'ETH',
        rewardTokenSymbol: 'FVT'
      },
      {
        id: '1',
        name: 'FVT Standard Pool',
        apy: 10,
        lockPeriodDays: 30,
        minStake: 1.0,
        maxStake: 10000.0,
        description: 'Stake FVT tokens with 30-day lock period',
        isActive: true,
        tokenSymbol: 'FVT',
        rewardTokenSymbol: 'FVT'
      }
    ];
  }, []);

  // Enhanced transformContractPoolsToUIFormat with logging and validation
  const transformContractPoolsToUIFormat = useCallback((contractPools: unknown[]): StakePool[] => {
    console.log('🔄 transformContractPoolsToUIFormat called with:', {
      inputType: Array.isArray(contractPools) ? 'array' : typeof contractPools,
      inputLength: Array.isArray(contractPools) ? contractPools.length : 'N/A',
      inputData: contractPools
    });

    if (!Array.isArray(contractPools)) {
      console.warn('⚠️ Contract pools is not an array:', contractPools);
      return getFallbackPools();
    }

    const transformed = contractPools.map((pool: any, index) => {
      try {
        // Safe pool ID validation and assignment
        let poolId = pool.id;
        
        // Parse and validate pool ID
        const poolIdNumber = poolId !== undefined ? Number(poolId) : NaN;
        const isValidPoolId = Number.isFinite(poolIdNumber) && poolIdNumber >= 0;
        
        if (!isValidPoolId) {
          console.warn(`⚠️ Pool ${index} has invalid ID, using index:`, {
            originalId: pool.id,
            parsedId: poolIdNumber,
            fallbackId: index,
            poolData: pool
          });
          poolId = index;
        } else {
          poolId = poolIdNumber;
        }

        // Normalize numeric fields from strings to numbers
        const minStakeNum = pool.minStake ? Number(pool.minStake) : 0;
        const maxStakeNum = pool.maxStake ? Number(pool.maxStake) : undefined;

        const transformedPool: StakePool = {
          id: String(poolId), // Ensure ID is always a string
          name: pool.name || `Pool ${poolId}`,
          apy: typeof pool.apy === 'number' && Number.isFinite(pool.apy) ? pool.apy : 0,
          lockPeriodDays: typeof pool.lockPeriodDays === 'number' && Number.isFinite(pool.lockPeriodDays) ? pool.lockPeriodDays : 0,
          minStake: Number.isFinite(minStakeNum) && minStakeNum >= 0 ? minStakeNum : 0,
          maxStake: maxStakeNum && Number.isFinite(maxStakeNum) && maxStakeNum > 0 ? maxStakeNum : undefined,
          description: pool.description || `Staking pool with ${pool.apy || 0}% APY`,
          isActive: pool.isActive !== false,
          tokenAddress: pool.tokenAddress,
          tokenSymbol: pool.tokenSymbol || 'FVT',
          rewardTokenSymbol: pool.rewardTokenSymbol || 'FVT'
        };

        // Final validation of the transformed pool
        const finalIdNumber = Number(transformedPool.id);
        if (!Number.isFinite(finalIdNumber) || finalIdNumber < 0) {
          console.error(`❌ Transformed pool still has invalid ID:`, {
            original: pool,
            transformed: transformedPool,
            index
          });
          transformedPool.id = `emergency-fallback-${index}-${Date.now()}`;
        }

        return transformedPool;
      } catch (error) {
        console.error(`❌ Error transforming pool at index ${index}:`, error, pool);
        // Return a safe fallback pool
        return {
          id: `error-fallback-${index}-${Date.now()}`,
          name: `Pool ${index + 1} (Error)`,
          apy: 0,
          lockPeriodDays: 0,
          minStake: 1,
          description: 'Pool data unavailable',
          isActive: false,
          tokenSymbol: 'FVT',
          rewardTokenSymbol: 'FVT'
        };
      }
    });

    // Final validation - ensure all pools have unique, valid IDs
    const seenIds = new Set();
    const finalPools = transformed.map((pool, index) => {
      if (seenIds.has(pool.id)) {
        const newId = `duplicate-fix-${index}-${Date.now()}`;
        console.warn(`⚠️ Duplicate pool ID detected: ${pool.id}, changing to: ${newId}`);
        pool.id = newId;
      }
      seenIds.add(pool.id);
      
      // Final key safety check
      const idNumber = Number(pool.id);
      if (!pool.id || (!Number.isFinite(idNumber) && !pool.id.startsWith('fallback-') && !pool.id.startsWith('emergency-') && !pool.id.startsWith('duplicate-') && !pool.id.startsWith('error-'))) {
        pool.id = `final-safety-${index}-${Date.now()}`;
        console.warn(`⚠️ Final safety: Invalid pool ID fixed to ${pool.id}`);
      }
      
      return pool;
    });

    console.log(`✅ Transformed ${finalPools.length} pools with valid keys:`, 
      finalPools.map((p: StakePool) => ({ 
        id: p.id, 
        name: p.name, 
        idValid: Number.isFinite(Number(p.id)) || p.id.includes('fallback') || p.id.includes('emergency'),
        keyType: Number.isFinite(Number(p.id)) ? 'numeric' : 'fallback'
      }))
    );

    return finalPools;
  }, [getFallbackPools]);

  // Enhanced loadPools with detailed logging and state comparison
  const loadPools = useCallback(async (): Promise<void> => {
    loadPoolsCallCount++;
    const callId = loadPoolsCallCount;
    
    console.log(`🔄 [${callId}] loadPools() called - Total calls: ${loadPoolsCallCount}`);
    console.log(`🔍 [${callId}] Web3 readiness check:`, {
      accountAddress: !!accountAddress,
      isConnected,
      isCorrectNetwork,
      isWeb3Ready
    });

    // Prevent duplicate calls
    if (loadingPromiseRef.current) {
      console.log(`⏸️ [${callId}] loadPools() already in progress, skipping`);
      return loadingPromiseRef.current;
    }

    // Web3 readiness check
    if (!isWeb3Ready) {
      console.log(`❌ [${callId}] Web3 not ready, skipping loadPools`);
      return;
    }

    // Create loading promise to prevent concurrent calls
    const loadingPromise = (async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`📡 [${callId}] Fetching pools from API...`);
        const response = await stakingApi.getStakingPools();
        
        if (!response?.pools) {
          throw new Error('Invalid pools response structure');
        }

        const newPools = transformContractPoolsToUIFormat(response.pools);
        console.log(`✅ [${callId}] Received ${newPools.length} pools from API`);
        
        // State comparison before setting
        const currentPools = prevPoolsRef.current;
        const poolsChanged = !isPoolsEqual(newPools, currentPools);
        
        console.log(`🔍 [${callId}] Pools comparison:`, {
          newPoolsLength: newPools.length,
          currentPoolsLength: currentPools.length,
          poolsChanged,
          newPoolIds: newPools.map((p: StakePool) => p.id),
          currentPoolIds: currentPools.map((p: StakePool) => p.id)
        });

        if (poolsChanged) {
          setPoolsCallCount++;
          console.log(`🔄 [${setPoolsCallCount}] setPools() called - Pools changed, updating state`);
          
          setPools(newPools);
          prevPoolsRef.current = newPools;
          
          console.log(`✅ [${callId}] Pools state updated successfully`);
        } else {
          console.log(`⏭️ [${callId}] Pools unchanged, skipping state update`);
        }

      } catch (err: any) {
        const errorMessage = extractErrorMessage(err);
        console.error(`❌ [${callId}] loadPools() failed:`, errorMessage);
        setError(errorMessage);
        
        // Set fallback pools on error if none exist
        if (prevPoolsRef.current.length === 0) {
          console.log(`🔄 [${callId}] Setting fallback pools due to error`);
          const fallbackPools = getFallbackPools();
          setPools(fallbackPools);
          prevPoolsRef.current = fallbackPools;
        }
      } finally {
        setIsLoading(false);
        loadingPromiseRef.current = null;
        console.log(`🏁 [${callId}] loadPools() completed`);
      }
    })();

    loadingPromiseRef.current = loadingPromise;
    return loadingPromise;
  }, [
    accountAddress, 
    isConnected, 
    isCorrectNetwork, 
    isWeb3Ready,
    transformContractPoolsToUIFormat,
    isPoolsEqual,
    getFallbackPools
  ]);

  // Enhanced main effect with detailed logging and proper dependencies
  useEffect(() => {
    effectRunCount++;
    const effectId = effectRunCount;
    
    console.log(`🔄 [Effect ${effectId}] Main useStakingData effect running`);
    console.log(`🔍 [Effect ${effectId}] Dependencies:`, {
      isWeb3Ready,
      isInitialized: isInitializedRef.current,
      poolsLength: pools.length,
      accountAddress: !!accountAddress,
      effectRunCount
    });

    // Only run if Web3 is ready and we haven't initialized yet
    if (!isWeb3Ready) {
      console.log(`⏸️ [Effect ${effectId}] Web3 not ready, skipping effect`);
      return;
    }

    // Prevent re-initialization
    if (isInitializedRef.current && pools.length > 0) {
      console.log(`⏭️ [Effect ${effectId}] Already initialized with ${pools.length} pools, skipping`);
      return;
    }

    console.log(`🚀 [Effect ${effectId}] Initializing staking data...`);
    
    const initializeData = async () => {
      try {
        await loadPools();
        isInitializedRef.current = true;
        console.log(`✅ [Effect ${effectId}] Staking data initialized successfully`);
      } catch (error) {
        console.error(`❌ [Effect ${effectId}] Failed to initialize staking data:`, error);
      }
    };

    initializeData();
  }, [isWeb3Ready, loadPools, accountAddress, pools.length]);

  // Separate effect for optional refresh on visibility change instead of aggressive polling
  useEffect(() => {
    if (!isWeb3Ready || !isInitializedRef.current) {
      return;
    }

    console.log('⏰ Setting up optional refresh on visibility change...');
    
    const handleVisibilityChange = () => {
      // Only refresh when user returns to the tab after being away
      if (!document.hidden) {
        console.log('🔄 User returned to tab, refreshing staking data');
        loadPools().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🛑 Clearing visibility change listener');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isWeb3Ready, loadPools]);

  // Enhanced refreshData with loading state management
  const refreshData = useCallback(async () => {
    console.log('🔄 refreshData() called manually');
    
    if (!isWeb3Ready) {
      console.log('❌ refreshData(): Web3 not ready');
      return;
    }

    try {
      await loadPools();
      console.log('✅ refreshData() completed successfully');
    } catch (error) {
      console.error('❌ refreshData() failed:', error);
      setError(extractErrorMessage(error));
    }
  }, [isWeb3Ready, loadPools]);

  // Reset function for debugging
  const resetData = useCallback(() => {
    console.log('🔄 Resetting staking data...');
    isInitializedRef.current = false;
    prevPoolsRef.current = [];
    prevStakesRef.current = [];
    loadingPromiseRef.current = null;
    setPools([]);
    setStakes([]);
    setError(null);
    console.log('✅ Staking data reset complete');
  }, []);

  // Blockchain functions
  const getAllowance = useCallback(async (): Promise<string> => {
    if (!isConnected || !accountAddress || !userAddress) {
      return '0';
    }

    try {
      const tokenAddress = await getTokenAddress();
      const vaultAddress = await getStakeVaultAddress();
      
      if (!provider || !signer) {
        return '0';
      }

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(userAddress, vaultAddress);
      return formatEther(allowance);
    } catch (error) {
      console.error('Failed to get allowance:', error);
      return '0';
    }
  }, [isConnected, accountAddress, userAddress, provider, signer]);

  const approveTokens = useCallback(async (amount: string) => {
    if (!isConnected || !accountAddress) {
      throw new Error('Wallet not connected');
    }
    console.log('Approving tokens:', amount);
  }, [isConnected, accountAddress]);

  const stakeTokens = useCallback(async (amount: string) => {
    if (!isConnected || !accountAddress) {
      throw new Error('Wallet not connected');
    }
    console.log('Staking tokens:', amount);
  }, [isConnected, accountAddress]);

  const stakeTokensWithPool = useCallback(async (amount: string, poolId: number) => {
    if (!isConnected || !accountAddress) {
      throw new Error('Wallet not connected');
    }
    console.log('Staking tokens with pool:', amount, poolId);
  }, [isConnected, accountAddress]);

  return {
    // Data
    pools,
    stakes,
    contractSummary,
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
    clearError,

    // Functions
    getAllowance,
    approveTokens,
    stakeTokens,
    stakeTokensWithPool
  };
};

