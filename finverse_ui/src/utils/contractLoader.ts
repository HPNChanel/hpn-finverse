interface ContractsData {
  timestamp: string;
  network: string;
  contracts: {
    StakeVault: StakeVaultInfo;
    RewardDistributor?: RewardDistributorInfo; // Optional for future use
  };
  deployer: string;
  testUser?: string;
  testAccounts?: {
    deployer: {
      address: string;
      privateKey: string;
    };
    testUser: {
      address: string;
      privateKey: string;
    };
  };
}

interface StakeVaultInfo {
  address: string;
  description?: string;
  lockPeriod: string;
  defaultPools?: Array<{
    id: number;
    name: string;
    apy: string;
  }>;
}

interface RewardDistributorInfo {
  address: string;
  description?: string;
}

class ContractLoader {
  private contractsData: ContractsData | null = null;
  private loadPromise: Promise<ContractsData> | null = null;

  async loadContracts(): Promise<ContractsData> {
    if (this.contractsData) {
      return this.contractsData;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.fetchContracts();
    this.contractsData = await this.loadPromise;
    return this.contractsData;
  }

  private async fetchContracts(): Promise<ContractsData> {
    try {
      // Try primary location first
      const response = await fetch('/contracts/contracts.json');
      if (response.ok) {
        const data = await response.json();
        this.validateContractsData(data);
        return data;
      }
      
      // Fallback to root location
      const fallbackResponse = await fetch('/contracts.json');
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        this.validateContractsData(data);
        return data;
      }

      throw new Error('Failed to load contracts.json from any location');
    } catch (error) {
      console.error('Error loading contracts:', error);
      // Return fallback addresses for localhost development
      return this.getFallbackContracts();
    }
  }

  private validateContractsData(data: unknown): void {
    // Type guard to ensure data is an object with contracts property
    if (!data || typeof data !== 'object' || !('contracts' in data)) {
      throw new Error('Invalid contracts.json structure - missing contracts property');
    }

    const dataObj = data as { contracts?: unknown };
    if (!dataObj.contracts || typeof dataObj.contracts !== 'object' || !dataObj.contracts) {
      throw new Error('Invalid contracts.json structure - contracts is not an object');
    }

    const contracts = dataObj.contracts as { StakeVault?: unknown; RewardDistributor?: unknown };
    
    if (!contracts.StakeVault || typeof contracts.StakeVault !== 'object' || !contracts.StakeVault) {
      throw new Error('Invalid contracts.json structure - missing StakeVault contract');
    }
    
    const stakeVault = contracts.StakeVault as { address?: unknown };
    
    if (!stakeVault.address || typeof stakeVault.address !== 'string') {
      throw new Error('Missing StakeVault contract address in contracts.json');
    }

    // Validate addresses are proper Ethereum addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(stakeVault.address)) {
      throw new Error('Invalid StakeVault contract address format');
    }

    // Optional validation for RewardDistributor if present
    if (contracts.RewardDistributor && typeof contracts.RewardDistributor === 'object') {
      const rewardDistributor = contracts.RewardDistributor as { address?: unknown };
      if (!rewardDistributor.address || typeof rewardDistributor.address !== 'string') {
        throw new Error('Missing RewardDistributor contract address in contracts.json');
      }
      if (!addressRegex.test(rewardDistributor.address)) {
        throw new Error('Invalid RewardDistributor contract address format');
      }
    }
  }

  private getFallbackContracts(): ContractsData {
    console.warn('Using fallback contract addresses for localhost ETH staking');
    return {
      timestamp: new Date().toISOString(),
      network: 'localhost',
      contracts: {
        StakeVault: {
          address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          description: 'ETH-only staking contract with multiple pools',
          lockPeriod: '30 days',
          defaultPools: [
            {
              id: 0,
              name: 'ETH Flexible Pool',
              apy: '8%'
            },
            {
              id: 1,
              name: 'ETH Premium Pool',
              apy: '12%'
            }
          ]
        }
      },
      deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    };
  }

  // DEPRECATED: Token-related functions are disabled for ETH-only staking
  async getTokenAddress(): Promise<never> {
    throw new Error('getTokenAddress() is deprecated - ETH staking does not use ERC20 tokens');
  }

  async getTokenInfo(): Promise<never> {
    throw new Error('getTokenInfo() is deprecated - ETH staking does not use ERC20 tokens');
  }

  async getStakeVaultAddress(): Promise<string> {
    try {
      const contracts = await this.loadContracts();
      return contracts.contracts.StakeVault.address;
    } catch (error) {
      console.error('Failed to load stake vault address:', error);
      return '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // fallback address
    }
  }

  async getStakeVaultInfo(): Promise<StakeVaultInfo> {
    try {
      const contracts = await this.loadContracts();
      return contracts.contracts.StakeVault;
    } catch (error) {
      console.error('Failed to load stake vault info:', error);
      throw new Error('Unable to load StakeVault contract information');
    }
  }

  async getRewardDistributorAddress(): Promise<string | null> {
    try {
      const contracts = await this.loadContracts();
      return contracts.contracts.RewardDistributor?.address || null;
    } catch (error) {
      console.error('Failed to load reward distributor address:', error);
      return null;
    }
  }

  async getRewardDistributorInfo(): Promise<RewardDistributorInfo | null> {
    try {
      const contracts = await this.loadContracts();
      return contracts.contracts.RewardDistributor || null;
    } catch (error) {
      console.error('Failed to load reward distributor info:', error);
      return null;
    }
  }

  async getNetworkInfo(): Promise<{ network: string; timestamp: string; deployer: string }> {
    try {
      const contracts = await this.loadContracts();
      return {
        network: contracts.network,
        timestamp: contracts.timestamp,
        deployer: contracts.deployer
      };
    } catch (error) {
      console.error('Failed to load network info:', error);
      return {
        network: 'unknown',
        timestamp: new Date().toISOString(),
        deployer: '0x0000000000000000000000000000000000000000'
      };
    }
  }

  async getTestAccounts(): Promise<ContractsData['testAccounts'] | null> {
    try {
      const contracts = await this.loadContracts();
      return contracts.testAccounts || null;
    } catch (error) {
      console.error('Failed to load test accounts:', error);
      return null;
    }
  }

  // Updated validation for ETH-only contracts
  async validateLocalhost(): Promise<boolean> {
    try {
      const contracts = await this.loadContracts();
      
      // Check if we're on localhost network
      if (contracts.network === 'localhost') {
        const localhostAddresses = [
          '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Common Hardhat address
          '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'  // Common Hardhat address
        ];
        
        const vaultAddress = contracts.contracts.StakeVault.address;
        
        return localhostAddresses.includes(vaultAddress);
      }
      
      return false;
    } catch (error) {
      console.error('Failed to validate localhost:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contractLoader = new ContractLoader();

// Export convenience functions - Updated for ETH-only staking
export const getStakeVaultAddress = () => contractLoader.getStakeVaultAddress();
export const getStakeVaultInfo = () => contractLoader.getStakeVaultInfo();
export const getRewardDistributorAddress = () => contractLoader.getRewardDistributorAddress();
export const getRewardDistributorInfo = () => contractLoader.getRewardDistributorInfo();
export const getNetworkInfo = () => contractLoader.getNetworkInfo();
export const getTestAccounts = () => contractLoader.getTestAccounts();
export const validateLocalhost = () => contractLoader.validateLocalhost();

// DEPRECATED exports - These will throw errors when called
export const getTokenAddress = () => contractLoader.getTokenAddress();
export const getTokenInfo = () => contractLoader.getTokenInfo();
