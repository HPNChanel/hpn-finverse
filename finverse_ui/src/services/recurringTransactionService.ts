import { AxiosError } from 'axios';
import api from './api';
import { handleErrorResponse } from '../utils/importFixes';

// Types for recurring transactions
export interface RecurringTransaction {
  id: number;
  user_id: number;
  category_id: number;
  wallet_id: number;
  amount: number;
  transaction_type: number; // 0=expense, 1=income
  description?: string;
  frequency_type: number; // 1=daily, 2=weekly, 3=monthly, 4=yearly
  frequency_value: number;
  start_date: string; // ISO format
  end_date?: string; // ISO format
  next_occurrence: string; // ISO format
  is_active: boolean;
  created_at: string; // ISO format
  updated_at: string; // ISO format
}

export interface RecurringTransactionCreate {
  category_id: number;
  wallet_id: number;
  amount: number;
  transaction_type: number;
  description?: string;
  frequency_type: number;
  frequency_value: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export interface RecurringTransactionUpdate {
  category_id?: number;
  wallet_id?: number;
  amount?: number;
  transaction_type?: number;
  description?: string;
  frequency_type?: number;
  frequency_value?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

// Error response interface
interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

// Enum-like interfaces for frequency and transaction types
export const FrequencyType = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  YEARLY: 4,
} as const;

export const TransactionType = {
  EXPENSE: 0,
  INCOME: 1,
} as const;

// Human-readable labels for the frequency types
export const FrequencyTypeLabels = {
  [FrequencyType.DAILY]: 'Daily',
  [FrequencyType.WEEKLY]: 'Weekly',
  [FrequencyType.MONTHLY]: 'Monthly',
  [FrequencyType.YEARLY]: 'Yearly',
};

// Human-readable labels for the transaction types
export const TransactionTypeLabels = {
  [TransactionType.EXPENSE]: 'Expense',
  [TransactionType.INCOME]: 'Income',
};

// Helper function to format frequency value based on type
export const formatFrequency = (type: number, value: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  switch (type) {
    case FrequencyType.DAILY:
      return 'Every day';
    case FrequencyType.WEEKLY:
      return `Every ${days[value]}`;
    case FrequencyType.MONTHLY:
      return `Day ${value} of every month`;
    case FrequencyType.YEARLY: {
      // Convert day of year to date (without year)
      const date = new Date(new Date().getFullYear(), 0, value);
      return `Every ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }
    default:
      return '';
  }
};

// Helper to extract error message from API error
const getErrorDetail = (responseData: unknown): string => {
  if (responseData && typeof responseData === 'object') {
    const errorData = responseData as ApiErrorResponse;
    return errorData.detail || errorData.message || 'Please check your input and try again.';
  }
  return 'Please check your input and try again.';
};

// Service for recurring transactions
export const recurringTransactionService = {
  // Get all recurring transactions for the current user
  getRecurringTransactions: async (): Promise<RecurringTransaction[]> => {
    try {
      const response = await api.get('/recurring');
      return response.data.recurring_transactions;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error fetching recurring transactions:', err);
      throw err;
    }
  },

  // Get a specific recurring transaction by ID
  getRecurringTransaction: async (id: number): Promise<RecurringTransaction> => {
    try {
      const response = await api.get(`/recurring/${id}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error fetching recurring transaction #${id}:`, err);
      throw err;
    }
  },

  // Create a new recurring transaction
  createRecurringTransaction: async (
    transaction: RecurringTransactionCreate
  ): Promise<RecurringTransaction> => {
    try {
      console.log('API Request body:', transaction);
      const response = await api.post('/recurring', transaction);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error creating recurring transaction:', err);
      
      // Handle validation errors (422)
      if (err.response?.status === 422) {
        console.error('Validation error details:', err.response.data);
        throw new Error(`Invalid data: ${getErrorDetail(err.response.data)}`);
      } else if (err.response?.status === 500) {
        throw new Error('Server error occurred while creating recurring transaction. Please try again or contact support.');
      } else if (err.response?.status === 400) {
        throw new Error(`Invalid data: ${getErrorDetail(err.response.data)}`);
      }
      throw err;
    }
  },

  // Update an existing recurring transaction
  updateRecurringTransaction: async (
    id: number,
    transaction: RecurringTransactionUpdate
  ): Promise<RecurringTransaction> => {
    try {
      const response = await api.put(`/recurring/${id}`, transaction);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error updating recurring transaction #${id}:`, err);
      // Add better error handling with user-friendly messages
      if (err.response?.status === 500) {
        throw new Error('Server error occurred while updating recurring transaction. Please try again or contact support.');
      } else if (err.response?.status === 400) {
        throw new Error(`Invalid data: ${getErrorDetail(err.response.data)}`);
      } else if (err.response?.status === 404) {
        throw new Error('Transaction not found. It may have been deleted.');
      }
      throw err;
    }
  },

  // Delete a recurring transaction
  deleteRecurringTransaction: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete(`/recurring/${id}`);
      return response.data.success;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error deleting recurring transaction #${id}:`, err);
      // Add better error handling with user-friendly messages
      if (err.response?.status === 500) {
        throw new Error('Server error occurred while deleting recurring transaction. Please try again or contact support.');
      } else if (err.response?.status === 404) {
        throw new Error('Transaction not found. It may have been deleted already.');
      }
      throw err;
    }
  },

  // Process a recurring transaction (update next occurrence)
  processRecurringTransaction: async (id: number): Promise<RecurringTransaction> => {
    try {
      const response = await api.post(`/recurring/${id}/process`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error processing recurring transaction #${id}:`, err);
      // Add better error handling with user-friendly messages
      if (err.response?.status === 500) {
        throw new Error('Server error occurred while processing recurring transaction. Please try again or contact support.');
      } else if (err.response?.status === 404) {
        throw new Error('Transaction not found. It may have been deleted.');
      }
      throw err;
    }
  }
};