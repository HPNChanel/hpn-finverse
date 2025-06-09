import { ContractInfo, ContractStakingSummary, ContractStakePosition } from '@/types/contracts';
import { Contract, formatEther, formatUnits } from 'ethers';
import axios from 'axios';
import { getStakeVaultAddress } from '@/utils/contractLoader';

// Import web3Provider from the correct location
export { web3Provider } from './web3Provider';

// DEPRECATED: ERC20 ABI is no longer used for ETH-only staking
// Keeping minimal version for potential future token support
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;

// Complete ABI for StakeVault contract
export const STAKE_VAULT_ABI = [
  // Staking functions
  "function stake(uint256 amount)",
  "function stakeToPool(uint256 poolId, uint256 amount) payable",
  "function unstake(uint256 stakeIndex)",
  "function claim(uint256 stakeIndex)",

  // View functions - User stakes (FIXED: Remove problematic getUserStakes)
  "function getUserStake(address user, uint256 stakeIndex) view returns (tuple(uint256 amount, uint256 timestamp, bool claimed, address tokenAddress, uint256 poolId))",
  "function getUserStakeCount(address user) view returns (uint256)",
  "function getUserStakeIds(address user) view returns (uint256[])",
  "function getUserStakesDetails(address user, uint256[] stakeIndexes) view returns (uint256[] amounts, uint256[] timestamps, bool[] claimed, uint256[] rewards, bool[] canUnstakeStatus)",

  // View functions - Rewards and validation
  "function getPendingReward(address user, uint256 stakeIndex) view returns (uint256)",
  "function canUnstake(address user, uint256 stakeIndex) view returns (bool)",
  "function calculateReward(uint256 amount, uint256 stakeTimestamp) view returns (uint256)",
  "function calculateReward(uint256 amount, uint256 stakeTimestamp, uint256 apy) view returns (uint256)",

  // View functions - Totals and stats
  "function getTotalStaked(address user) view returns (uint256)",
  "function totalStakedAmount() view returns (uint256)",
  "function totalStaked(address user, address token) view returns (uint256)",
  "function totalStakedByToken(address token) view returns (uint256)",

  // View functions - Pool information
  "function stakingPools(uint256 poolId) view returns (tuple(address tokenAddress, uint256 minStake, uint256 maxStake, uint256 apy, bool isActive, string name))",
  "function poolCount() view returns (uint256)",

  // View functions - Constants
  "function LOCK_PERIOD() view returns (uint256)",
  "function APY_PERCENTAGE() view returns (uint256)",
  "function stakingToken() view returns (address)",

  // Admin functions
  "function createPool(address tokenAddress, uint256 minStake, uint256 maxStake, uint256 apy, bool isActive, string name) returns (uint256)",
  "function depositRewards(address tokenAddress, uint256 amount) payable",
  "function depositRewards(uint256 amount)",
  "function emergencyWithdraw(address tokenAddress, uint256 amount)",

  // Events
  "event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 stakeIndex, uint256 poolId, address tokenAddress)",
  "event Claimed(address indexed user, uint256 reward, uint256 stakeIndex, address tokenAddress)",
  "event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 stakeIndex, address tokenAddress)",
  "event PoolCreated(uint256 indexed poolId, address indexed tokenAddress, string name, uint256 apy)"
] as const;

// DEPRECATED: Token address loading for ETH-only staking
// Address loading handled dynamically through contractLoader

// Supported Token Addresses - Updated for ETH-only
export const SUPPORTED_TOKENS = {
  ETH: "0x0000000000000000000000000000000000000000" // Special address for native ETH
} as const;

// Token metadata - ETH only
export const TOKEN_METADATA = {
  [SUPPORTED_TOKENS.ETH]: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    isNative: true,
    icon: "/icons/eth.png"
  }
} as const;

// Fallback contract addresses - Updated for ETH-only staking
export const FALLBACK_CONTRACTS = {
  StakeVault: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    description: "ETH-only staking contract with multiple pools",
    lockPeriod: "2592000", // 30 days in seconds
    defaultPools: [
      {
        id: 0,
        name: "ETH Flexible Pool",
        apy: "8"
      },
      {
        id: 1,
        name: "ETH Premium Pool", 
        apy: "12"
      }
    ]
  }
};

// Load contract info from public/contracts/contracts.json
export const loadContractInfo = async (): Promise<ContractInfo | null> => {
  try {
    const response = await axios.get('/contracts/contracts.json');
    return response.data;
  } catch (error) {
    console.warn('Failed to load contract info from /contracts/contracts.json:', error);
    return null;
  }
};

