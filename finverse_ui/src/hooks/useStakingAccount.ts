import { useState, useEffect, useCallback } from 'react';
import stakingService from '../services/stakingService';
import type { StakingProfile } from '../types';

interface UseStakingAccountReturn {
  stakingProfile: StakingProfile | null;
  loading: boolean;
  error: string | null;
  fetchStakingProfile: () => Promise<void>;
  createStakingAccount: (name: string, initialBalance?: number) => Promise<boolean>;
}

export const useStakingAccount = (): UseStakingAccountReturn => {
  const [stakingProfile, setStakingProfile] = useState<StakingProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStakingProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await stakingService.getStakingProfile();
      setStakingProfile(profile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load staking profile. Please try again later.';
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      await fetchStakingProfile();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create staking account. Please try again later.';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, [fetchStakingProfile]);

  useEffect(() => {
    fetchStakingProfile();
  }, [fetchStakingProfile]);

  return {
    stakingProfile,
    loading,
    error,
    fetchStakingProfile,
    createStakingAccount
  };
};
