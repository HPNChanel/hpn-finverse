// Central type definitions for the FinVerse application

// Account-related types
export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  note?: string;
  created_by_default?: boolean;
}

export interface AccountListResponse {
  accounts: Account[];
  total: number;
}

export interface AccountSummary {
  total: number;
  wallet: number;
  saving: number;
  investment: number;
  goal: number;
  account_count: number;
}

// Financial goal types
export interface FinancialGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority: number; // 1=low, 2=medium, 3=high
  status: number; // 1=ongoing, 2=completed, 3=cancelled
  progress_percentage?: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at?: string;
  user_id?: number;
}

// Add export for goal-related types
export interface CreateGoalRequest {
  name: string;
  target_amount: number;
  current_amount?: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority?: number;
  status?: number;
  icon?: string;
  color?: string;
}

export interface UpdateGoalRequest {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  start_date?: string;
  target_date?: string;
  description?: string;
  priority?: number;
  status?: number;
  icon?: string;
  color?: string;
}

// Transaction-related types
export interface InternalTransaction {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  timestamp: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  account_id?: number;
  from_account_id?: number;
  to_account_id?: number;
  amount: number;
  timestamp?: string;
  transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

// Budget-related types
export interface BudgetPlan {
  id: number;
  user_id: number;
  account_id: number;
  category: string;
  amount: number; // Frontend sometimes uses limit_amount
  spent_amount?: number;
  status?: string;
  period: string; // MONTHLY, WEEKLY, etc.
  created_at: string;
  updated_at: string;
}

export interface BudgetPlanListResponse {
  budget_plans: BudgetPlan[];
}

// Staking-related types
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

export interface StakingProfile {
  id: number;
  validator_address: string;
  validator_name: string;
  staked_amount: number;
  rewards_earned: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// User-related types
export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  name?: string;
  created_at: string;
  updated_at?: string;
}

// Enhanced user type for authenticated user
export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

// Navigation-related types
export interface NavItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
  roles?: string[];
  children?: NavItem[];
  isOpen?: boolean;
  isActive?: boolean;
}

export interface BreadcrumbItem {
  icon?: React.ReactNode;
}

// API error type
export interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}