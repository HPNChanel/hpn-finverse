import api from './api';
import { handleErrorResponse } from '../utils/importFixes';
import type { InternalTransaction } from '../types';

export interface TransferRequest {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  note?: string;
}

export interface TransferListResponse {
  transactions: InternalTransaction[];
}

export interface TransferFilters {
  page?: number;
  per_page?: number;
  from_account_id?: number;
  to_account_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

const transferService = {
  /**
   * Get all transfers with optional filtering
   */
  getTransactions: async (filters?: TransferFilters): Promise<InternalTransaction[]> => {
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

      // Use the correct endpoint: /transactions instead of /accounts/transactions
      const response = await api.get<{ transactions: InternalTransaction[] }>('/transactions', { params });
      return response.data.transactions || [];
    } catch (error) {
      console.error('Error fetching transfers:', error);
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Transfer funds between accounts
   */
  transferFunds: async (data: TransferRequest): Promise<InternalTransaction> => {
    try {
      const response = await api.post<InternalTransaction>('/accounts/transfer', data);
      return response.data;
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw new Error(handleErrorResponse(error));
    }
  }
};

export default transferService;