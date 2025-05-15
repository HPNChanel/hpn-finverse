import { useState, useEffect, useCallback } from 'react';
// Fix import to use Account from the correct location
import type { Account } from '../types/index';
import accountService from '../services/accountService';
import { useAuth } from '../contexts/AuthContext';

export interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (
    name: string,
    type: string,
    initialBalance: number,
    note?: string,
    icon?: string,
    color?: string,
    currency?: string
  ) => Promise<boolean>;
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  const fetchAccounts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (err) {
      setError('Failed to load accounts. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (
    name: string,
    type: string,
    initialBalance: number = 0,
    note?: string,
    icon?: string,
    color?: string,
    currency: string = 'USD'
  ): Promise<boolean> => {
    try {
      await accountService.createAccount({
        name,
        type,
        initial_balance: initialBalance,
        note,
        icon,
        color,
        currency
      });
      
      // Fetch updated accounts
      await fetchAccounts();
      
      // Also refresh user data in case there are any changes to overall user state
      await auth.refreshUserData();
      
      return true;
    } catch (err) {
      console.error('Error creating account:', err);
      setError('Failed to create account. Please try again.');
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount
  };
}
