import api from './api';
import type { Account, AccountListResponse, AccountSummary } from '../types';
import { handleErrorResponse } from '../utils/importFixes';
import axios from 'axios';

// Types for API requests
interface CreateAccountRequest {
  name: string;
  type: string;
  initial_balance?: number;
  note?: string;
  icon?: string;
  color?: string;
  currency?: string;
}

interface TopUpAccountRequest {
  account_id: number;
  amount: number;
  note?: string;
}

export interface AccountType {
  type: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

const accountService = {
  /**
   * Get all accounts for the current user
   * @returns List of accounts
   */
  getAccounts: async (): Promise<Account[]> => {
    try {
      const response = await api.get<AccountListResponse>('/accounts/list');
      return response.data.accounts || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      
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
   * Get available account types
   * @returns List of account types
   */
  getAccountTypes: async (): Promise<AccountType[]> => {
    try {
      const response = await api.get<AccountType[]>('/accounts/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching account types:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Create a new account
   * @param name Account name
   * @param type Account type
   * @param initialBalance Initial balance amount
   * @param note Optional account note
   * @param icon Optional icon name
   * @param color Optional color code
   * @param currency Optional currency code (defaults to USD)
   * @returns Created account
   */
  createAccount: async (
    name: string,
    type: string,
    initialBalance: number = 0,
    note?: string,
    icon?: string,
    color?: string,
    currency: string = 'USD'
  ): Promise<Account> => {
    try {
      // Format request payload according to backend expectations
      const payload = {
        name: name.trim(),
        type: type,
        initial_balance: initialBalance,
        note: note?.trim(),
        icon: icon,
        color: color,
        currency: currency
      };
      
      console.log('Creating account with payload:', JSON.stringify(payload, null, 2));
      
      const response = await api.post<Account>('/accounts/create', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (error.response?.status === 422) {
          // Handle validation errors from FastAPI
          console.error('Validation error details:', JSON.stringify(error.response?.data));
          const validationError = error.response?.data?.detail;
          
          if (Array.isArray(validationError)) {
            // Extract the first validation error message
            const firstError = validationError[0];
            const errorMsg = firstError.msg || 'Invalid data format';
            const field = firstError.loc?.slice(-1)[0] || 'field';
            throw new Error(`Validation error: ${errorMsg} (${field})`);
          }
          
          throw new Error(
            error.response?.data?.detail || 
            'The server could not process your request. Please check your input data.'
          );
        }
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.detail || 'Invalid account data';
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
   * Top up an account with additional funds
   * @param data Top-up request data
   * @returns Updated account
   */
  topUpAccount: async (data: TopUpAccountRequest): Promise<Account> => {
    try {
      const response = await api.post<Account>('/accounts/top-up', data);
      return response.data;
    } catch (error) {
      console.error('Error topping up account:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (error.response?.status === 404) {
          throw new Error('Account not found');
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Get account summary statistics
   * @returns Account summary
   */
  getAccountSummary: async (): Promise<AccountSummary> => {
    try {
      const response = await api.get<AccountSummary>('/accounts/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching account summary:', error);
      
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
  }
};

export default accountService;