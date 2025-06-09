import { useState, useEffect, useCallback } from 'react';
import { stakingApi } from '@/lib/api';
import { useWallet } from './useWallet';
import { useToast } from './use-toast';

interface StakingDashboardData {
  total_staked: number;
  active_positions: number;
  total_rewards: number;
  apy_weighted: number;
  pending_rewards: number;
  total_earned: number;
  days_since_first_stake: number;
  portfolio_performance: {
    total_earned: number;
    best_performing_stake: {
      name: string;
      apy: number;
      amount: number;
    };
    monthly_trend: number;
    roi_percentage: number;
  };
}

interface UseStakingDashboardReturn {
  data: StakingDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
  hasData: boolean;
}

export const useStakingDashboard = (): UseStakingDashboardReturn => {
  const [data, setData] = useState<StakingDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { isConnected, accountAddress } = useWallet();
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async (showToast = false) => {
    if (!isConnected || !accountAddress) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching staking dashboard data...');
      
      const response = await stakingApi.getStakingOverview();
      
      // Transform the response to ensure proper types
      const dashboardData: StakingDashboardData = {
        total_staked: Number(response.total_staked) || 0,
        active_positions: Number(response.active_positions) || 0,
        total_rewards: Number(response.total_rewards) || 0,
        apy_weighted: Number(response.apy_weighted) || 0,
        pending_rewards: Number(response.pending_rewards) || 0,
        total_earned: Number(response.total_earned) || 0,
        days_since_first_stake: Number(response.days_since_first_stake) || 0,
        portfolio_performance: {
          total_earned: Number(response.portfolio_performance?.total_earned) || 0,
          best_performing_stake: {
            name: response.portfolio_performance?.best_performing_stake?.name || 'No stakes',
            apy: Number(response.portfolio_performance?.best_performing_stake?.apy) || 0,
            amount: Number(response.portfolio_performance?.best_performing_stake?.amount) || 0
          },
          monthly_trend: Number(response.portfolio_performance?.monthly_trend) || 0,
          roi_percentage: Number(response.portfolio_performance?.roi_percentage) || 0
        }
      };

      setData(dashboardData);
      setLastUpdated(new Date());
      
      if (showToast) {
        toast({
          title: "Dashboard Updated",
          description: "Staking dashboard data has been refreshed",
        });
      }

      console.log(`✅ Dashboard data loaded: ${dashboardData.active_positions} positions, ${dashboardData.total_staked.toFixed(4)} ETH staked`);
      
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = errorObj.response?.data?.detail || errorObj.message || 'Failed to fetch dashboard data';
      console.error('❌ Failed to fetch dashboard data:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Failed to Load Dashboard",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, accountAddress, toast]);

  // Refresh function for manual refresh
  const refreshData = useCallback(async () => {
    await fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Auto-fetch on connection and account changes
  useEffect(() => {
    if (isConnected && accountAddress) {
      fetchDashboardData(false);
    }
  }, [isConnected, accountAddress, fetchDashboardData]);

  // Listen for manual refresh events instead of automatic polling
  useEffect(() => {
    if (!isConnected || !accountAddress) return;

    const handleRefreshEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const isManualRefresh = customEvent.detail?.manual || false;
      console.log('🔄 Dashboard refresh event received', { manual: isManualRefresh });
      fetchDashboardData(isManualRefresh);
    };

    // Listen for dashboard-specific refresh events
    window.addEventListener('refreshDashboard', handleRefreshEvent);
    
    // Also listen for error boundary retry events
    window.addEventListener('errorBoundaryRetry', handleRefreshEvent);
    
    return () => {
      window.removeEventListener('refreshDashboard', handleRefreshEvent);
      window.removeEventListener('errorBoundaryRetry', handleRefreshEvent);
    };
  }, [isConnected, accountAddress, fetchDashboardData]);

  // Optional: refresh on visibility change for long-inactive users
  useEffect(() => {
    if (!isConnected || !accountAddress) return;

    const handleVisibilityChange = () => {
      // Only refresh when user returns to the tab and data is older than 5 minutes
      if (!document.hidden && data && lastUpdated) {
        const timeSinceUpdate = Date.now() - lastUpdated.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceUpdate > fiveMinutes) {
          console.log('🔄 Refreshing staking dashboard data after user returned from long absence');
          fetchDashboardData(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, accountAddress, data, lastUpdated, fetchDashboardData]);

  const hasData = data !== null && (
    data.total_staked > 0 || 
    data.active_positions > 0 || 
    data.total_rewards > 0
  );

  return {
    data,
    isLoading,
    error,
    refreshData,
    lastUpdated,
    hasData
  };
}; 