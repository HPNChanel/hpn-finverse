import { useState, useEffect, useCallback } from 'react';
import transferService from '../services/transferService';
import type { InternalTransaction } from '../types';

export interface UseTransfersReturn {
  transactions: InternalTransaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
}

export const useTransfers = (): UseTransfersReturn => {
  const [transactions, setTransactions] = useState<InternalTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transferService.getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Failed to load transactions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions
  };
};
