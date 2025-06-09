export interface ContractInfo {
  timestamp: string;
  network: string;
  contracts: {
    StakeVault: {
      address: string;
      description?: string;
      lockPeriod: string;
      defaultPools?: Array<{
        id: number;
        name: string;
        apy: string;
      }>;
    };
    RewardDistributor?: {
      address: string;
      description?: string;
    };
  };
  deployer: string;
  testUser?: string;
  testAccounts?: {
    deployer: {
      address: string;
      privateKey: string;
    };
    testUser: {
      address: string;
      privateKey: string;
    };
  };
}

export interface StakeInfo {
  amount: bigint;
  timestamp: bigint;
  claimed: boolean;
}

export interface LockDurationOption {
  label: string;
  value: number; // in seconds
  days: number;
}

export interface StakingPoolOption {
  id: number;
  name: string;
  apy: number;
  lockPeriodDays: number;
  lockPeriodSeconds: number;
  minStake: string;
  maxStake?: string;
  description: string;
  isActive: boolean;
}

export interface ContractStakingStats {
  totalStaked: string;
  apy: number;
  lockPeriodSeconds: number;
  lockPeriodDays: number;
  totalStakers?: number;
}

export interface TokenBalanceInfo {
  fvtBalance: string;
  fvtBalanceFormatted: string;
  stakedBalance: string;
  stakedBalanceFormatted: string;
  ethBalance: string;
  ethBalanceFormatted: string;
  allowance: string;
  allowanceFormatted: string;
  lastUpdated: number;
}

// Blockchain staking event data
export interface StakedEventData {
  user: string;
  amount: string;
  timestamp: number;
  stakeIndex: number;
  txHash: string;
  poolId?: string;
  lockPeriod?: number;
  blockNumber?: number; // Add block number for tracking
  tokenAddress?: string; // Add token address support
}

// Contract stake position data - Updated for ETH-only
export interface ContractStakePosition {
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
  txHash?: string; // Add transaction hash
  blockNumber?: number; // Add block number
  syncedToBackend?: boolean; // Track if synced to backend
  tokenAddress?: string; // Add token address support
  tokenSymbol?: string; // Add token symbol for display
  isNativeToken?: boolean; // Track if this is ETH or ERC20
  pendingReward?: string; // Required for compatibility
  isActive?: boolean; // Required for compatibility
}

// Add interface for transaction verification
export interface StakeTransactionVerification {
  txHash: string;
  walletAddress: string;
  verified: boolean;
  blockNumber?: number;
  stakeIndex?: number;
  amount?: string;
  timestamp?: number;
}

// User staking summary from contract - Updated for ETH-only
export interface ContractStakingSummary {
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
  activeStakeCount?: number; // Required for compatibility
  canClaimAny?: boolean; // Required for compatibility
}

export interface CreateTransactionRequest {
  amount: number;
  transaction_type: number; // 0 = income, 1 = expense
  wallet_id: number;
  category_id?: number;
  description?: string;
  transaction_date: string;
}

export interface UpdateTransactionRequest {
  amount?: number;
  transaction_type?: number; // 0 = income, 1 = expense
  wallet_id?: number;
  category_id?: number;
  description?: string;
  transaction_date?: string;
}

export interface TransactionFilters {
  transaction_type?: number;
  wallet_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

// Add new interfaces for forms
export interface StakeFormData {
  poolId: string;
  amount: string;
  lockPeriod: number;
  tokenAddress?: string;
}

export interface SendTokenFormData {
  token: 'ETH'; // ETH-only staking
  recipient: string;
  amount: string;
  gasEstimate?: string;
}

// Enhanced transaction result interface
export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
  tokenAddress?: string;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
}

// Form validation interfaces
export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface GasEstimation {
  gasLimit: string;
  gasPrice: string;
  estimatedCost: string;
  estimatedCostUSD?: string;
}

// Enhanced staking pool configuration
export interface StakingPoolConfig {
  pools: StakePool[];
  supportedTokens: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    isSupported: boolean;
    minStake: string;
    maxStake?: string;
    icon?: string;
  }[];
  lockDurationOptions: {
    label: string;
    days: number;
    bonusApy: number;
    multiplier: number;
  }[];
}

// UI State interfaces
export interface StakingUIState {
  activeTab: 'stake' | 'send' | 'portfolio' | 'history' | 'analytics';
  showAdvancedOptions: boolean;
  selectedPool: string;
  selectedToken: string;
  isFormValid: boolean;
  txInProgress: boolean;
}

// Main StakingPool interface used across components
export interface StakingPool {
  id: string | number;
  name: string;
  description: string;
  apy: number;
  lockPeriodDays?: number;
  lock_period?: number; // Backend compatibility
  minStake?: string | number;
  min_stake?: number; // Backend compatibility
  maxStake?: string | number;
  max_stake?: number; // Backend compatibility
  isActive: boolean;
  is_active?: boolean; // Backend compatibility
  totalStaked?: string | number;
  total_staked?: number; // Backend compatibility
  participants?: number;
  bonusApy?: number;
}

// Alternative pool interface for compatibility
export interface StakePool {
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
  token_address?: string;
  tokenAddress?: string;
  contractAddress?: string;
  token_symbol?: string;
}

// Staking history and positions
export interface StakePosition {
  id: string | number;
  stakeId?: string | number; // Legacy compatibility
  stakeIndex?: number;
  amount: string | number;
  amountStaked?: string | number;
  poolId?: string | number;
  stakedAt: Date | string;
  timestamp?: Date | number;
  unlockAt?: Date | string;
  lockPeriod?: number;
  isActive: boolean;
  status?: string;
  accumulatedRewards?: string | number;
  rewardsEarned?: string | number;
  pendingReward?: string | number;
  claimableRewards?: string | number;
  isUnlocked?: boolean;
  canUnstake?: boolean;
  daysRemaining?: number;
  apy?: number;
  rewardRate?: number;
  contractAPY?: string | number;
  txHash?: string;
  modelConfidence?: number;
  aiTag?: string;
  predictedReward?: string | number;
}

// Note: ContractStakePosition and ContractStakingSummary interfaces defined above

// Financial account interface
export interface FinancialAccount {
  id: number | string;
  name: string;
  balance: number;
  type: string;
  currency?: string;
}

// Staking events
export interface StakingEvent {
  transactionHash: string;
  user: string;
  amount: string;
  timestamp: number;
  stakeIndex: number;
  blockNumber: number;
}
