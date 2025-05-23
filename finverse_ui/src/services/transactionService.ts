import api from './api';
import { handleErrorResponse } from '../utils/importFixes';
import type { Transaction, TransactionListResponse } from '../types';

// Types for API requests that match backend expectations
export interface CreateTransactionRequest {
  wallet_id: number;  // Changed from account_id to wallet_id to match backend
  amount: number;
  transaction_type: number;  // Changed from string to number to match backend enum
  description?: string;
  transaction_date: string;  // Changed from timestamp to transaction_date
}

export interface UpdateTransactionRequest {
  account_id?: number;
  amount?: number;
  transaction_type?: string;
  category?: string;
  description?: string;
  timestamp?: string;
}

export interface TransactionFilters {
  page?: number;
  per_page?: number;
  transaction_type?: string;
  category?: string;
  account_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

const transactionService = {
  /**
   * Get all transactions with optional filtering
   */
  getTransactions: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    try {
      // Prepare query parameters
      const params: Record<string, any> = {};
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = value;
          }
        });
      }

      const response = await api.get<TransactionListResponse>('/transactions', { params });
      return response.data.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Get transaction history with filter options
   */
  getTransactionHistory: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    try {
      // Prepare query parameters
      const params: Record<string, any> = {};
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = value;
          }
        });
      }

      const response = await api.get<TransactionListResponse>('/transactions/history', { params });
      return response.data.transactions || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Get a specific transaction by ID
   */
  getTransactionById: async (id: number): Promise<Transaction> => {
    try {
      const response = await api.get<Transaction>(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transaction #${id}:`, error);
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Create a new transaction
   */
  createTransaction: async (data: CreateTransactionRequest): Promise<Transaction> => {
    try {
      // Transform data if needed to match backend expectations
      const payload = {
        wallet_id: data.wallet_id,
        amount: Number(data.amount),  // Ensure it's a number
        transaction_type: Number(data.transaction_type),  // Ensure it's a number
        description: data.description || undefined,
        transaction_date: data.transaction_date  // Make sure this is in YYYY-MM-DD format
      };
      
      // Log the payload for debugging
      console.log("Creating transaction with payload:", JSON.stringify(payload, null, 2));
      
      const response = await api.post<Transaction>('/transactions', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      
      // Log detailed error information
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server error response:", JSON.stringify(error.response.data, null, 2));
        
        // Handle validation errors from FastAPI
        if (error.response.status === 422 && error.response.data?.detail) {
          const validationErrors = error.response.data.detail;
          if (Array.isArray(validationErrors)) {
            // Map the validation errors to a more readable format
            const errorMessages = validationErrors.map(err => 
              `${err.loc.slice(1).join('.')}: ${err.msg}`
            ).join('; ');
            throw new Error(`Validation error: ${errorMessages}`);
          }
          throw new Error(`Validation error: ${JSON.stringify(error.response.data.detail)}`);
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Update an existing transaction
   */
  updateTransaction: async (id: number, data: UpdateTransactionRequest): Promise<Transaction> => {
    try {
      const response = await api.put<Transaction>(`/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating transaction #${id}:`, error);
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Delete a transaction
   */
  deleteTransaction: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/transactions/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting transaction #${id}:`, error);
      throw new Error(handleErrorResponse(error));
    }
  }
};

export default transactionService;