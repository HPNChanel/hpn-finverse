import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStakingAccounts } from '../../hooks';
import { useSnackbar } from '../../hooks/useSnackbar'; // Correct path if it exists
import type { StakingProfile } from '../../types';

export const useStakingDashboard = () => {
  const navigate = useNavigate();
  const { 
    stakingAccounts, 
    loading, 
    error, 
    totalStaked, 
    totalRewards,
    fetchStakingAccounts 
  } = useStakingAccounts();
  const { showSnackbar } = useSnackbar();
  
  // Local state for any dashboard-specific UI states
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed values with memoization
  const accountCount = useMemo(() => stakingAccounts.length, [stakingAccounts]);
  
  // Active accounts (with positive balance or staked amount)
  const activeAccounts = useMemo(() => 
    stakingAccounts.filter(account => 
      account.account.balance > 0 || account.status.total_staked > 0
    ), 
    [stakingAccounts]
  );

  // Navigate to account creation
  const handleCreateAccount = useCallback(() => {
    navigate('/staking/register');
  }, [navigate]);

  // Navigate to account profile
  const handleViewProfile = useCallback((id: number) => {
    navigate(`/staking/profile/${id}`);
  }, [navigate]);

  // Refresh dashboard data
  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchStakingAccounts();
      showSnackbar('Data refreshed successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStakingAccounts, showSnackbar]);

  return {
    stakingAccounts,
    activeAccounts,
    loading,
    error,
    isRefreshing,
    totalStaked,
    totalRewards,
    accountCount,
    handleCreateAccount,
    handleViewProfile,
    refreshData
  };
};

export default useStakingDashboard;
