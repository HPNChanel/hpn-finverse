import { getTokenAddress } from '@/utils/contractLoader';
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatEther, formatUnits, Contract, BrowserProvider } from 'ethers';

interface UseWalletInfoProps {
  accountAddress?: string;
  isConnected?: boolean;
  provider?: BrowserProvider | null;
  refreshInterval?: number; // Set to 0 to disable auto-refresh
}

interface WalletInfo {
  ethBalance: string | undefined;
  fvtBalance: string | undefined;
  formattedEthBalance: string | undefined;
  formattedFvtBalance: string | undefined;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshBalances: () => Promise<void>;
}

export function useWalletInfo({ 
  accountAddress, 
  isConnected = false, 
  provider = null,
  refreshInterval = 0 // Default to no auto-refresh
}: UseWalletInfoProps = {}): WalletInfo {
  
  const [tokenAddress, setTokenAddress] = useState(import.meta.env?.VITE_FVT_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3');

  // Add one-time initialization tracking
  const initializationLoggedRef = useRef(false);

  useEffect(() => {
    getTokenAddress().then(address => {
      setTokenAddress(address);
      if (!initializationLoggedRef.current) {
        console.log('✅ Token address resolved:', address);
        initializationLoggedRef.current = true;
      }
    }).catch(() => {
      if (!initializationLoggedRef.current) {
        console.warn('⚠️ Using fallback token address:', import.meta.env?.VITE_FVT_TOKEN_ADDRESS);
        initializationLoggedRef.current = true;
      }
    });
  }, []);

  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    ethBalance: undefined,
    fvtBalance: undefined,
    formattedEthBalance: undefined,
    formattedFvtBalance: undefined,
    isLoading: false,
    error: null,
    lastUpdated: null,
    refreshBalances: async () => {},
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenContractRef = useRef<Contract | null>(null);

  const fetchWalletInfo = useCallback(async () => {
    if (!accountAddress || !isConnected || !provider) {
      setWalletInfo(prev => ({
        ...prev,
        ethBalance: undefined,
        fvtBalance: undefined,
        formattedEthBalance: undefined,
        formattedFvtBalance: undefined,
        isLoading: false,
        error: null,
      }));
      return;
    }

    setWalletInfo(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create token contract only once
      if (!tokenContractRef.current && tokenAddress) {
        const erc20Abi = [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ];
        tokenContractRef.current = new Contract(tokenAddress, erc20Abi, provider);
        console.log('📄 Token contract initialized for address:', tokenAddress);
      }

      // Parallel balance loading for optimal performance
      const balancePromises = [
        provider.getBalance(accountAddress),
        tokenContractRef.current?.balanceOf(accountAddress) || Promise.resolve(0n),
      ];

      const [ethBalanceWei, fvtBalanceWei] = await Promise.all(balancePromises);
      
      const ethBalance = formatEther(ethBalanceWei);
      let fvtBalance = '0';

      if (tokenContractRef.current && fvtBalanceWei > 0n) {
        try {
          const decimals = await tokenContractRef.current.decimals();
          fvtBalance = formatUnits(fvtBalanceWei, decimals);
        } catch (tokenError) {
          console.error('Failed to get token decimals:', tokenError);
          // Fallback to standard 18 decimals
          fvtBalance = formatUnits(fvtBalanceWei, 18);
        }
      }

      const formattedEthBalance = parseFloat(ethBalance).toFixed(3);
      const formattedFvtBalance = parseFloat(fvtBalance).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

      setWalletInfo(prev => ({
        ...prev,
        ethBalance,
        fvtBalance,
        formattedEthBalance,
        formattedFvtBalance,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      }));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallet information';
      console.error('Failed to fetch wallet info:', error);
      setWalletInfo(prev => ({
        ...prev,
        ethBalance: undefined,
        fvtBalance: undefined,
        formattedEthBalance: undefined,
        formattedFvtBalance: undefined,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [accountAddress, isConnected, provider, tokenAddress]);

  // Manual refresh function
  const refreshBalances = useCallback(async () => {
    await fetchWalletInfo();
  }, [fetchWalletInfo]);

  // Update refresh function in state
  useEffect(() => {
    setWalletInfo(prev => ({ ...prev, refreshBalances }));
  }, [refreshBalances]);

  // Initial fetch and setup interval
  useEffect(() => {
    if (accountAddress && isConnected && provider) {
      fetchWalletInfo();

      // Set up refresh interval
      if (refreshInterval > 0) {
        intervalRef.current = setInterval(fetchWalletInfo, refreshInterval);
      }
    } else {
      // Clear interval if not connected
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accountAddress, isConnected, provider, refreshInterval, fetchWalletInfo]);

  return walletInfo;
}
