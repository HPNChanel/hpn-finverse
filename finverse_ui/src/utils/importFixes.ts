// This file centralizes helper functions to fix TypeScript errors

// Other types
import type { AxiosError } from 'axios';
import axios from 'axios';  // Import axios itself for isAxiosError

// Export AxiosError type directly so it can be imported from here
export type { AxiosError };
export { axios };  // Also export axios for isAxiosError function

// Re-export Typography to fix "Cannot find name 'Typography'" errors
import { Typography as MuiTypography } from '@mui/material';
export const Typography = MuiTypography;

// Helper type for Grid items to ensure item prop is properly typed
import type { GridProps } from '@mui/material/Grid';
export type GridItemProps = GridProps & { item: true };

// Re-export types from the types/index.ts file
import type { 
  Account, 
  AccountListResponse, 
  AccountSummary,
  Transaction,
  InternalTransaction,
  TransactionListResponse,
  FinancialGoal,
  StakingProfile
} from '../types';

export type { 
  Account, 
  AccountListResponse, 
  AccountSummary,
  Transaction,
  InternalTransaction,
  TransactionListResponse,
  FinancialGoal,
  StakingProfile
};

// Import AxiosError type for isAxiosError function
import { AxiosError } from 'axios';

// Helper function to check if an error is an AxiosError
export function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}

// Helper function to extract error message from API error - improved version
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Access error.response?.data safely with optional chaining
    // Add explicit type checking to satisfy TypeScript
    const responseData = error.response?.data as { detail?: string; message?: string } | undefined;
    const detail = responseData?.detail || responseData?.message;
    return detail || error.message || 'An unexpected error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// Export handleErrorResponse as an alias for backward compatibility
export const handleErrorResponse = getErrorMessage;

// Chart colors
export const chartColors = {
  primary: '#6366F1',
  secondary: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#F9FAFB',
  paper: '#FFFFFF',
  divider: '#E5E7EB',
};

// Animation variants for consistent motion
export const dashboardAnimations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }
};
