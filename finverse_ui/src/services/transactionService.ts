import api from './api';
import { handleErrorResponse } from '../utils/importFixes';
import axios from 'axios';

export type TransactionType = 'STAKE' | 'UNSTAKE' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';

export interface Transaction {
  id: number;
  user_id: number;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  timestamp: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
}

// Create transaction request
export interface CreateTransactionRequest {
  transaction_type: TransactionType;
  amount: number;
  description?: string;
}

const transactionService = {
  /**
   * Get transaction history
   */
  getHistory: async (): Promise<Transaction[]> => {
    try {
      const response = await api.get<TransactionListResponse>('/transactions/history');
      return response.data.transactions || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },
  
  /**
   * Create a new transaction
   */
  createTransaction: async (data: CreateTransactionRequest): Promise<Transaction> => {
    try {
      const response = await api.post<Transaction>('/transactions/create', data);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.detail || 'Invalid transaction data';
          throw new Error(errorDetail);
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },
  
  /**
   * Get transaction by ID
   */
  getTransactionById: async (id: number): Promise<Transaction> => {
    try {
      const response = await api.get<Transaction>(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transaction ${id}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Transaction not found');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  }
};

export default transactionService;