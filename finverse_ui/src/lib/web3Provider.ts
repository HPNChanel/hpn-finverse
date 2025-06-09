import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface Web3State {
  address: string | null;
  isConnected: boolean;
  chainId: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

class Web3Provider {
  private state: Web3State = {
    address: null,
    isConnected: false,
    chainId: null,
    provider: null,
    signer: null,
  };

  private listeners: ((state: Web3State) => void)[] = [];
  private isInitialized = false;
  private isConnectingRef = false; // Add connection guard

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined' || !window.ethereum) return;

    // Listen for account changes
    window.ethereum.on('accountsChanged', this.handleAccountsChanged);
    window.ethereum.on('chainChanged', this.handleChainChanged);
    window.ethereum.on('disconnect', this.handleDisconnect);

    this.isInitialized = true;
  }

  private handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      this.disconnect();
    } else {
      const newAddress = accounts[0];
      if (newAddress !== this.state.address) {
        await this.updateConnection(newAddress);
      }
    }
  };

  private handleChainChanged = (chainId: string) => {
    this.updateState({ chainId });
  };

  private handleDisconnect = () => {
    this.disconnect();
  };

  private updateState(newState: Partial<Web3State>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private async updateConnection(address: string) {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      
      this.updateState({
        address,
        isConnected: true,
        chainId: '0x' + network.chainId.toString(16),
        provider,
        signer,
      });
    } catch (error) {
      console.error('Failed to update connection:', error);
      this.disconnect();
    }
  }

  async connect(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Check if already connecting to prevent concurrent calls
    if (this.isConnectingRef) {
      console.log('⏳ Connection already in progress, ignoring duplicate request');
      return;
    }

    try {
      // Set connecting flag to prevent concurrent calls
      this.isConnectingRef = true;

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Only proceed if we get valid accounts
      if (accounts && accounts.length > 0) {
        await this.updateConnection(accounts[0]);
      } else {
        throw new Error('No accounts returned from MetaMask');
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    } finally {
      // Always reset connecting flag
      this.isConnectingRef = false;
    }
  }

  async autoConnect(): Promise<void> {
    if (!window.ethereum) return;

    // Don't auto-connect if already connecting
    if (this.isConnectingRef) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts && accounts.length > 0) {
        await this.updateConnection(accounts[0]);
      }
    } catch (error) {
      console.error('Auto-connect failed:', error);
    }
  }

  async reconnect(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // First try to get current accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        await this.updateConnection(accounts[0]);
      } else {
        // If no accounts, try to connect
        await this.connect();
      }
    } catch (error: any) {
      console.error('Reconnection failed:', error);
      throw new Error(error.message || 'Failed to reconnect wallet');
    }
  }

  disconnect(): void {
    this.updateState({
      address: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
    });
  }

  async switchNetwork(chainId: string): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error: any) {
      // If the network hasn't been added to MetaMask, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId,
              chainName: 'Hardhat Local',
              rpcUrls: ['http://localhost:8545'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
            }],
          });
        } catch (addError) {
          throw new Error('Failed to add network to MetaMask');
        }
      } else {
        throw new Error(error.message || 'Failed to switch network');
      }
    }
  }

  subscribe(listener: (state: Web3State) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getProvider(): BrowserProvider | null {
    return this.state.provider;
  }

  getSigner(): JsonRpcSigner | null {
    return this.state.signer;
  }

  getState(): Web3State {
    return { ...this.state };
  }
}

export const web3Provider = new Web3Provider();
