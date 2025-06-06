import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/utils/errorHandler';
import { loadContractInfo, ERC20_ABI, FALLBACK_CONTRACTS } from '@/lib/contracts';

interface UseWalletReturn {
  // Account state
  accountAddress: string | null;
  shortAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  
  // Balances
  balanceETH: string;
  balanceFVT: string;
  formattedBalanceETH: string;
  formattedBalanceFVT: string;
  
  // Network info
  chainId: number | null;
  isCorrectNetwork: boolean;
  networkName: string | null;
  
  // Contract info
  tokenAddress: string | null;
  
  // Error handling
  error: string | null;
  
  // Installation check
  isMetaMaskInstalled: boolean;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  reconnectWallet: () => Promise<void>;
  switchToHardhatNetwork: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  clearError: () => void;
}

const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_NETWORK_CONFIG = {
  chainId: `0x${HARDHAT_CHAIN_ID.toString(16)}`,
  chainName: 'Hardhat Local',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: ['http://localhost:8545'],
};

export const useWallet = (): UseWalletReturn => {
  // Core state
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [balanceETH, setBalanceETH] = useState<string>('0');
  const [balanceFVT, setBalanceFVT] = useState<string>('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  
  // UI state
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent multiple listeners
  const listenersAttached = useRef<boolean>(false);
  const provider = useRef<ethers.BrowserProvider | null>(null);
  
  const { toast } = useToast();

  // Derived state
  const isMetaMaskInstalled = typeof window !== 'undefined' && !!window.ethereum;
  const isConnected = !!accountAddress;
  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;
  
  const shortAddress = accountAddress 
    ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`
    : null;
    
  const formattedBalanceETH = parseFloat(balanceETH).toFixed(4);
  const formattedBalanceFVT = parseFloat(balanceFVT).toFixed(2);
  
  const networkName = chainId === HARDHAT_CHAIN_ID ? 'Hardhat Local' : 
                     chainId === 1 ? 'Ethereum Mainnet' :
                     chainId === 11155111 ? 'Sepolia Testnet' :
                     chainId ? `Unknown (${chainId})` : null;

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize provider
  const initializeProvider = useCallback(() => {
    if (!window.ethereum) return null;
    
    if (!provider.current) {
      provider.current = new ethers.BrowserProvider(window.ethereum);
    }
    return provider.current;
  }, []);

  // Load contract information
  const loadContractData = useCallback(async () => {
    try {
      const contractInfo = await loadContractInfo();
      if (contractInfo?.contracts?.MockERC20?.address) {
        setTokenAddress(contractInfo.contracts.MockERC20.address);
      } else {
        setTokenAddress(FALLBACK_CONTRACTS.MockERC20.address);
      }
    } catch (err) {
      console.warn('Failed to load contract info, using fallback:', err);
      setTokenAddress(FALLBACK_CONTRACTS.MockERC20.address);
    }
  }, []);

  // Fetch balances for current account
  const fetchBalances = useCallback(async (address: string) => {
    if (!address || !isMetaMaskInstalled) return;

    try {
      const ethProvider = initializeProvider();
      if (!ethProvider) throw new Error('Provider not available');

      // Fetch ETH balance
      const ethBalance = await ethProvider.getBalance(address);
      setBalanceETH(ethers.formatEther(ethBalance));

      // Fetch FVT balance if token address is available
      if (tokenAddress) {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, ethProvider);
          const fvtBalance = await tokenContract.balanceOf(address);
          setBalanceFVT(ethers.formatEther(fvtBalance));
        } catch (tokenError) {
          console.warn('Failed to fetch FVT balance:', tokenError);
          setBalanceFVT('0');
        }
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      ErrorHandler.logError(err as Error, 'Fetch balances');
    }
  }, [isMetaMaskInstalled, tokenAddress, initializeProvider]);

  // Refresh balances manually
  const refreshBalances = useCallback(async () => {
    if (!accountAddress) return;
    
    setIsReconnecting(true);
    try {
      await fetchBalances(accountAddress);
      toast({
        title: "Balances Updated",
        description: "Wallet balances have been refreshed",
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh wallet balances",
        variant: "destructive",
      });
    } finally {
      setIsReconnecting(false);
    }
  }, [accountAddress, fetchBalances, toast]);

  // Handle account changes
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    console.log('👥 Accounts changed:', accounts);
    
    setIsReconnecting(true);
    setError(null);
    
    if (accounts.length === 0) {
      // User disconnected
      setAccountAddress(null);
      setBalanceETH('0');
      setBalanceFVT('0');
      toast({
        title: "Wallet Disconnected",
        description: "No accounts are connected",
        variant: "destructive",
      });
    } else {
      // Account switched
      const newAccount = accounts[0];
      setAccountAddress(newAccount);
      
      // Fetch balances for new account
      await fetchBalances(newAccount);
      
      toast({
        title: "Account Switched",
        description: `Switched to ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`,
      });
    }
    
    setIsReconnecting(false);
  }, [fetchBalances, toast]);

  // Handle chain changes
  const handleChainChanged = useCallback(async (chainIdHex: string) => {
    const newChainId = parseInt(chainIdHex, 16);
    console.log('🔗 Chain changed:', newChainId);
    
    setChainId(newChainId);
    
    if (newChainId !== HARDHAT_CHAIN_ID) {
      setError(`Please switch to Hardhat Local network (Chain ID: ${HARDHAT_CHAIN_ID})`);
      toast({
        title: "Wrong Network",
        description: "Please switch to Hardhat Local network",
        variant: "destructive",
      });
    } else {
      setError(null);
      toast({
        title: "Network Connected",
        description: "Connected to Hardhat Local network",
      });
    }
    
    // Refresh balances on chain change
    if (accountAddress) {
      await fetchBalances(accountAddress);
    }
  }, [accountAddress, fetchBalances, toast]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (!window.ethereum || listenersAttached.current) return;

    console.log('🎧 Setting up wallet event listeners');
    
    // Remove any existing listeners first
    window.ethereum.removeAllListeners?.('accountsChanged');
    window.ethereum.removeAllListeners?.('chainChanged');
    
    // Add new listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    listenersAttached.current = true;
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      listenersAttached.current = false;
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      const account = accounts[0];
      setAccountAddress(account);

      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId',
      });
      const currentChainId = parseInt(chainIdHex, 16);
      setChainId(currentChainId);

      // Setup event listeners
      setupEventListeners();

      // Load contract data and fetch balances
      await loadContractData();
      await fetchBalances(account);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.slice(0, 6)}...${account.slice(-4)}`,
      });

    } catch (err: any) {
      const message = err?.message || 'Failed to connect wallet';
      setError(message);
      ErrorHandler.logError(err, 'Connect wallet');
      
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled, setupEventListeners, loadContractData, fetchBalances, toast]);

  // Reconnect wallet (force account selection)
  const reconnectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) return;

    setIsReconnecting(true);
    setError(null);

    try {
      // Force account selection by requesting accounts again
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        
        // Only update if account actually changed
        if (account !== accountAddress) {
          setAccountAddress(account);
          toast({
            title: "Account Updated",
            description: `Switched to ${account.slice(0, 6)}...${account.slice(-4)}`,
          });
        }
        
        // Always refresh balances
        await fetchBalances(account);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to reconnect wallet';
      setError(message);
      
      toast({
        title: "Reconnection Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsReconnecting(false);
    }
  }, [isMetaMaskInstalled, accountAddress, fetchBalances, toast]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccountAddress(null);
    setBalanceETH('0');
    setBalanceFVT('0');
    setChainId(null);
    setError(null);
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
    listenersAttached.current = false;
    provider.current = null;
  }, [handleAccountsChanged, handleChainChanged]);

  // Switch to Hardhat network
  const switchToHardhatNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HARDHAT_NETWORK_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Hardhat network');
        }
      } else {
        throw switchError;
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    const initialize = async () => {
      try {
        // Load contract data first
        await loadContractData();
        
        // Check if already connected
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          const account = accounts[0];
          setAccountAddress(account);

          // Get current chain
          const chainIdHex = await window.ethereum.request({
            method: 'eth_chainId',
          });
          setChainId(parseInt(chainIdHex, 16));

          // Setup listeners and fetch balances
          setupEventListeners();
          await fetchBalances(account);
        } else {
          // Setup listeners even if not connected
          setupEventListeners();
        }
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        ErrorHandler.logError(err as Error, 'Initialize wallet');
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, loadContractData, setupEventListeners, fetchBalances, handleAccountsChanged, handleChainChanged]);

  // Refresh balances when token address changes
  useEffect(() => {
    if (accountAddress && tokenAddress) {
      fetchBalances(accountAddress);
    }
  }, [accountAddress, tokenAddress, fetchBalances]);

  return {
    // Account state
    accountAddress,
    shortAddress,
    isConnected,
    isConnecting,
    isReconnecting,
    
    // Balances
    balanceETH,
    balanceFVT,
    formattedBalanceETH,
    formattedBalanceFVT,
    
    // Network info
    chainId,
    isCorrectNetwork,
    networkName,
    
    // Contract info
    tokenAddress,
    
    // Error handling
    error,
    
    // Installation check
    isMetaMaskInstalled,
    
    // Actions
    connectWallet,
    disconnectWallet,
    reconnectWallet,
    switchToHardhatNetwork,
    refreshBalances,
    clearError,
  };
};
