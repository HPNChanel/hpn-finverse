export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  created_at: string;
  icon?: string;
  color?: string;
  created_by_default?: boolean;
  note?: string;
  currency: string;
}

export interface FinancialGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority: number; // 1=low, 2=medium, 3=high
  status: number; // 1=ongoing, 2=completed, 3=cancelled
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface InternalTransaction {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  timestamp: string;
  note?: string;
}

export interface BudgetPlan {
  id: number;
  account_id: number;
  category: string;
  limit_amount: number;
  spent_amount: number;
  status: string;
  created_at: string;
}

export interface AccountListResponse {
  accounts: Account[];
}

export interface TransactionListResponse {
  transactions: InternalTransaction[];
}

export interface BudgetPlanListResponse {
  budget_plans: BudgetPlan[];
}

export interface StakingAccount {
  id: number;
  user_id: number;
  name: string;
  address: string;
  balance: number;
  created_at: string;
}

export interface StakingReward {
  amount: number;
  apy: number;
  earned: number;
  duration_days: number;
}

// Define StakingProfile type with an id property
export interface StakingProfile {
  id: number;
  // Add other properties based on your application needs
  walletAddress?: string;
  balance?: number;
  stakingAmount?: number;
  rewardsEarned?: number;
  stakingStartDate?: string;
}

// Define ProfileResponse type
export interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  // Add other properties as needed
}

// Define ProfileUpdateRequest type
export interface ProfileUpdateRequest {
  username?: string;
  email?: string;
  // Add other properties as needed
}

// Define StakeStatus type
export type StakeStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'COMPLETED';

// Define AccountSummary type with fetchSummary method
export interface AccountSummary {
  wallet: number;
  saving: number;
  investment: number;
  goal: number;
  total: number;
  account_count: number;
  fetchSummary?: () => Promise<void>;
}