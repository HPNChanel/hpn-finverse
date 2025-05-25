import { useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transactionService';
import { handleErrorResponse } from '../utils/importFixes';

interface MonthlyData {
  month: number;
  income: number;
  expense: number;
}

interface MonthlyStatsData {
  year: number;
  monthly_data: MonthlyData[];
  total_income: number;
  total_expense: number;
  net_income: number;
}

export const useMonthlyStats = (initialYear?: number) => {
  const [data, setData] = useState<MonthlyStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear || new Date().getFullYear()
  );

  const fetchMonthlyStats = useCallback(async (year?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await transactionService.getMonthlyStats(year || selectedYear);
      setData(stats);
    } catch (err) {
      const errorMessage = handleErrorResponse(err);
      setError(errorMessage);
      console.error('Failed to fetch monthly stats:', err);
      
      // Set fallback data structure
      setData({
        year: year || selectedYear,
        monthly_data: Array.from({length: 12}, (_, i) => ({
          month: i + 1,
          income: 0,
          expense: 0
        })),
        total_income: 0,
        total_expense: 0,
        net_income: 0
      });
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchMonthlyStats();
    
    // Add event listeners for automatic refresh when transactions change
    const handleTransactionChange = () => {
      console.log('Transaction changed, refetching monthly stats...');
      fetchMonthlyStats();
    };

    window.addEventListener('transactionCreated', handleTransactionChange);
    window.addEventListener('transactionUpdated', handleTransactionChange);
    window.addEventListener('transactionDeleted', handleTransactionChange);

    return () => {
      window.removeEventListener('transactionCreated', handleTransactionChange);
      window.removeEventListener('transactionUpdated', handleTransactionChange);
      window.removeEventListener('transactionDeleted', handleTransactionChange);
    };
  }, [fetchMonthlyStats]);

  const refetch = useCallback(() => {
    fetchMonthlyStats(selectedYear);
  }, [fetchMonthlyStats, selectedYear]);

  const changeYear = useCallback((year: number) => {
    setSelectedYear(year);
    fetchMonthlyStats(year);
  }, [fetchMonthlyStats]);

  return {
    data,
    loading,
    error,
    selectedYear,
    changeYear,
    refetch
  };
};
