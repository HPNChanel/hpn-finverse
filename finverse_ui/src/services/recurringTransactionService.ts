import { AxiosError } from 'axios';
import api from './api';

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

// Service for recurring transactions
export const recurringTransactionService = {
  // Get all recurring transactions for the current user
  getRecurringTransactions: async (): Promise<RecurringTransaction[]> => {
    try {
      const response = await api.get('/api/v1/recurring');
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
      const response = await api.get(`/api/v1/recurring/${id}`);
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
      const response = await api.post('/api/v1/recurring', transaction);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Error creating recurring transaction:', err);
      throw err;
    }
  },

  // Update an existing recurring transaction
  updateRecurringTransaction: async (
    id: number,
    transaction: RecurringTransactionUpdate
  ): Promise<RecurringTransaction> => {
    try {
      const response = await api.put(`/api/v1/recurring/${id}`, transaction);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error updating recurring transaction #${id}:`, err);
      throw err;
    }
  },

  // Delete a recurring transaction
  deleteRecurringTransaction: async (id: number): Promise<boolean> => {
    try {
      const response = await api.delete(`/api/v1/recurring/${id}`);
      return response.data.success;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error deleting recurring transaction #${id}:`, err);
      throw err;
    }
  },

  // Process a recurring transaction (update next occurrence)
  processRecurringTransaction: async (id: number): Promise<RecurringTransaction> => {
    try {
      const response = await api.post(`/api/v1/recurring/${id}/process`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error processing recurring transaction #${id}:`, err);
      throw err;
    }
  }
}; 