import { ContractInfo } from '@/types/contracts';
import { ethers } from 'ethers';
import axios from 'axios';

// ERC20 ABI (minimal required functions)
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Supported Token Addresses
export const SUPPORTED_TOKENS = {
  FVT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  ETH: "0x0000000000000000000000000000000000000000" // Placeholder for ETH
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  FVT: {
    name: "FinVerse Token",
    symbol: "FVT",
    decimals: 18,
    isSupported: true,
    minStake: 0.01,
    maxStake: 1000000,
    icon: "/icons/fvt.png"
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH", 
    decimals: 18,
    isSupported: false, // Not yet supported
    minStake: 0.001,
    maxStake: 1000,
    icon: "/icons/eth.png"
  }
} as const;

// Validation helper
export const isTokenSupported = (tokenAddress: string): boolean => {
  const normalizedAddress = tokenAddress.toLowerCase();
  return Object.values(SUPPORTED_TOKENS).some(
    addr => addr.toLowerCase() === normalizedAddress
  ) && TOKEN_CONFIG.FVT.isSupported; // Only FVT is supported for now
};

// Get token info by address
export const getTokenByAddress = (tokenAddress: string) => {
  const normalizedAddress = tokenAddress.toLowerCase();
  
  if (normalizedAddress === SUPPORTED_TOKENS.FVT.toLowerCase()) {
    return { address: SUPPORTED_TOKENS.FVT, ...TOKEN_CONFIG.FVT };
  }
  
  if (normalizedAddress === SUPPORTED_TOKENS.ETH.toLowerCase()) {
    return { address: SUPPORTED_TOKENS.ETH, ...TOKEN_CONFIG.ETH };
  }
  
  return null;
};

// Contract ABIs for StakeVault and MockERC20
export const STAKE_VAULT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_stakingToken",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "APY_PERCENTAGE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LOCK_PERIOD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stakeTimestamp",
        "type": "uint256"
      }
    ],
    "name": "calculateReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "canUnstake",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "getPendingReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "getUserStake",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "claimed",
            "type": "bool"
          }
        ],
        "internalType": "struct StakeVault.Stake",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserStakeCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakingToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "totalStaked",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserStakeIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256[]",
        "name": "stakeIndexes",
        "type": "uint256[]"
      }
    ],
    "name": "getUserStakesDetails",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "timestamps",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "claimed",
        "type": "bool[]"
      },
      {
        "internalType": "uint256[]",
        "name": "rewards",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "canUnstakeStatus",
        "type": "bool[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "Unstaked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stakeIndex",
        "type": "uint256"
      }
    ],
    "name": "Claimed",
    "type": "event"
  }
] as const;

// Add fallback contracts and missing functions
export const FALLBACK_CONTRACTS = {
  MockERC20: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    name: "FinVerse Token",
    symbol: "FVT",
    decimals: 18
  },
  StakeVault: {
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    stakingToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    lockPeriod: "2592000",
    apy: "10"
  }
};

// Load contract information from deployed contracts or use fallback
export const loadContractInfo = async (): Promise<ContractInfo | null> => {
  try {
    // Try to load from a contracts.json file or API endpoint
    const response = await fetch('/contracts.json');
    if (response.ok) {
      const contractInfo = await response.json();
      return contractInfo;
    }
  } catch (error) {
    console.warn('Could not load contract info from external source:', error);
  }

  // Return fallback contract info
  return {
    contracts: FALLBACK_CONTRACTS,
    timestamp: new Date().toISOString(),
    network: 'hardhat-local',
    deployer: 'fallback'
  };
};

