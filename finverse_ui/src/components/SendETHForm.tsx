import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Loader2, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  Wallet,
  RefreshCw,
  ArrowRight,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { BrowserProvider, parseUnits, formatUnits, isAddress } from 'ethers';
import { ethTransferApi, walletApi } from '@/lib/api';
import { TransferSuccessModal } from './TransferSuccessModal';

interface SendETHFormProps {
  onSendSuccess?: (txHash: string, amount: string, recipient: string) => void;
  onSendError?: (error: string) => void;
  className?: string;
}

type TransactionStatus = 'idle' | 'validating' | 'pending' | 'confirming' | 'confirmed' | 'failed';

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
  totalCostFormatted: string;
}



export function SendETHForm({ onSendSuccess, onSendError, className }: SendETHFormProps) {
  // State management
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    amount: string;
    fromAddress: string;
    toAddress: string;
    txHash: string;
    gasUsed?: string;
    gasPrice?: string;
    timestamp: string;
  } | null>(null);

  const [recipientError, setRecipientError] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');

  const { toast } = useToast();
  const {
    isConnected,
    isCorrectNetwork,
    accountAddress,
    formattedBalanceETH,
    balanceETH,
    connectWallet,
    switchToHardhatNetwork,
    refreshBalances
  } = useWallet();

  // Validation helpers
  const validateRecipient = useCallback((address: string) => {
    if (!address) {
      setRecipientError('');
      return false;
    }

    if (!isAddress(address)) {
      setRecipientError('Invalid Ethereum address format');
      return false;
    }

    if (address.toLowerCase() === accountAddress?.toLowerCase()) {
      setRecipientError('Cannot send to your own address');
      return false;
    }

    setRecipientError('');
    return true;
  }, [accountAddress]);

  const validateAmount = useCallback((value: string) => {
    if (!value) {
      setAmountError('');
      return false;
    }

    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }

    if (numValue < 0.0001) {
      setAmountError('Minimum amount is 0.0001 ETH');
      return false;
    }

    const balance = parseFloat(balanceETH || '0');
    const reserveForGas = 0.01; // Reserve ETH for gas
    const maxSendable = Math.max(0, balance - reserveForGas);

    if (numValue > maxSendable) {
      setAmountError(`Insufficient balance. Max sendable: ${maxSendable.toFixed(4)} ETH (reserves 0.01 ETH for gas)`);
      return false;
    }

    setAmountError('');
    return true;
  }, [balanceETH]);

  // Real-time validation
  useEffect(() => {
    validateRecipient(recipient);
  }, [recipient, validateRecipient]);

  useEffect(() => {
    validateAmount(amount);
  }, [amount, validateAmount]);

  // Gas estimation
  const estimateGas = useCallback(async () => {
    if (!recipient || !amount || !isAddress(recipient) || !accountAddress) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    try {
      setTxStatus('validating');
      
      const provider = new BrowserProvider(window.ethereum!);
      
      // Estimate gas for ETH transfer
      const gasLimit = await provider.estimateGas({
        to: recipient,
        value: parseUnits(amount, 18),
        from: accountAddress
      });

      // 🎯 Fix MetaMask RPC Error: Use legacy gas pricing for Hardhat/local networks
      let gasPrice: bigint;
      try {
        // Try feeData first but use only gasPrice (legacy) field
        const feeData = await provider.getFeeData();
        if (feeData.gasPrice) {
          gasPrice = feeData.gasPrice;
          console.log('✅ Using legacy gasPrice:', formatUnits(gasPrice, 'gwei'), 'gwei');
        } else {
          // Fallback to a reasonable default for local networks
          gasPrice = parseUnits('20', 'gwei'); // 20 gwei default
          console.log('✅ Using fallback gasPrice:', formatUnits(gasPrice, 'gwei'), 'gwei');
        }
      } catch (gasPriceErr) {
        console.warn('⚠️ Failed to get gasPrice, using default:', gasPriceErr);
        gasPrice = parseUnits('20', 'gwei'); // 20 gwei default
        console.log('✅ Using default gasPrice:', formatUnits(gasPrice, 'gwei'), 'gwei');
      }
      
      const totalCostWei = gasLimit * gasPrice;
      const totalCostEth = formatUnits(totalCostWei, 18);

      setGasEstimate({
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        totalCost: totalCostWei.toString(),
        totalCostFormatted: parseFloat(totalCostEth).toFixed(6)
      });
      
      setTxStatus('idle');
    } catch (err: unknown) {
      console.error('Gas estimation failed:', err);
      setGasEstimate(null);
      setTxStatus('idle');
    }
  }, [recipient, amount, accountAddress]);

  // Debounced gas estimation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (recipient && amount && !recipientError && !amountError) {
        estimateGas();
      } else {
        setGasEstimate(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [recipient, amount, recipientError, amountError, estimateGas]);

  // Handle input changes
  const handleRecipientChange = (value: string) => {
    setRecipient(value.trim());
    setError('');
  };

  const handleAmountChange = (value: string) => {
    // Allow only valid decimal input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleUseMax = () => {
    const balance = parseFloat(balanceETH || '0');
    const reserveForGas = gasEstimate ? parseFloat(gasEstimate.totalCostFormatted) + 0.001 : 0.01;
    const maxAmount = Math.max(0, balance - reserveForGas);
    
    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(6));
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  // Log transaction to backend using wallet endpoint (as per requirements)
  const logTransactionToBackend = async (
    txHash: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    gasUsed?: string,
    gasPrice?: string,
    retryCount: number = 0
  ): Promise<{ success: boolean; error?: string }> => {
    const MAX_RETRIES = 2;
    
    // 🎯 OPTIMIZED: Create complete payload with all required fields per specifications
    const payload = {
      from_address: fromAddress.toLowerCase(),
      to_address: toAddress.toLowerCase(),
      amount_eth: parseFloat(amount), // Ensure proper ETH unit from formatEther
      tx_hash: txHash.toLowerCase(),
      gas_price: gasPrice, // From txReceipt.gasPrice.toString()
      gas_used: gasUsed, // From txReceipt.gasUsed.toString()
      status: 'success', // Set to 'success' for confirmed transactions
      notes: 'ETH transfer via SendETH UI',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Attempting to log ETH transfer to backend:', {
      tx_hash: payload.tx_hash,
      from: payload.from_address,
      to: payload.to_address,
      amount: payload.amount_eth,
      payload: payload
    });
    
    try {
      // Primary: Use wallet endpoint as specified in requirements
      console.log('🔄 Calling walletApi.logEthTransfer...');
      const response = await walletApi.logEthTransfer(payload);
      console.log('✅ Transaction logged to backend successfully (wallet endpoint):', response);
      return { success: true };
    } catch (err) {
      console.warn('⚠️ Wallet endpoint failed:', err);
      console.warn('⚠️ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        status: err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response?.status : undefined,
        data: err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: unknown } }).response?.data : undefined
      });
      
      // Fallback: Use eth-transfer endpoint
      try {
        console.log('🔄 Trying eth-transfer endpoint fallback...');
        const response = await ethTransferApi.logEthTransfer(payload);
        console.log('✅ Transaction logged to backend successfully (eth-transfer endpoint):', response);
        return { success: true };
      } catch (fallbackErr) {
        console.error('❌ Failed to log transaction to backend on both endpoints:', fallbackErr);
        console.error('❌ Fallback error details:', JSON.stringify(fallbackErr, null, 2));
        
        // Retry mechanism with exponential backoff
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 Retrying DB logging (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return logTransactionToBackend(txHash, fromAddress, toAddress, amount, gasUsed, gasPrice, retryCount + 1);
        }
        
        const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    }
  };

  // Main send function
  const handleSend = async () => {
    if (!isConnected || !isCorrectNetwork || !accountAddress) {
      setError('Please connect your wallet and switch to the correct network');
      return;
    }

    if (!recipient || !amount || recipientError || amountError) {
      setError('Please fix validation errors before sending');
      return;
    }

    try {
      setTxStatus('pending');
      setError('');
      setTxHash('');

      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      // Convert amount to wei
      const amountWei = parseUnits(amount, 18);

      // 🎯 Fix MetaMask RPC Error: Use legacy gas pricing for Hardhat/local networks
      let gasPrice: bigint;
      try {
        // Get gas price using legacy method (avoid EIP-1559)
        const feeData = await provider.getFeeData();
        gasPrice = feeData.gasPrice || parseUnits('20', 'gwei');
        console.log('✅ Transaction using legacy gasPrice:', formatUnits(gasPrice, 'gwei'), 'gwei');
      } catch (gasPriceErr) {
        console.warn('⚠️ Failed to get gasPrice, using default:', gasPriceErr);
        gasPrice = parseUnits('20', 'gwei'); // 20 gwei default
      }

      // Send ETH transaction with explicit legacy gas pricing
      const tx = await signer.sendTransaction({
        to: recipient,
        value: amountWei,
        gasPrice, // ✅ Use legacy gasPrice (avoid EIP-1559 maxFeePerGas/maxPriorityFeePerGas)
        ...(gasEstimate && { gasLimit: gasEstimate.gasLimit })
      });

      setTxHash(tx.hash);
      setTxStatus('confirming');

      toast({
        title: "Transaction Submitted",
        description: `Sending ${amount} ETH to ${recipient.slice(0, 6)}...${recipient.slice(-4)} • Tx: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`,
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        setTxStatus('confirmed');

        // 🛑 CRITICAL: Log successful transaction to backend BEFORE showing success
        const dbLoggingResult = await logTransactionToBackend(
          tx.hash,
          accountAddress,
          recipient,
          amount,
          receipt.gasUsed?.toString(),
          receipt.gasPrice?.toString()
        );

        if (dbLoggingResult.success) {
          // ✅ Both transaction AND DB logging succeeded
          toast({
            title: "✅ ETH Sent Successfully",
            description: `Successfully sent ${amount} ETH • Tx: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
          });
        } else {
          // ⚠️ Transaction succeeded but DB logging failed
          toast({
            title: "⚠️ ETH sent, but failed to log transfer",
            description: `ETH sent successfully, but failed to log transfer. Please refresh manually. Error: ${dbLoggingResult.error}`,
            variant: "destructive"
          });
        }

        // Set success modal details
        setSuccessDetails({
          amount,
          fromAddress: accountAddress,
          toAddress: recipient,
          txHash: tx.hash,
          gasUsed: receipt.gasUsed?.toString(),
          gasPrice: receipt.gasPrice?.toString(),
          timestamp: new Date().toISOString()
        });
        setShowSuccessModal(true);

        // Refresh balances
        await refreshBalances();

        // 🎯 FIX: Only call success callback after DB logging succeeds
        if (dbLoggingResult.success && onSendSuccess) {
          onSendSuccess(tx.hash, amount, recipient);
        }

        // Reset form
        setAmount('');
        setRecipient('');
        setGasEstimate(null);
      } else {
        throw new Error('Transaction failed');
      }

    } catch (err: unknown) {
      console.error('❌ ETH transfer failed:', err);
      setTxStatus('failed');
      
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      setError(errorMessage);

      // Log failed transaction if we have a hash
      if (txHash) {
        try {
          await logTransactionToBackend(
            txHash,
            accountAddress!,
            recipient,
            amount,
            undefined,
            undefined,
            0  // retryCount parameter
          );
        } catch (logErr) {
          console.warn('⚠️ Failed to log failed transaction:', logErr);
          // Don't show another error toast, user already knows the transaction failed
        }
      }

      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (onSendError) {
        onSendError(errorMessage);
      }
    }
  };

  // Form validation
  const isFormValid = 
    isConnected && 
    isCorrectNetwork && 
    recipient && 
    amount && 
    !recipientError && 
    !amountError && 
    txStatus === 'idle';

  // Connection checks
  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send ETH
          </CardTitle>
          <CardDescription>Connect your wallet to send ETH</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectWallet} className="w-full">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Wrong Network
          </CardTitle>
          <CardDescription>Switch to Hardhat Local network to send ETH</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={switchToHardhatNetwork} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Switch to Hardhat Local
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 h-5" />
          Send ETH
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Transfer ETH to any Ethereum address</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Transfer ETH directly to another Ethereum address
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Wallet Info */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your ETH Balance</p>
              <p className="text-xl font-bold">{formattedBalanceETH} ETH</p>
            </div>
            <Badge variant="secondary">
              {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Recipient Address */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <div className="flex gap-2">
            <Input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              className={recipientError ? 'border-red-500' : ''}
            />
            {recipient && isAddress(recipient) && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(recipient)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          {recipientError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {recipientError}
            </p>
          )}
          {recipient && isAddress(recipient) && !recipientError && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Valid Ethereum address
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (ETH)</Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.0001"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={amountError ? "border-red-500" : ""}
              autoComplete="off"
              spellCheck="false"
            />
            <Button 
              type="button"
              variant="outline"
              onClick={handleUseMax}
              disabled={!balanceETH || parseFloat(balanceETH) <= 0.01}
            >
              Max
            </Button>
          </div>
          
          {amountError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {amountError}
            </p>
          )}
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available: {formattedBalanceETH} ETH</span>
            <span>Minimum: 0.0001 ETH</span>
          </div>
        </div>

        {/* Gas Estimation */}
        {gasEstimate && (
          <div className="space-y-2">
            <Label className="text-sm">Estimated Gas Fee</Label>
            <div className="text-sm p-3 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>Gas Fee:</span>
                <span className="font-medium">~{gasEstimate.totalCostFormatted} ETH</span>
              </div>
            </div>
          </div>
        )}

        {txStatus === 'validating' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Estimating gas fee...</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Transaction Status */}
        {txStatus !== 'idle' && txStatus !== 'validating' && (
          <Alert className={txStatus === 'confirmed' ? 'border-green-200 bg-green-50' : ''}>
            <div className="flex items-center gap-2">
              {txStatus === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
              {txStatus === 'confirming' && <Loader2 className="h-4 w-4 animate-spin" />}
              {txStatus === 'confirmed' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {txStatus === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription>
                {txStatus === 'pending' && 'Preparing transaction...'}
                {txStatus === 'confirming' && 'Confirming transaction...'}
                {txStatus === 'confirmed' && 'Transaction confirmed!'}
                {txStatus === 'failed' && 'Transaction failed'}
                {txHash && (
                  <div className="mt-1 flex items-center gap-2">
                    <a 
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                    >
                      View Transaction <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(txHash)}
                      className="h-6 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Send Button */}
        <Button 
          onClick={handleSend}
          disabled={!isFormValid || txStatus !== 'idle'}
          className="w-full"
          size="lg"
        >
          {(txStatus === 'pending' || txStatus === 'confirming') ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {txStatus === 'pending' ? 'Preparing...' : 'Confirming...'}
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Send ETH
            </>
          )}
        </Button>

        {/* Transaction Summary */}
        {amount && recipient && isAddress(recipient) && !recipientError && !amountError && (
          <div className="text-sm p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-3">Transaction Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sending:</span>
                <span className="font-medium">{amount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-mono text-xs">{recipient.slice(0, 10)}...{recipient.slice(-8)}</span>
              </div>
              {gasEstimate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Gas Fee:</span>
                  <span className="font-medium">~{gasEstimate.totalCostFormatted} ETH</span>
                </div>
              )}
              {gasEstimate && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground font-medium">Total Cost:</span>
                  <span className="font-bold">
                    ~{(parseFloat(amount) + parseFloat(gasEstimate.totalCostFormatted)).toFixed(6)} ETH
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Success Modal */}
      {successDetails && (
        <TransferSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          transferDetails={successDetails}
        />
      )}
    </Card>
  );
} 