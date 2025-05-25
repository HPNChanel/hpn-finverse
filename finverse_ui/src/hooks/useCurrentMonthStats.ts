import { useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transactionService';
import { handleErrorResponse } from '../utils/importFixes';

interface CurrentMonthStatsData {
  income: number;
  expenses: number;
  net: number;
  transaction_count: number;
  month: number;
  year: number;
}

export const useCurrentMonthStats = () => {
  const [data, setData] = useState<CurrentMonthStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentMonthStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching current month stats...');
      const stats = await transactionService.getCurrentMonthStats();
      console.log('Current month stats received:', stats);
      
      setData(stats);
    } catch (err) {
      const errorMessage = handleErrorResponse(err);
      setError(errorMessage);
      console.error('Failed to fetch current month stats:', err);
      
      // Set fallback data structure
      const now = new Date();
      setData({
        income: 0,
        expenses: 0,
        net: 0,
        transaction_count: 0,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentMonthStats();
  }, [fetchCurrentMonthStats]);

  const refetch = useCallback(() => {
    console.log('Refetching current month stats...');
    fetchCurrentMonthStats();
  }, [fetchCurrentMonthStats]);

  return {
    data,
    loading,
    error,
    refetch
  };
};