// Utility function to load staking positions directly from contract
export const loadUserStakesFromContract = async (userAddress: string): Promise<ContractStakingSummary> => {
  try {
    if (!window.ethereum || !userAddress) {
      return createEmptyStakingSummary(userAddress);
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractInfo = await loadContractInfo();
    
    if (!contractInfo?.contracts?.StakeVault?.address) {
      console.warn('StakeVault contract address not found, using fallback');
      return createEmptyStakingSummary(userAddress);
    }

    const vaultContract = new ethers.Contract(
      contractInfo.contracts.StakeVault.address,
      STAKE_VAULT_ABI,
      provider
    );

    // Get user's total staked amount and stake count
    const [totalStaked, stakeCount] = await Promise.all([
      vaultContract.totalStaked(userAddress),
      vaultContract.getUserStakeCount(userAddress)
    ]);

    const stakeCountNum = Number(stakeCount);
    
    if (stakeCountNum === 0) {
      return createEmptyStakingSummary(userAddress);
    }

    // Get all stake IDs
    const stakeIds = await vaultContract.getUserStakeIds(userAddress);
    
    // Get detailed information for all stakes in one call
    const [amounts, timestamps, claimed, rewards, canUnstakeStatus] = 
      await vaultContract.getUserStakesDetails(userAddress, stakeIds);

    // Get contract constants
    const [apy, lockPeriod] = await Promise.all([
      vaultContract.APY_PERCENTAGE(),
      vaultContract.LOCK_PERIOD()
    ]);

    const apyNumber = Number(apy);
    const lockPeriodSeconds = Number(lockPeriod);
    const lockPeriodDays = Math.floor(lockPeriodSeconds / (24 * 60 * 60));

    // Process stakes into positions
    const positions: ContractStakePosition[] = [];
    let totalRewardsSum = 0;
    let totalClaimableSum = 0;

    for (let i = 0; i < stakeCountNum; i++) {
      const amount = amounts[i];
      const timestamp = Number(timestamps[i]);
      const reward = rewards[i];
      
      // Skip stakes with 0 amount (withdrawn stakes)
      if (amount === 0n) continue;

      const amountFormatted = ethers.formatEther(amount);
      const rewardFormatted = ethers.formatEther(reward);
      const startDate = new Date(timestamp * 1000);
      
      // Calculate days remaining
      const unlockTime = timestamp + lockPeriodSeconds;
      const currentTime = Math.floor(Date.now() / 1000);
      const daysRemaining = Math.max(0, Math.ceil((unlockTime - currentTime) / (24 * 60 * 60)));
      const isUnlocked = currentTime >= unlockTime;

      const position: ContractStakePosition = {
        stakeIndex: Number(stakeIds[i]),
        amount: amountFormatted,
        amountFormatted: parseFloat(amountFormatted).toFixed(4),
        timestamp,
        startDate,
        claimed: claimed[i],
        reward: rewardFormatted,
        rewardFormatted: parseFloat(rewardFormatted).toFixed(6),
        canUnstake: canUnstakeStatus[i],
        apy: apyNumber,
        lockPeriod: lockPeriodSeconds,
        lockPeriodDays,
        daysRemaining,
        isUnlocked
      };

      positions.push(position);
      
      const rewardAmount = parseFloat(rewardFormatted);
      totalRewardsSum += rewardAmount;
      
      if (!claimed[i] && rewardAmount > 0) {
        totalClaimableSum += rewardAmount;
      }
    }

    return {
      userAddress,
      totalStaked: ethers.formatEther(totalStaked),
      totalStakedFormatted: parseFloat(ethers.formatEther(totalStaked)).toFixed(4),
      stakeCount: positions.length, // Use filtered count
      positions,
      totalRewards: totalRewardsSum.toString(),
      totalRewardsFormatted: totalRewardsSum.toFixed(6),
      totalClaimable: totalClaimableSum.toString(),
      totalClaimableFormatted: totalClaimableSum.toFixed(6),
      lastUpdated: Date.now()
    };

  } catch (error) {
    console.error('Failed to load stakes from contract:', error);
    return createEmptyStakingSummary(userAddress);
  }
};

// Helper function to create empty summary
const createEmptyStakingSummary = (userAddress: string): ContractStakingSummary => ({
  userAddress: userAddress || '',
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
