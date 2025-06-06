export interface ContractInfo {
  contracts: {
    MockERC20: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
    };
    StakeVault: {
      address: string;
      stakingToken: string;
      lockPeriod: string;
      apy: string;
    };
  };
  timestamp: string;
  network: string;
  deployer?: string;
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

export interface Transaction {
  id: number;
  user_id: number;
  wallet_id: number;
  category_id?: number;
  amount: number;
  transaction_type: number; // 0 = expense, 1 = income
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string | null;
  // UI helper fields
  wallet_name?: string;
  category_name?: string;
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
}

// Contract stake position data
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
}

// User staking summary from contract
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
