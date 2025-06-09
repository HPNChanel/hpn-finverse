import { BrowserProvider, parseEther, formatEther, isAddress } from 'ethers';
import api from '@/lib/api';

export interface TransferRequest {
  from: string;
  to: string;
  amount: string; // ETH amount as string
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export interface TransferLog {
  from: string;
  to: string;
  amount_eth: number;
  tx_hash: string;
  timestamp: string;
  gas_used?: string;
  gas_price?: string;
  status: 'success' | 'failed';
}

class TransferService {
  private provider: BrowserProvider | null = null;

  // Initialize provider
  async initProvider(): Promise<BrowserProvider> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask to transfer ETH.');
    }

    this.provider = new BrowserProvider(window.ethereum);
    return this.provider;
  }

  // Validate transfer parameters
  validateTransfer(request: TransferRequest): { isValid: boolean; error?: string } {
    // Check if addresses are valid
    if (!isAddress(request.from)) {
      return { isValid: false, error: 'Invalid sender address' };
    }

    if (!isAddress(request.to)) {
      return { isValid: false, error: 'Invalid recipient address' };
    }

    // Check if sender and recipient are different
    if (request.from.toLowerCase() === request.to.toLowerCase()) {
      return { isValid: false, error: 'Cannot send ETH to the same address' };
    }

    // Check amount
    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: 'Invalid amount' };
    }

    if (amount < 0.0001) {
      return { isValid: false, error: 'Minimum amount is 0.0001 ETH' };
    }

    return { isValid: true };
  }

  // Get estimated gas for transfer
  async estimateGas(request: TransferRequest): Promise<{ gasLimit: string; gasPrice: string; totalCost: string }> {
    if (!this.provider) {
      await this.initProvider();
    }

    try {
      const signer = await this.provider!.getSigner();
      
      // Estimate gas limit
      const gasLimit = await this.provider!.estimateGas({
        from: request.from,
        to: request.to,
        value: parseEther(request.amount)
      });

      // Get current gas price
      const feeData = await this.provider!.getFeeData();
      const gasPrice = feeData.gasPrice || parseEther('0.00000002'); // 20 gwei fallback

      // Calculate total cost (amount + gas)
      const gasCost = gasLimit * gasPrice;
      const totalCost = parseEther(request.amount) + gasCost;

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: formatEther(gasPrice),
        totalCost: formatEther(totalCost)
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw new Error('Failed to estimate transaction cost');
    }
  }

  // Check if sender has sufficient balance
  async checkBalance(address: string, amount: string): Promise<{ hasBalance: boolean; currentBalance: string; required: string }> {
    if (!this.provider) {
      await this.initProvider();
    }

    try {
      const balance = await this.provider!.getBalance(address);
      const required = parseEther(amount);
      
      // Estimate gas cost for the transaction
      const gasEstimate = await this.estimateGas({
        from: address,
        to: '0x0000000000000000000000000000000000000000', // dummy address for estimation
        amount: amount
      });
      
      const totalRequired = required + parseEther(gasEstimate.gasPrice) * BigInt(gasEstimate.gasLimit);

      return {
        hasBalance: balance >= totalRequired,
        currentBalance: formatEther(balance),
        required: formatEther(totalRequired)
      };
    } catch (error) {
      console.error('Failed to check balance:', error);
      return {
        hasBalance: false,
        currentBalance: '0.0',
        required: amount
      };
    }
  }

  // Send ETH transfer transaction
  async sendTransfer(request: TransferRequest): Promise<TransferResult> {
    try {
      // Validate request
      const validation = this.validateTransfer(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Initialize provider if needed
      if (!this.provider) {
        await this.initProvider();
      }

      // Get signer
      const signer = await this.provider!.getSigner();
      const signerAddress = await signer.getAddress();

      // Verify sender matches signer
      if (signerAddress.toLowerCase() !== request.from.toLowerCase()) {
        return {
          success: false,
          error: 'Connected account does not match sender address'
        };
      }

      // Check balance
      const balanceCheck = await this.checkBalance(request.from, request.amount);
      if (!balanceCheck.hasBalance) {
        return {
          success: false,
          error: `Insufficient balance. Available: ${balanceCheck.currentBalance} ETH, Required: ${balanceCheck.required} ETH`
        };
      }

      // Prepare transaction
      const tx = {
        to: request.to,
        value: parseEther(request.amount),
        ...(request.gasLimit && { gasLimit: request.gasLimit }),
        ...(request.gasPrice && { gasPrice: parseEther(request.gasPrice) })
      };

      // Send transaction
      console.log('Sending transaction:', tx);
      const transaction = await signer.sendTransaction(tx);
      
      console.log('Transaction sent, waiting for confirmation:', transaction.hash);
      
      // Wait for confirmation
      const receipt = await transaction.wait();

      if (receipt && receipt.status === 1) {
        const result: TransferResult = {
          success: true,
          txHash: transaction.hash,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: formatEther(receipt.gasPrice || 0n)
        };

        // Log transfer to backend (optional)
        try {
          await this.logTransfer({
            from: request.from,
            to: request.to,
            amount_eth: parseFloat(request.amount),
            tx_hash: transaction.hash,
            timestamp: new Date().toISOString(),
            gas_used: receipt.gasUsed.toString(),
            gas_price: formatEther(receipt.gasPrice || 0n),
            status: 'success'
          });
        } catch (logError) {
          console.warn('Failed to log transfer to backend:', logError);
          // Don't fail the transfer if logging fails
        }

        return result;
      } else {
        return {
          success: false,
          error: 'Transaction failed on blockchain'
        };
      }

    } catch (error: unknown) {
      console.error('Transfer failed:', error);
      
      let errorMessage = 'Failed to send transaction';
      const errorObj = error as { code?: number; message?: string; reason?: string };
      
      if (errorObj?.code === 4001) {
        errorMessage = 'Transaction cancelled by user';
      } else if (errorObj?.message) {
        errorMessage = errorObj.message;
      } else if (errorObj?.reason) {
        errorMessage = errorObj.reason;
      }

      // Log failed transfer
      try {
        await this.logTransfer({
          from: request.from,
          to: request.to,
          amount_eth: parseFloat(request.amount),
          tx_hash: '',
          timestamp: new Date().toISOString(),
          status: 'failed'
        });
      } catch (logError) {
        console.warn('Failed to log failed transfer:', logError);
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Log transfer to backend (optional)
  async logTransfer(transferLog: TransferLog): Promise<void> {
    try {
      await api.post('/wallet/transfer-log', transferLog);
    } catch (error) {
      console.error('Failed to log transfer:', error);
      throw error;
    }
  }

  // Get transfer history from backend
  async getTransferHistory(address?: string): Promise<TransferLog[]> {
    try {
      const params = address ? { address } : {};
      const response = await api.get('/wallet/transfer-history', { params });
      return response.data.transfers || [];
    } catch (error) {
      console.error('Failed to fetch transfer history:', error);
      return [];
    }
  }

  // Format ETH amount for display
  formatETH(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1) {
      return `${num.toFixed(4)} ETH`;
    } else {
      return `${num.toFixed(6)} ETH`;
    }
  }

  // Format address for display
  formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get recent recipients (stored locally)
  getRecentRecipients(): string[] {
    try {
      const recent = localStorage.getItem('finverse_recent_recipients');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Failed to get recent recipients:', error);
      return [];
    }
  }

  // Add recipient to recent list
  addRecentRecipient(address: string): void {
    try {
      const recent = this.getRecentRecipients();
      const updated = [address, ...recent.filter(addr => addr !== address)].slice(0, 5); // Keep last 5
      localStorage.setItem('finverse_recent_recipients', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent recipient:', error);
    }
  }

  // Get common testnet addresses
  getTestnetAddresses(): { name: string; address: string }[] {
    return [
      { name: 'Hardhat Account #0', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
      { name: 'Hardhat Account #1', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
      { name: 'Hardhat Account #2', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
      { name: 'Hardhat Account #3', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
      { name: 'Hardhat Account #4', address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' },
    ];
  }
}

// Export singleton instance
export const transferService = new TransferService(); 