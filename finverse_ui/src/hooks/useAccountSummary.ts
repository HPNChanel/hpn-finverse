import { useState, useEffect, useCallback } from 'react';
import accountService from '../services/accountService';
import type { AccountSummary } from '../types';

interface UseAccountSummaryReturn {
  summary: AccountSummary | null;
  loading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
}

export const useAccountSummary = (): UseAccountSummaryReturn => {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAccountSummary();
      setSummary(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load account summary. Please try again later.';
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch summary on mount
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    fetchSummary
  };
};
