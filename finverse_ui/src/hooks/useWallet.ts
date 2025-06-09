import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

// Add proper type for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletAccount {
  address: string;
  balance: string;
  isActive: boolean;
}

interface UseWalletReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isMetaMaskInstalled: boolean;
  
  // Account and balance info
  accountAddress: string | null;
  currentAccount: string | null;
  accounts: WalletAccount[];
  balance: string;
  balanceETH: string;
  balanceFVT: string;
  formattedBalanceETH: string;
  
  // Network info
  chainId: string | null;
  isCorrectNetwork: boolean;
  networkName: string;
  
  // Actions
  connectWallet: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  disconnectWallet: () => void;
  reconnectWallet: () => Promise<void>;
  switchAccount: (address: string) => Promise<void>;
  switchToHardhatNetwork: () => Promise<void>;
  
  // Balance management
  refreshBalance: (address?: string) => Promise<void>;
  refreshBalances: () => Promise<void>;
  refreshAllBalances: () => Promise<void>;
  getBalance: (address: string) => Promise<string>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // Provider
  provider: BrowserProvider | null;
  
  // Token info (for FVT compatibility)
  tokenAddress: string | null;
}

export function useWallet(): UseWalletReturn {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  
  // Account and balance info
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [balance, setBalance] = useState('0.0');
  const [balanceFVT, setBalanceFVT] = useState('0.0');
  
  // Network info
  const [chainId, setChainId] = useState<string | null>(null);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Provider
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  // Derived state
  const accountAddress = currentAccount;
  const balanceETH = balance;
  const formattedBalanceETH = parseFloat(balance).toFixed(4);
  const isCorrectNetwork = chainId === '31337' || chainId === '1337'; // Hardhat local network
  const networkName = isCorrectNetwork ? 'Hardhat Local' : chainId ? `Chain ${chainId}` : 'Unknown';
  const tokenAddress = null; // For future FVT token support

  // Check if MetaMask is installed
  const checkMetaMaskInstallation = useCallback(() => {
    const installed = typeof window !== 'undefined' && 
                     typeof window.ethereum !== 'undefined' && 
                     window.ethereum.isMetaMask === true;
    setIsMetaMaskInstalled(installed);
    return installed;
  }, []);

  // Initialize provider
  const initProvider = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      return browserProvider;
    }
    return null;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get balance for a specific address
  const getBalance = useCallback(async (address: string): Promise<string> => {
    if (!provider) return '0.0';
    
    try {
      const balance = await provider.getBalance(address);
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0.0';
    }
  }, [provider]);

  // Refresh balance for current or specified account
  const refreshBalance = useCallback(async (address?: string) => {
    if (!provider) return;
    
    const targetAddress = address || currentAccount;
    if (!targetAddress) return;

    try {
      const balance = await provider.getBalance(targetAddress);
      const formattedBalance = formatEther(balance);
      
      if (targetAddress === currentAccount) {
        setBalance(formattedBalance);
      }
      
      // Update in accounts array if it exists
      setAccounts(prev => prev.map(acc => 
        acc.address === targetAddress 
          ? { ...acc, balance: formattedBalance }
          : acc
      ));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [provider, currentAccount]);

  // Refresh all account balances
  const refreshAllBalances = useCallback(async () => {
    if (!provider || accounts.length === 0) return;

    try {
      const balancePromises = accounts.map(async (account) => {
        try {
          const balance = await provider.getBalance(account.address);
          return {
            ...account,
            balance: formatEther(balance)
          };
        } catch (error) {
          console.error(`Failed to get balance for ${account.address}:`, error);
          return account;
        }
      });

      const updatedAccounts = await Promise.all(balancePromises);
      setAccounts(updatedAccounts);
      
      // Update current balance if needed
      if (currentAccount) {
        const currentAcc = updatedAccounts.find(acc => acc.address === currentAccount);
        if (currentAcc) {
          setBalance(currentAcc.balance);
        }
      }
    } catch (error) {
      console.error('Failed to refresh all balances:', error);
    }
  }, [provider, accounts, currentAccount]);

  // Alias for refreshAllBalances
  const refreshBalances = refreshAllBalances;

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    if (!checkMetaMaskInstallation()) {
      const errorMsg = 'MetaMask not found. Please install MetaMask.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    if (isConnecting) {
      console.log('⏳ Connection already in progress');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const browserProvider = await initProvider();
      if (!browserProvider) {
        throw new Error('Failed to initialize provider');
      }

      // Request account access
      const accountsResult = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accountsResult.length === 0) {
        throw new Error('No accounts found');
      }

      // Get all account balances
      const accountsWithBalances = await Promise.all(
        accountsResult.map(async (address: string) => {
          try {
            const balance = await browserProvider.getBalance(address);
            return {
              address,
              balance: formatEther(balance),
              isActive: address === accountsResult[0]
            };
          } catch (error) {
            console.error(`Failed to get balance for ${address}:`, error);
            return {
              address,
              balance: '0.0',
              isActive: address === accountsResult[0]
            };
          }
        })
      );

      setAccounts(accountsWithBalances);
      setCurrentAccount(accountsResult[0]);
      setBalance(accountsWithBalances[0]?.balance || '0.0');
      setIsConnected(true);

      // Get chain ID
      const network = await browserProvider.getNetwork();
      setChainId(network.chainId.toString());

      console.log('✅ Wallet connected successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to connect wallet:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsConnecting(false);
    }
  }, [checkMetaMaskInstallation, initProvider, isConnecting]);

  // Alias for connectWallet
  const connect = connectWallet;

  // Reconnect wallet
  const reconnectWallet = useCallback(async () => {
    if (!checkMetaMaskInstallation()) {
      const errorMsg = 'MetaMask not found. Please install MetaMask.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setIsReconnecting(true);
      setError(null);

      const browserProvider = await initProvider();
      if (!browserProvider) {
        throw new Error('Failed to initialize provider');
      }

      // Check current accounts
      const accountsResult = await window.ethereum!.request({
        method: 'eth_accounts'
      }) as string[];

      if (accountsResult.length > 0) {
        // Update connection with current accounts
        const accountsWithBalances = await Promise.all(
          accountsResult.map(async (address: string) => {
            try {
              const balance = await browserProvider.getBalance(address);
              return {
                address,
                balance: formatEther(balance),
                isActive: address === accountsResult[0]
              };
            } catch (error) {
              console.error(`Failed to get balance for ${address}:`, error);
              return {
                address,
                balance: '0.0',
                isActive: address === accountsResult[0]
              };
            }
          })
        );

        setAccounts(accountsWithBalances);
        setCurrentAccount(accountsResult[0]);
        setBalance(accountsWithBalances[0]?.balance || '0.0');
        setIsConnected(true);

        // Get chain ID
        const network = await browserProvider.getNetwork();
        setChainId(network.chainId.toString());
      } else {
        // No accounts, try to connect
        await connectWallet();
      }
    } catch (error: unknown) {
      console.error('❌ Failed to reconnect wallet:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to reconnect wallet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsReconnecting(false);
    }
  }, [checkMetaMaskInstallation, initProvider, connectWallet]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setCurrentAccount(null);
    setAccounts([]);
    setBalance('0.0');
    setBalanceFVT('0.0');
    setChainId(null);
    setProvider(null);
    setError(null);
    console.log('🔌 Wallet disconnected');
  }, []);

  // Alias for disconnectWallet
  const disconnect = disconnectWallet;

  // Switch to different account
  const switchAccount = useCallback(async (address: string) => {
    if (!provider) return;

    try {
      setIsReconnecting(true);
      
      // Find the account in our list
      const account = accounts.find(acc => acc.address === address);
      if (!account) {
        throw new Error('Account not found');
      }

      // Update active states
      const updatedAccounts = accounts.map(acc => ({
        ...acc,
        isActive: acc.address === address
      }));

      setAccounts(updatedAccounts);
      setCurrentAccount(address);
      setBalance(account.balance);

      // Request MetaMask to switch to this account
      try {
        await window.ethereum?.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (error) {
        // Some wallets don't support this, that's ok
        console.warn('Could not request account switch:', error);
      }

    } catch (error: unknown) {
      console.error('Failed to switch account:', error);
      setError(error instanceof Error ? error.message : 'Failed to switch account');
      throw error;
    } finally {
      setIsReconnecting(false);
    }
  }, [provider, accounts]);

  // Switch to Hardhat network
  const switchToHardhatNetwork = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError && typeof switchError === 'object' && 'code' in switchError && (switchError as { code: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Hardhat Local',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://127.0.0.1:8545'],
              blockExplorerUrls: null,
            }],
          });
        } catch {
          throw new Error('Failed to add Hardhat network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to Hardhat network');
      }
    }
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      try {
        const accountsList = args[0] as string[];
        if (accountsList.length === 0) {
          disconnectWallet();
        } else if (accountsList[0] !== currentAccount) {
          setCurrentAccount(accountsList[0]);
          // Refresh balance directly to avoid dependency loops
          if (provider) {
            try {
              const balance = await provider.getBalance(accountsList[0]);
              setBalance(formatEther(balance));
            } catch (error) {
              console.error('Failed to refresh balance:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error handling account change:', error);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const newChainId = args[0] as string;
      const chainIdDecimal = parseInt(newChainId, 16).toString();
      setChainId(chainIdDecimal);
      console.log(`🔗 Network changed to chain ID: ${chainIdDecimal}`);
      
      // Refresh balance when network changes
      if (currentAccount && provider) {
        refreshBalance(currentAccount);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [currentAccount, disconnectWallet, provider, refreshBalance]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Check MetaMask installation
      const installed = checkMetaMaskInstallation();
      if (!installed) {
        console.log('❌ MetaMask not detected');
        return;
      }

      console.log('✅ MetaMask detected, checking connection...');
      
      const browserProvider = await initProvider();
      if (!browserProvider) return;
      
      // Check if already connected (silent check)
      try {
        const accountsResult = await window.ethereum!.request({ 
          method: 'eth_accounts' 
        }) as string[];
        
        if (accountsResult.length > 0) {
          console.log('🔗 Found existing connection, auto-reconnecting...');
          
          // Get all account balances
          const accountsWithBalances = await Promise.all(
            accountsResult.map(async (address: string) => {
              try {
                const balance = await browserProvider.getBalance(address);
                return {
                  address,
                  balance: formatEther(balance),
                  isActive: address === accountsResult[0]
                };
              } catch (error) {
                console.error(`Failed to get balance for ${address}:`, error);
                return {
                  address,
                  balance: '0.0',
                  isActive: address === accountsResult[0]
                };
              }
            })
          );

          setAccounts(accountsWithBalances);
          setCurrentAccount(accountsResult[0]);
          setBalance(accountsWithBalances[0]?.balance || '0.0');
          setIsConnected(true);

          // Get chain ID
          const network = await browserProvider.getNetwork();
          setChainId(network.chainId.toString());
          
          console.log('✅ Auto-reconnected successfully');
        } else {
          console.log('⚡ MetaMask available but not connected');
        }
      } catch (error) {
        console.error('Failed to check existing connection:', error);
      }
    };

    init();
  }, [checkMetaMaskInstallation, initProvider]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    isReconnecting,
    isMetaMaskInstalled,
    
    // Account and balance info
    accountAddress,
    currentAccount,
    accounts,
    balance,
    balanceETH,
    balanceFVT,
    formattedBalanceETH,
    
    // Network info
    chainId,
    isCorrectNetwork,
    networkName,
    
    // Actions
    connectWallet,
    connect,
    disconnect,
    disconnectWallet,
    reconnectWallet,
    switchAccount,
    switchToHardhatNetwork,
    
    // Balance management
    refreshBalance,
    refreshBalances,
    refreshAllBalances,
    getBalance,
    
    // Error handling
    error,
    clearError,
    
    // Provider
    provider,
    
    // Token info
    tokenAddress
  };
}
