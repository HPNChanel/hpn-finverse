import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { BrowserProvider, Contract, parseUnits, formatUnits, isAddress } from 'ethers';
import api from '@/lib/api';

// Type definitions
interface SendTokenFormProps {
  onSendSuccess?: (txHash: string, token: string, amount: string, recipient: string) => void;
  onSendError?: (error: string) => void;
}

type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed';

interface Token {
  symbol: string;
  name: string;
  address?: string;
  decimals: number;
  isNative: boolean;
}

export function SendTokenForm({ onSendSuccess, onSendError }: SendTokenFormProps) {
  const [selectedToken, setSelectedToken] = useState<string>('ETH');
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const { toast } = useToast();
  const {
    isConnected,
    isCorrectNetwork,
    accountAddress,
    formattedBalanceETH,
    balanceETH,
    connectWallet,
    switchToHardhatNetwork
  } = useWallet();

  // Available tokens
  const tokens: Token[] = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true
    },
    {
      symbol: 'FVT',
      name: 'FinVerse Token',
      address: '', // Will be loaded from contracts.json
      decimals: 18,
      isNative: false
    }
  ];

  const selectedTokenData = tokens.find(t => t.symbol === selectedToken);
  const userBalance = selectedToken === 'ETH' ? balanceETH : '0';
  const formattedBalance = selectedToken === 'ETH' ? formattedBalanceETH : '0.000';

  const isFormValid = selectedToken && recipient && amount && 
                     parseFloat(amount) > 0 && 
                     isAddress(recipient) &&
                     isConnected && 
                     isCorrectNetwork;

  const validateAmountInput = (value: string): boolean => {
    if (!value) {
      setValidationError('');
      return true;
    }

    const decimalPattern = /^\d*(\.\d{0,8})?$/;
    if (!decimalPattern.test(value)) {
      setValidationError('Invalid format. Use up to 8 decimal places.');
      return false;
    }

    if (value.includes('e') || value.includes('E') || value.includes('+') || value.includes('-')) {
      setValidationError('Scientific notation not allowed.');
      return false;
    }

    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      setValidationError('Invalid number format.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleAmountChange = useCallback((value: string) => {
    if (validateAmountInput(value)) {
      setAmount(value);
      setError('');
      setGasEstimate('');
    }
  }, []);

  const handleRecipientChange = useCallback((value: string) => {
    setRecipient(value);
    setError('');
    
    // Validate address format
    if (value && !isAddress(value)) {
      setError('Invalid recipient address');
    } else {
      setError('');
    }
  }, []);

  const validateSendAmount = useCallback(() => {
    if (!amount || !userBalance || validationError) return false;
    
    try {
      const amountWei = parseUnits(amount, 18);
      const amountNum = parseFloat(formatUnits(amountWei, 18));
      const balanceNum = parseFloat(userBalance);

      if (amountNum <= 0) {
        setError('Amount must be greater than 0');
        return false;
      }

      const maxAmount = selectedToken === 'ETH' ? balanceNum - 0.01 : balanceNum;
      
      if (amountNum > maxAmount) {
        if (selectedToken === 'ETH') {
          setError(`Insufficient balance. Max sendable: ${maxAmount.toFixed(4)} ETH (reserves 0.01 ETH for gas)`);
        } else {
          setError(`Insufficient balance. You have ${formattedBalance} ${selectedToken}`);
        }
        return false;
      }
      
      setError('');
      return true;
    } catch {
      setError('Invalid amount format');
      return false;
    }
  }, [amount, userBalance, validationError, selectedToken, formattedBalance]);

  const estimateGas = async () => {
    if (!isFormValid || !validateSendAmount()) return;

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let gasEstimateWei: bigint;
      
      if (selectedToken === 'ETH') {
        // Estimate gas for ETH transfer using ethers v6
        gasEstimateWei = await provider.estimateGas({
          to: recipient,
          value: parseUnits(amount, 18),
          from: accountAddress
        });
      } else {
        // Estimate gas for token transfer
        const contractsResponse = await fetch('/contracts/contracts.json');
        const contractsData = await contractsResponse.json();
        const tokenAddress = contractsData.contracts.MockERC20.address;

        const tokenAbi = ["function transfer(address to, uint256 amount) returns (bool)"];
        const tokenContract = new Contract(tokenAddress, tokenAbi, signer);
        
        gasEstimateWei = await tokenContract.transfer.estimateGas(
          recipient, 
          parseUnits(amount, 18)
        );
      }

      const gasPrice = (await provider.getFeeData()).gasPrice || 0n;
      const gasCostWei = gasEstimateWei * gasPrice;
      const gasCostEth = formatUnits(gasCostWei, 18);
      
      setGasEstimate(gasCostEth);
      
    } catch (err: any) {
      console.error('Gas estimation failed:', err);
      setGasEstimate('Unable to estimate');
    }
  };

  const handleSend = async () => {
    if (!isFormValid || !validateSendAmount()) return;

    try {
      setTxStatus('pending');
      setError('');

      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let tx;

      // Convert amount to wei using parseUnits
      const amountWei = parseUnits(amount, 18);

      if (selectedToken === 'ETH') {
        // 🎯 Fix MetaMask RPC Error: Use legacy gas pricing for Hardhat/local networks
        let gasPrice: bigint;
        try {
          const feeData = await provider.getFeeData();
          gasPrice = feeData.gasPrice || parseUnits('20', 'gwei');
          console.log('✅ SendTokenForm using legacy gasPrice:', formatUnits(gasPrice, 'gwei'), 'gwei');
        } catch (gasPriceErr) {
          console.warn('⚠️ Failed to get gasPrice, using default:', gasPriceErr);
          gasPrice = parseUnits('20', 'gwei');
        }

        // Send ETH using ethers v6 with legacy gas pricing
        tx = await signer.sendTransaction({
          to: recipient,
          value: amountWei,
          gasPrice // ✅ Use legacy gasPrice (avoid EIP-1559)
        });
      } else {
        // Send FVT tokens
        const contractsResponse = await fetch('/contracts/contracts.json');
        const contractsData = await contractsResponse.json();
        const tokenAddress = contractsData.contracts.MockERC20.address;

        const tokenAbi = ["function transfer(address to, uint256 amount) returns (bool)"];
        const tokenContract = new Contract(tokenAddress, tokenAbi, signer);
        
        tx = await tokenContract.transfer(recipient, amountWei);
      }

      setTxHash(tx.hash);
      setTxStatus('confirming');

      toast({
        title: "Transaction Submitted",
        description: `Sending ${amount} ${selectedToken} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        setTxStatus('confirmed');

        // 🎯 NEW: Log ETH transfers to backend database
        if (selectedToken === 'ETH') {
          try {
            const signerAddress = await signer.getAddress();
            const payload = {
              from_address: signerAddress.toLowerCase(),
              to_address: recipient.toLowerCase(),
              amount_eth: parseFloat(amount),
              tx_hash: tx.hash.toLowerCase(),
              timestamp: new Date().toISOString(),
              gas_used: receipt.gasUsed?.toString(),
              gas_price: receipt.gasPrice?.toString(),
              notes: 'ETH transfer via SendTokenForm (staking)',
              status: 'success'
            };

            console.log('🔄 Logging ETH transfer to backend:', payload);
            
            // ✅ FIX: Use shared axios instance (ensures correct baseURL to localhost:8000)
            const response = await api.post('/wallet/eth-transfer', payload);
            console.log('✅ ETH transfer logged successfully:', response.data);
              
            toast({
              title: "✅ ETH Sent and Logged Successfully",
              description: `Successfully sent ${amount} ETH • Tx: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`,
            });
          } catch (logError) {
            console.error('❌ Failed to log ETH transfer:', logError);
            
            toast({
              title: "⚠️ ETH sent, but failed to log transfer",
              description: `ETH sent successfully, but failed to log transfer. Error: ${logError instanceof Error ? logError.message : 'Unknown error'}`,
              variant: "destructive"
            });
          }
        } else {
          // For non-ETH tokens, show standard success message
          toast({
            title: "Transfer Successful!",
            description: `Successfully sent ${amount} ${selectedToken}`,
          });
        }

        // Call success callback
        if (onSendSuccess) {
          onSendSuccess(tx.hash, selectedToken, amount, recipient);
        }

        // Reset form
        setAmount('');
        setRecipient('');
        setGasEstimate('');
      } else {
        throw new Error('Transaction failed on blockchain');
      }
      
    } catch (err: any) {
      console.error('Send error:', err);
      setTxStatus('failed');
      
      let errorMessage = 'Transaction failed';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const getStatusIcon = () => {
    switch (txStatus) {
      case 'pending':
      case 'confirming':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (txStatus) {
      case 'pending':
        return 'Preparing transaction...';
      case 'confirming':
        return 'Confirming transaction...';
      case 'confirmed':
        return 'Transaction confirmed!';
      case 'failed':
        return 'Transaction failed';
      default:
        return '';
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Send Tokens</CardTitle>
          <CardDescription>Connect your wallet to send tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Wrong Network</CardTitle>
          <CardDescription>Please switch to Hardhat Local network</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={switchToHardhatNetwork} className="w-full">
            Switch Network
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Tokens
        </CardTitle>
        <CardDescription>
          ⚠️ DEPRECATED: Use the new ETH-only Send feature at /send-eth
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Deprecation Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>This component is deprecated.</strong> Please use the new ETH-only Send feature at{' '}
            <a href="/send-eth" className="text-primary hover:underline font-medium">
              /send-eth
            </a>{' '}
            for better security and tracking.
          </AlertDescription>
        </Alert>

        {/* Token Selection */}
        <div className="space-y-2">
          <Label htmlFor="token">Choose Token</Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger>
              <SelectValue placeholder="Select token to send" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span>{token.symbol}</span>
                      <span className="text-muted-foreground text-xs">
                        {token.name}
                      </span>
                    </div>
                    {token.isNative && (
                      <Badge variant="outline" className="ml-2">Native</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTokenData && (
            <div className="text-sm text-muted-foreground">
              Balance: {formattedBalance} {selectedToken}
            </div>
          )}
        </div>

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
              className={!recipient || isAddress(recipient) ? '' : 'border-red-500'}
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
          {recipient === accountAddress && (
            <p className="text-sm text-yellow-600">⚠️ You're sending to yourself</p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            pattern="^\d*(\.\d{0,8})?$"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onBlur={validateSendAmount}
            className={validationError ? "border-red-500" : ""}
            autoComplete="off"
            spellCheck="false"
          />
          
          {validationError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {validationError}
            </p>
          )}
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available: {formattedBalance} {selectedToken}</span>
            <button 
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                const maxAmount = selectedToken === 'ETH' 
                  ? Math.max(0, parseFloat(userBalance || '0') - 0.01).toFixed(8).replace(/\.?0+$/, '')
                  : (parseFloat(userBalance || '0')).toFixed(8).replace(/\.?0+$/, '');
                handleAmountChange(maxAmount);
              }}
            >
              Use Max
            </button>
          </div>
        </div>

        {/* Gas Estimation */}
        {amount && recipient && isAddress(recipient) && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Estimated Gas Fee</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={estimateGas}
                disabled={!isFormValid}
              >
                Estimate
              </Button>
            </div>
            {gasEstimate && (
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                {gasEstimate !== 'Unable to estimate' ? (
                  <p>~{parseFloat(gasEstimate).toFixed(6)} ETH</p>
                ) : (
                  <p className="text-yellow-600">Unable to estimate gas</p>
                )}
              </div>
            )}
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
        {txStatus !== 'idle' && (
          <Alert>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <AlertDescription>
                {getStatusText()}
                {txHash && (
                  <div className="mt-1">
                    <a 
                      href={`https://localhost:8545/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      View Transaction
                    </a>
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Send Button */}
        <Button 
          onClick={handleSend}
          disabled={!isFormValid || txStatus === 'pending' || txStatus === 'confirming'}
          className="w-full"
        >
          {txStatus === 'pending' || txStatus === 'confirming' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {txStatus === 'pending' ? 'Preparing...' : 'Confirming...'}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send {selectedToken}
            </>
          )}
        </Button>

        {/* Transaction Summary */}
        {amount && recipient && selectedToken && isAddress(recipient) && (
          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Transaction Summary</h4>
            <div className="space-y-1">
              <p>Sending: {amount} {selectedToken}</p>
              <p>To: {recipient.slice(0, 6)}...{recipient.slice(-4)}</p>
              {gasEstimate && gasEstimate !== 'Unable to estimate' && (
                <p>Est. Gas: ~{parseFloat(gasEstimate).toFixed(6)} ETH</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
