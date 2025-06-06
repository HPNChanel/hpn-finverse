import api from '@/lib/api';
import { CreateTransactionRequest, UpdateTransactionRequest, TransactionFilters } from '@/types/contracts';

export interface Transaction {
  id: number;
  user_id: number;
  financial_account_id: number;
  wallet_id: number;
  category_id?: number;
  amount: number;
  transaction_type: number; // 0 = income, 1 = expense (CORRECTED)
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string | null;
  // UI helper fields
  wallet_name?: string;
  account_name?: string;
  category_name?: string;
}

export interface MonthlyStats {
  year: number;
  monthly_data: Array<{
    month: number;
    income: number;
    expense: number;
  }>;
  total_income: number;
  total_expense: number;
  net_income: number;
}

class TransactionService {
  private baseUrl = '/transactions';

  async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams();
      
      // Only add valid filter parameters - REMOVED all deleted fields
      if (filters.transaction_type !== undefined) {
        params.append('transaction_type', filters.transaction_type.toString());
      }
      if (filters.wallet_id) {
        params.append('wallet_id', filters.wallet_id.toString());
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await api.get(`${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getTransactionHistory(filters: TransactionFilters = {}): Promise<{ transactions: Transaction[] }> {
    try {
      const params = new URLSearchParams();
      
      // Only add valid filter parameters
      if (filters.transaction_type !== undefined) {
        params.append('transaction_type', filters.transaction_type.toString());
      }
      if (filters.wallet_id) {
        params.append('wallet_id', filters.wallet_id.toString());
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }

      const response = await api.get(`${this.baseUrl}/history${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  async getMonthlyStats(year?: number): Promise<MonthlyStats> {
    try {
      const params = new URLSearchParams();
      if (year) {
        params.append('year', year.toString());
      }

      const response = await api.get(`${this.baseUrl}/stats/monthly${params.toString() ? `?${params.toString()}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      throw error;
    }
  }

  async getCurrentMonthStats(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/stats/current-month`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current month stats:', error);
      throw error;
    }
  }

  async createTransaction(transactionData: CreateTransactionRequest): Promise<Transaction> {
    try {
      // Ensure we only send valid fields - REMOVED all deleted fields
      const cleanData = {
        amount: transactionData.amount,
        transaction_type: transactionData.transaction_type,
        wallet_id: transactionData.wallet_id,
        category_id: transactionData.category_id,
        description: transactionData.description || '',
        transaction_date: transactionData.transaction_date
      };

      const response = await api.post(`${this.baseUrl}/create`, cleanData);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransaction(transactionId: number, updateData: UpdateTransactionRequest): Promise<Transaction> {
    try {
      // Ensure we only send valid fields - REMOVED all deleted fields
      const cleanData: any = {};
      
      if (updateData.amount !== undefined) cleanData.amount = updateData.amount;
      if (updateData.transaction_type !== undefined) cleanData.transaction_type = updateData.transaction_type;
      if (updateData.wallet_id !== undefined) cleanData.wallet_id = updateData.wallet_id;
      if (updateData.category_id !== undefined) cleanData.category_id = updateData.category_id;
      if (updateData.description !== undefined) cleanData.description = updateData.description;
      if (updateData.transaction_date !== undefined) cleanData.transaction_date = updateData.transaction_date;

      const response = await api.put(`${this.baseUrl}/${transactionId}`, cleanData);
      return response.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(transactionId: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${transactionId}`);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  async getCategoryBreakdown(type: 'income' | 'expense', startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await api.get(`${this.baseUrl}/stats/categories?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
  }

  async getSpendingTrends(period: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);

      const response = await api.get(`${this.baseUrl}/stats/trends?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching spending trends:', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService();
export default transactionService;