// Enhanced contract interaction with comprehensive error handling
export const loadUserStakesFromContract = async (userAddress: string): Promise<ContractStakingSummary> => {
  try {
    console.log('🔗 Loading user stakes from contract for:', userAddress);
    
    // Get provider from web3Provider
    const { web3Provider } = await import('./web3Provider');
    const provider = web3Provider.getProvider();
    
    if (!provider) {
      throw new Error('Web3 provider not available');
    }

    // Load contract info
    let contractInfo;
    try {
      contractInfo = await loadContractInfo();
    } catch (loadError) {
      console.warn('Using fallback contract addresses');
      contractInfo = { contracts: FALLBACK_CONTRACTS };
    }

    if (!contractInfo?.contracts?.StakeVault?.address) {
      throw new Error('StakeVault contract address not found');
    }

    const vaultContract = new Contract(
      contractInfo.contracts.StakeVault.address,
      STAKE_VAULT_ABI,
      provider
    );

    // Get user stake count
    const stakeCount = await vaultContract.getUserStakeCount(userAddress);
    const stakeCountNum = Number(stakeCount);

    if (stakeCountNum === 0) {
      return {
        userAddress,
        totalStaked: '0',
        totalStakedFormatted: '0',
        stakeCount: 0,
        positions: [],
        totalRewards: '0',
        totalRewardsFormatted: '0',
        totalClaimable: '0',
        totalClaimableFormatted: '0',
        lastUpdated: Date.now(),
        activeStakeCount: 0,
        canClaimAny: false
      };
    }

    // Get all stake IDs
    const stakeIds = await vaultContract.getUserStakeIds(userAddress);
    
    const positions: ContractStakePosition[] = [];
    let totalStaked = 0;
    let totalRewards = 0;
    let totalClaimable = 0;

    // Process each stake
    for (let i = 0; i < stakeCountNum; i++) {
      try {
        const stakeId = Number(stakeIds[i]);
        const stakeInfo = await vaultContract.getUserStake(userAddress, stakeId);
        const pendingReward = await vaultContract.getPendingReward(userAddress, stakeId);
        const canUnstake = await vaultContract.canUnstake(userAddress, stakeId);

        const amount = stakeInfo[0];
        const timestamp = Number(stakeInfo[1]);
        const claimed = stakeInfo[2];
        const poolId = Number(stakeInfo[4]);

        const amountFormatted = formatEther(amount);
        const rewardFormatted = formatEther(pendingReward);

        const position: ContractStakePosition = {
          stakeIndex: stakeId,
          amount: amount.toString(),
          amountFormatted,
          timestamp,
          startDate: new Date(timestamp * 1000),
          claimed,
          reward: pendingReward.toString(),
          rewardFormatted,
          canUnstake,
          apy: 10, // Default APY - should be fetched from pool info
          lockPeriod: 30 * 24 * 60 * 60, // 30 days in seconds
          lockPeriodDays: 30,
          daysRemaining: Math.max(0, 30 - Math.floor((Date.now() - timestamp * 1000) / (1000 * 60 * 60 * 24))),
          isUnlocked: canUnstake,
          tokenAddress: SUPPORTED_TOKENS.ETH,
          tokenSymbol: 'ETH',
          isNativeToken: true,
          pendingReward: rewardFormatted,
          isActive: !claimed
        };

        positions.push(position);
        totalStaked += parseFloat(amountFormatted);
        totalRewards += parseFloat(rewardFormatted);
        
        if (canUnstake && !claimed) {
          totalClaimable += parseFloat(rewardFormatted);
        }
      } catch (stakeError) {
        console.error(`Error processing stake ${i}:`, stakeError);
      }
    }

    return {
      userAddress,
      totalStaked: totalStaked.toString(),
      totalStakedFormatted: totalStaked.toFixed(6),
      stakeCount: positions.length,
      positions,
      totalRewards: totalRewards.toString(),
      totalRewardsFormatted: totalRewards.toFixed(6),
      totalClaimable: totalClaimable.toString(),
      totalClaimableFormatted: totalClaimable.toFixed(6),
      lastUpdated: Date.now(),
      activeStakeCount: positions.filter(p => p.isActive).length,
      canClaimAny: totalClaimable > 0
    };

  } catch (error) {
    console.error('❌ Error loading user stakes from contract:', error);
    
    // Return empty summary on error
    return {
      userAddress,
      totalStaked: '0',
      totalStakedFormatted: '0',
      stakeCount: 0,
      positions: [],
      totalRewards: '0',
      totalRewardsFormatted: '0',
      totalClaimable: '0',
      totalClaimableFormatted: '0',
      lastUpdated: Date.now(),
      activeStakeCount: 0,
      canClaimAny: false
    };
  }
};

// Utility functions for ETH formatting
export const formatTokenAmount = (amount: string | number | bigint, decimals: number = 18): string => {
  try {
    if (typeof amount === 'bigint') {
      return formatUnits(amount, decimals);
    }
    
    if (typeof amount === 'string') {
      return formatUnits(amount, decimals);
    }
    
    return amount.toString();
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};
