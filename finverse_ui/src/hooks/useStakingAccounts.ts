import { useState, useEffect, useCallback } from 'react';
import stakingService from '../services/stakingService';
import type { StakingProfile } from '../types';

interface UseStakingAccountsReturn {
  stakingAccounts: StakingProfile[];
  loading: boolean;
  error: string | null;
  totalStaked: number;
  totalRewards: number;
  fetchStakingAccounts: () => Promise<void>;
  getStakingAccount: (id: number) => StakingProfile | null;
  createStakingAccount: (name: string, initialBalance?: number) => Promise<boolean>;
  stakeTokens: (amount: number, accountId?: number) => Promise<boolean>;
  unstakeTokens: (amount: number, accountId?: number) => Promise<boolean>;
}

export const useStakingAccounts = (): UseStakingAccountsReturn => {
  const [stakingAccounts, setStakingAccounts] = useState<StakingProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Derived values
  const totalStaked = stakingAccounts.reduce((sum, profile) => sum + profile.status.total_staked, 0);
  const totalRewards = stakingAccounts.reduce((sum, profile) => sum + profile.rewards.earned, 0);

  const fetchStakingAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accounts = await stakingService.getStakingAccounts();
      setStakingAccounts(accounts);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load staking accounts. Please try again later.';
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStakingAccount = useCallback((id: number): StakingProfile | null => {
    return stakingAccounts.find(account => account.account.id === id) || null;
  }, [stakingAccounts]);

  const createStakingAccount = useCallback(async (
    name: string,
    initialBalance?: number
  ): Promise<boolean> => {
    try {
      setError(null);
      await stakingService.createStakingAccount({
        name: name.trim(),
        initial_balance: initialBalance
      });
      await fetchStakingAccounts();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create staking account. Please try again later.';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, [fetchStakingAccounts]);

  const stakeTokens = useCallback(async (
    amount: number,
    accountId?: number
  ): Promise<boolean> => {
    try {
      setError(null);
      await stakingService.stake(amount, accountId);
      await fetchStakingAccounts();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to stake tokens. Please try again later.';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, [fetchStakingAccounts]);

  const unstakeTokens = useCallback(async (
    amount: number,
    accountId?: number
  ): Promise<boolean> => {
    try {
      setError(null);
      await stakingService.unstake(amount, accountId);
      await fetchStakingAccounts();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to unstake tokens. Please try again later.';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, [fetchStakingAccounts]);

  useEffect(() => {
    fetchStakingAccounts();
  }, [fetchStakingAccounts]);

  return {
    stakingAccounts,
    loading,
    error,
    totalStaked,
    totalRewards,
    fetchStakingAccounts,
    getStakingAccount,
    createStakingAccount,
    stakeTokens,
    unstakeTokens
  };
};
