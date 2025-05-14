import { useState, useEffect, useCallback } from 'react';
import stakingService, { type StakeStatus } from '../services/stakingService';

interface UseStakingReturn {
  stakeStatus: StakeStatus | null;
  loading: boolean;
  error: string | null;
  fetchStakeStatus: () => Promise<void>;
  stakeTokens: (amount: number) => Promise<boolean>;
  unstakeTokens: (amount: number) => Promise<boolean>;
}

export const useStaking = (): UseStakingReturn => {
  const [stakeStatus, setStakeStatus] = useState<StakeStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStakeStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await stakingService.getStatus();
      setStakeStatus(status);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load staking status. Please try again later.';
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const stakeTokens = useCallback(async (amount: number): Promise<boolean> => {
    try {
      setError(null);
      const status = await stakingService.stake(amount);
      setStakeStatus(status);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to stake tokens. Please try again later.';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, []);

  const unstakeTokens = useCallback(async (amount: number): Promise<boolean> => {
    try {
      setError(null);
      const status = await stakingService.unstake(amount);
      setStakeStatus(status);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to unstake tokens. Please try again later.';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchStakeStatus();
  }, [fetchStakeStatus]);

  return {
    stakeStatus,
    loading,
    error,
    fetchStakeStatus,
    stakeTokens,
    unstakeTokens
  };
};
