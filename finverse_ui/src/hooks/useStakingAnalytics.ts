import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { useToast } from './use-toast';
import { formatUnits } from 'ethers';
import api from '@/lib/api';

interface AnalyticsData {
  timeframe: string;
  totalStaked: number;
  totalRewards: number;
  periodRewards: number;
  stakeCount: number;
  activeCount: number;
  averageStake: number;
  periodStart: string;
  periodEnd: string;
  dailyData: DailyStakeData[];
  poolDistribution: PoolDistribution[];
  walletAddress: string;
  error?: string;
}

interface DailyStakeData {
  date: string;
  totalStaked: number;
  rewards: number;
  activeStakes: number;
  tokenAddress?: string; // Add token filtering support
  tokenSymbol?: string; // Add token symbol for grouping
}

interface PoolDistribution {
  poolId: string;
  name: string;
  amount: number;
  count: number;
  rewards: number;
  percentage: number;
}

interface UseStakingAnalyticsReturn {
  analytics: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetchAnalytics: () => Promise<void>;
  formatFVTAmount: (value: number | string | bigint) => string;
  formatPercentage: (value: number) => string;
}

export const useStakingAnalytics = (timeframe: '7d' | '30d' | '90d' | '180d' | '365d' = '30d'): UseStakingAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { accountAddress, isConnected } = useWallet();
  const { toast } = useToast();

  // Format FVT amounts with proper scaling
  const formatFVTAmount = useCallback((value: number | string | bigint): string => {
    try {
      if (!value || value === '0') return '0.0000';
      
      let numValue: number;
      
      if (typeof value === 'bigint') {
        numValue = parseFloat(formatUnits(value, 18));
      } else if (typeof value === 'string' && value.length > 15) {
        // Likely wei amount
        numValue = parseFloat(formatUnits(value, 18));
      } else {
        numValue = parseFloat(value.toString());
      }
      
      // Format with appropriate scale
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(2)}M`;
      } else if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(2)}K`;
      } else if (numValue >= 1) {
        return numValue.toFixed(4);
      } else {
        return numValue.toFixed(6);
      }
    } catch (error) {
      console.warn('Error formatting FVT amount:', error);
      return '0.0000';
    }
  }, []);

  // Format percentage values
  const formatPercentage = useCallback((value: number): string => {
    return `${value.toFixed(1)}%`;
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!isConnected || !accountAddress) {
      setAnalytics(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔄 Fetching analytics for ${accountAddress} (${timeframe})`);
      
      const response = await api.get<AnalyticsData>(
        `/staking/analytics?timeframe=${timeframe}&user=${accountAddress}`
      );

      if (response.data) {
        // Process and format the data
        const processedData: AnalyticsData = {
          ...response.data,
          totalStaked: Number(response.data.totalStaked) || 0,
          totalRewards: Number(response.data.totalRewards) || 0,
          periodRewards: Number(response.data.periodRewards) || 0,
          stakeCount: Number(response.data.stakeCount) || 0,
          activeCount: Number(response.data.activeCount) || 0,
          averageStake: Number(response.data.averageStake) || 0,
          dailyData: (response.data.dailyData || []).map(day => ({
            ...day,
            totalStaked: Number(day.totalStaked) || 0,
            rewards: Number(day.rewards) || 0,
            activeStakes: Number(day.activeStakes) || 0
          })),
          poolDistribution: (response.data.poolDistribution || []).map(pool => ({
            ...pool,
            amount: Number(pool.amount) || 0,
            count: Number(pool.count) || 0,
            rewards: Number(pool.rewards) || 0,
            percentage: Number(pool.percentage) || 0
          }))
        };

        setAnalytics(processedData);
        console.log(`✅ Analytics loaded: ${processedData.activeCount} active stakes, ${formatFVTAmount(processedData.totalStaked)} FVT total`);
      } else {
        // Set empty analytics if no data
        setAnalytics({
          timeframe,
          totalStaked: 0,
          totalRewards: 0,
          periodRewards: 0,
          stakeCount: 0,
          activeCount: 0,
          averageStake: 0,
          periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: new Date().toISOString(),
          dailyData: [],
          poolDistribution: [],
          walletAddress: accountAddress
        });
      }

    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch analytics';
      setError(errorMessage);
      
      // Set empty analytics on error
      setAnalytics({
        timeframe,
        totalStaked: 0,
        totalRewards: 0,
        periodRewards: 0,
        stakeCount: 0,
        activeCount: 0,
        averageStake: 0,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
        dailyData: [],
        poolDistribution: [],
        walletAddress: accountAddress || 'unknown',
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountAddress, isConnected, timeframe, formatFVTAmount]);

  // Refetch analytics (public method)
  const refetchAnalytics = useCallback(async (): Promise<void> => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Listen for analytics refresh events
  useEffect(() => {
    const handleRefreshAnalytics = (event: CustomEvent) => {
      console.log('🔄 Analytics refresh event received:', event.detail);
      fetchAnalytics();
    };

    window.addEventListener('refreshStakingAnalytics', handleRefreshAnalytics);
    
    return () => {
      window.removeEventListener('refreshStakingAnalytics', handleRefreshAnalytics);
    };
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetchAnalytics,
    formatFVTAmount,
    formatPercentage
  };
};
