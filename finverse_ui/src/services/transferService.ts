import api from './api';
import { handleErrorResponse } from '../utils/importFixes';
import type { InternalTransaction, InternalTransactionListResponse } from '../utils/importFixes';

export interface TransferRequest {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  note?: string;
}

const transferService = {
  /**
   * Get all transactions for the current user
   */
  getTransactions: async (): Promise<InternalTransaction[]> => {
    try {
      const response = await api.get<InternalTransactionListResponse>('/accounts/transactions');
      return response.data.transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
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