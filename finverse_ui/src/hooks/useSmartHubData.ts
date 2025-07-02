import { useState, useEffect, useCallback } from 'react';
import { useAssetsSummary } from './useAssetsSummary';
import { useStakingDashboard } from './useStakingDashboard';
import { useRecentTransactions } from './useRecentTransactions';
import { useGoalsProgress } from './useGoalsProgress';

interface SmartHubData {
  // Assets Summary
  totalBalance: number;
  monthlyChange: number;
  
  // Staking Info
  stakingRewards: number;
  totalStaked: number;
  activeStakes: number;
  
  // Goals Progress
  activeSavings: number;
  goals: Array<{
    name: string;
    progress: number;
    target: number;
    current: number;
  }>;
  
  // Recent Activity
  recentActivity: Array<{
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string;
    time: string;
  }>;
}

interface UseSmartHubDataReturn {
  data: SmartHubData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useSmartHubData = (): UseSmartHubDataReturn => {
  const [data, setData] = useState<SmartHubData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use individual hooks
  const assets = useAssetsSummary();
  const staking = useStakingDashboard();
  const transactions = useRecentTransactions(5);
  const goals = useGoalsProgress();

  // Combine loading states
  const isLoading = assets.isLoading || staking.isLoading || transactions.isLoading || goals.isLoading;

  // Combine error states
  const error = assets.error || staking.error || transactions.error || goals.error;

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      assets.refetch(),
      staking.refreshData(),
      transactions.refetch(),
      goals.refetch(),
    ]);
  }, [assets, staking, transactions, goals]);

  // Combine data when all sources are available
  useEffect(() => {
    if (assets.data || staking.data || transactions.data || goals.data) {
      const combinedData: SmartHubData = {
        // Assets data
        totalBalance: assets.data?.total_balance || 0,
        monthlyChange: assets.data?.monthly_change || 0,
        
        // Staking data
        stakingRewards: staking.data?.total_rewards || 0,
        totalStaked: staking.data?.total_staked || 0,
        activeStakes: staking.data?.active_positions || 0,
        
        // Goals data
        activeSavings: goals.data?.active_count || 0,
        goals: goals.data?.goals?.slice(0, 3).map(goal => ({
          name: goal.name,
          progress: goal.progress,
          target: goal.target,
          current: goal.current,
        })) || [],
        
        // Recent transactions
        recentActivity: transactions.data?.transactions?.slice(0, 3).map(txn => ({
          type: txn.type,
          amount: txn.amount,
          description: txn.description,
          time: txn.time,
        })) || [],
      };

      setData(combinedData);
      setLastUpdated(new Date());
    }
  }, [assets.data, staking.data, transactions.data, goals.data]);

  return {
    data,
    isLoading,
    error,
    refetch,
    lastUpdated,
  };
}; 