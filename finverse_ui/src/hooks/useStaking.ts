import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { useToast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/utils/errorHandler';
import { ERC20_ABI, STAKE_VAULT_ABI } from '@/lib/contracts';

interface StakeInfo {
  amount: string;
  timestamp: number;
  claimed: boolean;
  reward: string;
  canUnstake: boolean;
}

interface UseStakingReturn {
  // Connection state (delegated to useWallet)
  address: string | null;
  isConnected: boolean;
  isMetaMaskInstalled: boolean;
  
  // Loading states
  isLoading: boolean;
  isStaking: boolean;
  isClaiming: boolean;
  isUnstaking: boolean;
  
  // Error handling
  error: string | null;
  
  // Contract data
  stakeInfo: StakeInfo | null;
  tokenBalance: string;
  totalStaked: string;
  
  // Actions (delegated to useWallet for connection)
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  stake: (amount: string) => Promise<void>;
  claim: (stakeIndex?: number) => Promise<void>;
  unstake: (stakeIndex?: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useStaking = (): UseStakingReturn => {
  // Use the wallet hook for connection management
  const {
    accountAddress,
    isConnected,
    isMetaMaskInstalled,
    balanceFVT,
    tokenAddress,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToHardhatNetwork
  } = useWallet();

  // Local state for staking-specific data
  const [isLoading, setIsLoading] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [totalStaked, setTotalStaked] = useState('0');

  // Contract instances
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [stakeVaultContract, setStakeVaultContract] = useState<ethers.Contract | null>(null);

  const { toast } = useToast();

  // Contract addresses (fallback values)
  const STAKE_VAULT_ADDRESS = import.meta.env?.VITE_STAKE_VAULT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  // Initialize contracts when wallet is connected
  useEffect(() => {
    const initializeContracts = async () => {
      if (!window.ethereum || !accountAddress || !tokenAddress || !isCorrectNetwork) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Create contract instances with correct ABIs
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const vault = new ethers.Contract(STAKE_VAULT_ADDRESS, STAKE_VAULT_ABI, signer);

        setTokenContract(token);
        setStakeVaultContract(vault);
      } catch (err) {
        console.error('Failed to initialize contracts:', err);
        setError('Failed to initialize contracts');
        ErrorHandler.logError(err as Error, 'Initialize contracts');
      }
    };

    initializeContracts();
  }, [accountAddress, tokenAddress, isCorrectNetwork]);

  // Network check effect
  useEffect(() => {
    if (isConnected && !isCorrectNetwork) {
      setError('Please switch to Hardhat Local network (Chain ID: 31337)');
      toast({
        title: "Wrong Network",
        description: "Please switch to Hardhat Local network for staking functionality",
        variant: "destructive",
      });
    } else {
      setError(null);
    }
  }, [isConnected, isCorrectNetwork, toast]);

  // Stake tokens with improved error handling
  const stake = useCallback(async (amount: string) => {
    if (!tokenContract || !stakeVaultContract || !accountAddress) {
      setError('Contracts not initialized or wallet not connected');
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet and ensure you're on the correct network",
        variant: "destructive",
      });
      return;
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Hardhat Local network first",
        variant: "destructive",
        action: {
          altText: "Switch Network",
          onClick: switchToHardhatNetwork
        }
      });
      return;
    }

    setIsStaking(true);
    setError(null);

    try {
      const amountWei = ethers.parseEther(amount);
      
      // Check balance
      const balance = await tokenContract.balanceOf(accountAddress);
      if (balance < amountWei) {
        throw new Error('Insufficient token balance');
      }

      // First, approve the StakeVault to spend tokens
      console.log('Approving tokens...');
      const approveTx = await tokenContract.approve(STAKE_VAULT_ADDRESS, amountWei);
      await approveTx.wait();
      
      toast({
        title: "Approval Successful",
        description: "Tokens approved for staking. Now executing stake...",
      });
      
      // Then stake the tokens
      console.log('Staking tokens...');
      const stakeTx = await stakeVaultContract.stake(amountWei);
      await stakeTx.wait();
      
      console.log('Staking successful!');
      
      toast({
        title: "Staking Successful",
        description: `Successfully staked ${amount} FVT tokens`,
      });
      
      await refreshData();
    } catch (err: any) {
      console.error('Staking failed:', err);
      const errorMessage = ErrorHandler.handleStakingError(err, 'stake');
      setError(errorMessage);
      
      toast({
        title: "Staking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  }, [tokenContract, stakeVaultContract, accountAddress, isCorrectNetwork, switchToHardhatNetwork, toast]);

  // Claim rewards
  const claim = useCallback(async (stakeIndex: number = 0) => {
    if (!stakeVaultContract || !accountAddress) {
      setError('Contract not initialized or wallet not connected');
      return;
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Hardhat Local network first",
        variant: "destructive",
      });
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      console.log('Claiming rewards...');
      const claimTx = await stakeVaultContract.claim(stakeIndex);
      await claimTx.wait();
      
      console.log('Claim successful!');
      
      toast({
        title: "Rewards Claimed",
        description: "Successfully claimed your staking rewards",
      });
      
      await refreshData();
    } catch (err: any) {
      console.error('Claim failed:', err);
      const errorMessage = err.reason || err.message || 'Claim failed';
      setError(errorMessage);
      
      toast({
        title: "Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      ErrorHandler.logError(err, 'Claim rewards');
    } finally {
      setIsClaiming(false);
    }
  }, [stakeVaultContract, accountAddress, isCorrectNetwork, toast]);

  // Unstake tokens
  const unstake = useCallback(async (stakeIndex: number = 0) => {
    if (!stakeVaultContract || !accountAddress) {
      setError('Contract not initialized or wallet not connected');
      return;
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Hardhat Local network first",
        variant: "destructive",
      });
      return;
    }

    setIsUnstaking(true);
    setError(null);

    try {
      console.log('Unstaking tokens...');
      const unstakeTx = await stakeVaultContract.unstake(stakeIndex);
      await unstakeTx.wait();
      
      console.log('Unstake successful!');
      
      toast({
        title: "Unstaking Successful",
        description: "Successfully unstaked your tokens and claimed rewards",
      });
      
      await refreshData();
    } catch (err: any) {
      console.error('Unstake failed:', err);
      const errorMessage = err.reason || err.message || 'Unstake failed';
      setError(errorMessage);
      
      toast({
        title: "Unstake Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      ErrorHandler.logError(err, 'Unstake tokens');
    } finally {
      setIsUnstaking(false);
    }
  }, [stakeVaultContract, accountAddress, isCorrectNetwork, toast]);

  // Get stake information
  const getStakeInfo = useCallback(async () => {
    if (!stakeVaultContract || !accountAddress) return;

    try {
      // Get user's stake count
      const stakeCount = await stakeVaultContract.getUserStakeCount(accountAddress);
      
      if (stakeCount > 0) {
        // Get first stake (index 0)
        const stake = await stakeVaultContract.getUserStake(accountAddress, 0);
        const pendingReward = await stakeVaultContract.getPendingReward(accountAddress, 0);
        const canUnstake = await stakeVaultContract.canUnstake(accountAddress, 0);
        
        setStakeInfo({
          amount: ethers.formatEther(stake.amount),
          timestamp: Number(stake.timestamp),
          claimed: stake.claimed,
          reward: ethers.formatEther(pendingReward),
          canUnstake
        });
      } else {
        setStakeInfo(null);
      }
    } catch (err) {
      console.error('Failed to get stake info:', err);
      ErrorHandler.logError(err as Error, 'Get stake info');
    }
  }, [stakeVaultContract, accountAddress]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!stakeVaultContract || !accountAddress) return;

    try {
      setIsLoading(true);
      
      // Get total staked
      const staked = await stakeVaultContract.totalStaked(accountAddress);
      setTotalStaked(ethers.formatEther(staked));

      // Get stake info
      await getStakeInfo();
    } catch (err) {
      console.error('Failed to refresh data:', err);
      ErrorHandler.logError(err as Error, 'Refresh staking data');
    } finally {
      setIsLoading(false);
    }
  }, [stakeVaultContract, accountAddress, getStakeInfo]);

  // Auto-refresh data when contracts are ready
  useEffect(() => {
    if (isConnected && tokenContract && stakeVaultContract && isCorrectNetwork) {
      refreshData();
    }
  }, [isConnected, tokenContract, stakeVaultContract, isCorrectNetwork, refreshData]);

  return {
    // Connection state (from useWallet)
    address: accountAddress,
    isConnected,
    isMetaMaskInstalled,
    
    // Loading states
    isLoading,
    isStaking,
    isClaiming,
    isUnstaking,
    
    // Error handling
    error,
    
    // Contract data
    stakeInfo,
    tokenBalance: balanceFVT, // From useWallet
    totalStaked,
    
    // Actions
    connectWallet,
    disconnectWallet,
    stake,
    claim,
    unstake,
    refreshData
  };
};
