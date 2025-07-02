import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { dashboardService } from '@/services/dashboard.service';

interface AssetsSummary {
  total_balance: number;
  monthly_change: number;
  accounts: AccountSummary[];
  account_types_summary: Record<string, number>;
  net_income_month: number;
  total_income_month: number;
  total_expenses_month: number;
  savings_rate: number;
}

interface AccountSummary {
  account_id: number;
  account_name: string;
  account_type: string;
  balance: number;
  icon?: string;
  color?: string;
}

interface UseAssetsSummaryReturn {
  data: AssetsSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useAssetsSummary = (): UseAssetsSummaryReturn => {
  const [data, setData] = useState<AssetsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchAssetsSummary = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching assets summary...');
      
      const response = await dashboardService.getOverview();
      
      // Transform the response to match our interface
      const assetsSummary: AssetsSummary = {
        total_balance: response.total_balance || 0,
        monthly_change: calculateMonthlyChange(
          response.total_income_month || 0,
          response.total_expenses_month || 0
        ),
        accounts: response.accounts || [],
        account_types_summary: response.account_types_summary || {},
        net_income_month: response.net_income_month || 0,
        total_income_month: response.total_income_month || 0,
        total_expenses_month: response.total_expenses_month || 0,
        savings_rate: response.savings_rate || 0,
      };

      setData(assetsSummary);
      setLastUpdated(new Date());
      console.log('✅ Assets summary loaded successfully');
      
    } catch (err: unknown) {
      console.error('❌ Failed to fetch assets summary:', err);
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load assets summary';
      setError(errorMessage);
      
      toast({
        title: "Error Loading Assets",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, toast]);

  const calculateMonthlyChange = (income: number, expenses: number): number => {
    // Calculate net change as percentage
    const netChange = income - expenses;
    const base = Math.max(income, expenses);
    return base > 0 ? (netChange / base) * 100 : 0;
  };

  // Fetch data on mount and when auth status changes
  useEffect(() => {
    fetchAssetsSummary();
  }, [fetchAssetsSummary]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAssetsSummary,
    lastUpdated,
  };
}; 