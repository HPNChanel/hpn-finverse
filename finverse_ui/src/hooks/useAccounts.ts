import { useState, useEffect, useCallback } from 'react';
import accountService from '../services/accountService';
import type { Account } from '../utils/importFixes';
import { useAuth } from '../contexts/AuthContext'; 

interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (name: string, type: string, initialBalance: number, currency?: string, note?: string) => Promise<Account>;
  updateAccount: (id: number, data: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: number) => Promise<boolean>;
}

export const useAccounts = (): UseAccountsReturn => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchAccounts = useCallback(async () => {
    // Don't fetch if not authenticated or auth is still loading
    if (!isAuthenticated && !authLoading) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accounts.';
      console.error('Error fetching accounts:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const createAccount = useCallback(
    async (
      name: string,
      type: string,
      initialBalance: number,
      note?: string,
      icon?: string,
      color?: string,
      currency: string = 'USD'
    ): Promise<Account> => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate input
        if (!name.trim()) {
          throw new Error('Account name is required');
        }
        
        if (!type) {
          throw new Error('Account type is required');
        }
        
        if (initialBalance < 0) {
          throw new Error('Initial balance cannot be negative');
        }
        
        const account = await accountService.createAccount(
          name,
          type,
          initialBalance,
          note,
          icon,
          color,
          currency
        );
        
        setAccounts((prev) => [...prev, account]);
        return account;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create account.';
        console.error('Error creating account:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateAccount = useCallback(
    async (id: number, data: Partial<Account>): Promise<Account> => {
      try {
        setLoading(true);
        setError(null);
        const updated = await accountService.updateAccount(id, data);
        setAccounts((prev) =>
          prev.map((account) => (account.id === id ? updated : account))
        );
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update account.';
        console.error('Error updating account:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteAccount = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        const success = await accountService.deleteAccount(id);
        if (success) {
          setAccounts((prev) => prev.filter((account) => account.id !== id));
        }
        return success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete account.';
        console.error('Error deleting account:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch accounts only after auth is determined
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchAccounts();
      } else {
        // Clear accounts if not authenticated
        setAccounts([]);
      }
    }
  }, [isAuthenticated, authLoading, fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
