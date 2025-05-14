// This file centralizes type imports and helper functions to fix TypeScript errors

// React types
import type { ReactNode, ErrorInfo, FormEvent, ChangeEvent, SyntheticEvent, MouseEvent } from 'react';

// MUI types
import type { SxProps, Theme, PaletteMode } from '@mui/material';
import type { GridProps } from '@mui/material/Grid';
import { Typography as MuiTypography } from '@mui/material';

// Other types
import type { AxiosError } from 'axios';
import axios from 'axios';  // Import axios itself for isAxiosError

// Export AxiosError type directly so it can be imported from here
export type { AxiosError };
export { axios };  // Also export axios for isAxiosError function

// Define missing types for other components
export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  created_at: string;
  icon?: string;
  color?: string;
  created_by_default: boolean;
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

export interface AccountListResponse {
  accounts: Account[];
}

export interface AccountSummary {
  wallet: number;
  saving: number;
  investment: number;
  goal: number;
  total: number;
  account_count: number;
}

export interface BudgetPlan {
  id: number;
  account_id: number;
  category: string;
  limit_amount: number;
  spent_amount: number;
  status: 'active' | 'exceeded';
  created_at: string;
}

export interface BudgetPlanListResponse {
  budget_plans: BudgetPlan[];
}

// Ensure the InternalTransaction interface is properly exported
export interface InternalTransaction {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  timestamp: string;
  note?: string;
}

export interface InternalTransactionListResponse {
  transactions: InternalTransaction[];
}

// StakingProfile type with required fields
export interface StakingProfile {
  account: {
    id: number;
    name: string;
    address: string;
    balance: number;
    created_at: string;
  };
  status: {
    total_staked: number;
    last_updated: string;
  };
  rewards: {
    earned: number;
    apy: number;
    duration_days: number;
  };
}

// Common API error type - enhanced to match backend error responses
export interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string; // Some backends use message instead of detail
    };
    status?: number;
  };
  message?: string;
}

// Helper function to check if an error is an AxiosError
export function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}

// Helper function to extract error message from API error - improved version
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Access error.response?.data safely with optional chaining
    const detail = error.response?.data?.detail || error.response?.data?.message;
    return detail || error.message || 'An unexpected error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// Helper type for Grid items to ensure item prop is properly typed
export type GridItemProps = GridProps & { item: true };

// Re-export Typography to fix the "Cannot find name 'Typography'" errors
export const Typography = MuiTypography;

// Utility function for handling unknown errors
export function handleErrorResponse(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const errorObj = err as { response?: { status?: number, data?: any } };
    if (errorObj.response?.status === 400) {
      return 'Bad request: Please check your input';
    }
    if (errorObj.response?.status === 404) {
      return 'Resource not found';
    }
    if (errorObj.response?.data?.detail) {
      return errorObj.response.data.detail;
    }
  }
  
  if (err instanceof Error) {
    return err.message;
  }
  
  return 'An unexpected error occurred';
}
