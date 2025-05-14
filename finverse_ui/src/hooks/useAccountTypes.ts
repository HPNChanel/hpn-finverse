import { useState, useEffect, useCallback } from 'react';
import accountService from '../services/accountService';
import type { AccountType } from '../services/accountService';

interface UseAccountTypesReturn {
  accountTypes: AccountType[];
  loading: boolean;
  error: string | null;
}

export const useAccountTypes = (): UseAccountTypesReturn => {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAccountTypes();
      setAccountTypes(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load account types. Please try again later.';
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountTypes();
  }, [fetchAccountTypes]);

  return {
    accountTypes,
    loading,
    error
  };
};
