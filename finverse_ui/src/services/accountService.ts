import api from '@/lib/api';

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  created_at: string;
  icon?: string;
  color?: string;
  created_by_default: boolean;
  note?: string;
  currency: string;
  is_hidden: boolean;
  is_active: boolean;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  initial_balance: number;
  note?: string;
  icon?: string;
  color?: string;
  currency?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: string;
  balance?: number;
  note?: string;
  icon?: string;
  color?: string;
  currency?: string;
  is_hidden?: boolean;
}

export interface AccountType {
  type: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

export interface AccountSummary {
  total: number;
  wallet: number;
  saving: number;
  investment: number;
  goal: number;
  account_count: number;
  hidden_account_count: number;
  active_budgets: number;
  total_budget_limit: number;
  total_budget_spent: number;
}

class AccountService {
  private baseUrl = '/accounts';

  async getAccountTypes(): Promise<AccountType[]> {
    const response = await api.get(`${this.baseUrl}/types`);
    return response.data;
  }

  async createAccount(accountData: CreateAccountRequest): Promise<Account> {
    // Ensure initial_balance is properly parsed as a number
    const payload = {
      ...accountData,
      initial_balance: parseFloat(accountData.initial_balance.toString()) || 0,
      currency: accountData.currency || 'USD'
    };
    
    console.log('Account Service - Sending payload:', payload);
    
    const response = await api.post(`${this.baseUrl}/create`, payload);
    return response.data;
  }

  async getAccounts(): Promise<Account[]> {
    const response = await api.get(`${this.baseUrl}/list`);
    return response.data.accounts;
  }

  async getAccountSummary(): Promise<AccountSummary> {
    const response = await api.get(`${this.baseUrl}/summary`);
    return response.data;
  }

  async updateAccount(accountId: number, updates: UpdateAccountRequest): Promise<Account> {
    const response = await api.put(`${this.baseUrl}/${accountId}`, updates);
    return response.data;
  }

  async deleteAccount(accountId: number, force: boolean = false): Promise<void> {
    const params = force ? '?force=true' : '';
    await api.delete(`${this.baseUrl}/${accountId}${params}`);
  }

  async topUpAccount(accountId: number, amount: number, note?: string): Promise<Account> {
    const response = await api.post(`${this.baseUrl}/top-up`, {
      account_id: accountId,
      amount: parseFloat(amount.toString()),
      note
    });
    return response.data;
  }

  async toggleAccountVisibility(accountId: number, isHidden: boolean): Promise<Account> {
    const response = await api.patch(`${this.baseUrl}/${accountId}/visibility`, {
      is_hidden: isHidden
    });
    return response.data;
  }

  async getAccountBalance(accountId: number): Promise<number> {
    const response = await api.get(`${this.baseUrl}/${accountId}/balance`);
    return response.data.balance;
  }

  async updateAccountBalance(accountId: number, balance: number): Promise<Account> {
    const response = await api.patch(`${this.baseUrl}/${accountId}/balance`, {
      balance: parseFloat(balance.toString())
    });
    return response.data;
  }
}

export const accountService = new AccountService();
export default accountService;
