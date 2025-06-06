import api from '@/lib/api';

export interface FinancialAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

class AccountServiceV2 {
  /**
   * Get all accounts for the current user
   */
  async getAllAccounts(): Promise<FinancialAccount[]> {
    const response = await api.get('/accounts/list');
    return response.data.accounts; // Extract accounts array from response
  }

  /**
   * Get account balance by ID
   */
  async getAccountBalance(id: number): Promise<{ balance: number }> {
    const response = await api.get(`/accounts/${id}/balance`);
    return response.data;
  }

  /**
   * Update account balance
   */
  async updateAccountBalance(id: number, balance: number): Promise<FinancialAccount> {
    const response = await api.patch(`/accounts/${id}/balance`, { balance });
    return response.data;
  }
}

export const accountServiceV2 = new AccountServiceV2();

// Alternative export for consistency
export { accountServiceV2 as default, accountServiceV2 } from './accountService';
export type { 
  FinancialAccount, 
} from './accountService';
