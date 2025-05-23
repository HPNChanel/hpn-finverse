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
  priority: number;
  status: number;
  progress_percentage: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at?: string;
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
  transaction_type: string;
  category?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
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
  account: {
    id: number;
    name: string;
    address: string;
    balance: number;
  };
  status: {
    total_staked: number;
    locked_until?: string;
  };
  rewards: {
    earned: number;
    last_claim?: string;
  };
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
  label: string;
  to?: string;
  path?: string; // Added path property for PageContainer component
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