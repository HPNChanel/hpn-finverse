import { getStakeVaultAddress } from '@/utils/contractLoader';
import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { useWallet } from './useWallet';

const STAKE_VAULT_ABI = [
  'function totalStakedAmount() view returns (uint256)',
  'function APY_PERCENTAGE() view returns (uint256)',
  'function LOCK_PERIOD() view returns (uint256)',
  'function stakingToken() view returns (address)'
];

interface GlobalStakingStats {
  totalStaked: string;
  globalAPY: number;
  lockPeriodDays: number;
  totalStakers: number;
  dailyRewards: string;
}

interface UseGlobalStakingReturn {
  stats: GlobalStakingStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const useGlobalStaking = (): UseGlobalStakingReturn => {
  const [stats, setStats] = useState<GlobalStakingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakeVaultAddress, setStakeVaultAddress] = useState(import.meta.env?.VITE_STAKE_VAULT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');

  const { isCorrectNetwork } = useWallet();

  useEffect(() => {
    getStakeVaultAddress().then(address => {
      setStakeVaultAddress(address);
    }).catch(() => {
      console.warn('Using fallback stake vault address');
    });
  }, []);

  const fetchGlobalStats = useCallback(async () => {
    if (!isCorrectNetwork || !window.ethereum) return;

    try {
      setIsLoading(true);
      setError(null);

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(stakeVaultAddress, STAKE_VAULT_ABI, provider);

      // Fetch data from contract
      const [totalStakedAmount, apyPercentage, lockPeriod] = await Promise.all([
        contract.totalStakedAmount(),
        contract.APY_PERCENTAGE(),
        contract.LOCK_PERIOD()
      ]);

      const totalStakedFormatted = formatEther(totalStakedAmount);
      const apy = Number(apyPercentage);
      const lockDays = Number(lockPeriod) / (24 * 60 * 60);

      // Calculate estimated daily rewards based on total staked and APY
      const dailyRewardRate = apy / 100 / 365;
      const estimatedDailyRewards = parseFloat(totalStakedFormatted) * dailyRewardRate;

      // Mock data for total stakers (in real implementation, this would come from contract events)
      const mockTotalStakers = Math.floor(parseFloat(totalStakedFormatted) / 1000) + 42;

      setStats({
        totalStaked: totalStakedFormatted,
        globalAPY: apy,
        lockPeriodDays: lockDays,
        totalStakers: mockTotalStakers,
        dailyRewards: estimatedDailyRewards.toFixed(6)
      });

    } catch (err) {
      console.error('Error fetching global staking stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch global stats');
    } finally {
      setIsLoading(false);
    }
  }, [isCorrectNetwork, stakeVaultAddress]);

  const refreshStats = useCallback(async () => {
    await fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Initial fetch and visibility-based refresh instead of aggressive polling
  useEffect(() => {
    fetchGlobalStats();
    
    const handleVisibilityChange = () => {
      // Only refresh when user returns to the tab
      if (!document.hidden && stats) {
        console.log('🔄 Refreshing global staking stats after user returned to tab');
        fetchGlobalStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchGlobalStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats
  };
};
