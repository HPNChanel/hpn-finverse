import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { getTokenAddress, getStakeVaultAddress } from '@/utils/contractLoader';

interface StakePool {
  id: string;
  name: string;
  apy: number;
  lockPeriodDays: number;
  minStake: string;
  maxStake?: string;
  description: string;
  isActive: boolean;
}

interface LockPeriodOption {
  label: string;
  value: number; // in seconds
  days: number;
  bonusApy?: number;
}

interface StakeFormProps {
  pools: StakePool[];
  onStakeSuccess?: (txHash: string, amount: number, poolId: string) => void;
  onStakeError?: (error: string) => void;
}

type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed';

export function StakeForm({ pools, onStakeSuccess, onStakeError }: StakeFormProps) {
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [lockPeriod, setLockPeriod] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  
  const { toast } = useToast();
  const {
    isConnected,
    isCorrectNetwork,
    accountAddress,
    formattedBalanceFVT,
    balanceFVT,
    connectWallet,
    switchToHardhatNetwork
  } = useWallet();

  // Lock period options with bonus APY
  const lockPeriodOptions: LockPeriodOption[] = [
    { label: '30 Days', value: 30 * 24 * 60 * 60, days: 30 },
    { label: '60 Days (+2% Bonus)', value: 60 * 24 * 60 * 60, days: 60, bonusApy: 2 },
    { label: '90 Days (+5% Bonus)', value: 90 * 24 * 60 * 60, days: 90, bonusApy: 5 },
    { label: '180 Days (+10% Bonus)', value: 180 * 24 * 60 * 60, days: 180, bonusApy: 10 },
  ];

  const selectedPoolData = pools.find(p => p.id === selectedPool);
  const selectedLockData = lockPeriodOptions.find(l => l.value.toString() === lockPeriod);
  
  const isFormValid = selectedPool && amount && lockPeriod && 
                     parseFloat(amount) > 0 && 
                     isConnected && 
                     isCorrectNetwork;

  // Enhanced amount validation
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
    }
  }, []);

  const validateStakeAmount = useCallback(() => {
    if (!selectedPoolData || !amount || validationError) return false;
    
    try {
      const amountWei = parseUnits(amount, 18);
      const amountNum = parseFloat(formatUnits(amountWei, 18));
      const minStake = parseFloat(selectedPoolData.minStake);
      const maxStake = selectedPoolData.maxStake ? parseFloat(selectedPoolData.maxStake) : Infinity;
      const userBalance = parseFloat(balanceFVT || '0');

      if (amountNum < minStake) {
        setError(`Minimum stake amount is ${selectedPoolData.minStake} FVT`);
        return false;
      }
      if (amountNum > maxStake) {
        setError(`Maximum stake amount is ${selectedPoolData.maxStake} FVT`);
        return false;
      }
      if (amountNum > userBalance) {
        setError(`Insufficient balance. You have ${formattedBalanceFVT} FVT`);
        return false;
      }
      
      setError('');
      return true;
    } catch (parseError) {
      setError('Invalid amount format');
      return false;
    }
  }, [selectedPoolData, amount, validationError, balanceFVT, formattedBalanceFVT]);

  const handleStake = async () => {
    if (!isFormValid || !validateStakeAmount()) return;

    try {
      setTxStatus('pending');
      setError('');

      // Get contract instances
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Load contract addresses dynamically
      const [tokenAddress, vaultAddress] = await Promise.all([
        getTokenAddress(),
        getStakeVaultAddress()
      ]);

      // Contract ABIs
      const tokenAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)"
      ];

      const vaultAbi = [
        "function stake(uint256 amount)",
        "function stakingToken() view returns (address)"
      ];

      const tokenContract = new Contract(tokenAddress, tokenAbi, signer);
      const vaultContract = new Contract(vaultAddress, vaultAbi, signer);

      // Convert amount to wei using parseUnits
      const amountWei = parseUnits(amount, 18);

      // Pre-transaction validation
      console.log('Validating transaction...');
      
      // Check user balance
      const userBalance = await tokenContract.balanceOf(accountAddress);
      if (userBalance < amountWei) {
        throw new Error('Insufficient token balance');
      }

      // Check allowance
      const currentAllowance = await tokenContract.allowance(accountAddress, vaultAddress);
      
      if (currentAllowance < amountWei) {
        toast({
          title: "Approval Required",
          description: "Please approve token spending in MetaMask",
        });

        // Request approval
        const approveTx = await tokenContract.approve(vaultAddress, amountWei);
        setTxStatus('confirming');
        setTxHash(approveTx.hash);
        
        await approveTx.wait();
        
        toast({
          title: "Approval Confirmed",
          description: "Now proceeding with stake transaction",
        });
      }

      // Execute stake transaction with gas estimation
      setTxStatus('pending');
      
      try {
        // Estimate gas first to catch revert errors early
        const gasEstimate = await vaultContract.stake.estimateGas(amountWei);
        console.log('Gas estimate:', gasEstimate.toString());
        
        const stakeTx = await vaultContract.stake(amountWei, {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        });
        
        setTxHash(stakeTx.hash);
        setTxStatus('confirming');

        toast({
          title: "Transaction Submitted",
          description: `Staking ${amount} FVT tokens...`,
        });

        // Wait for confirmation
        const receipt = await stakeTx.wait();
        setTxStatus('confirmed');

        toast({
          title: "Stake Successful!",
          description: `Successfully staked ${amount} FVT tokens`,
        });

        // Call success callback
        if (onStakeSuccess) {
          onStakeSuccess(stakeTx.hash, parseFloat(amount), selectedPool);
        }

        // Reset form
        setAmount('');
        setSelectedPool('');
        setLockPeriod('');
        
      } catch (gasError) {
        console.error('Gas estimation or execution failed:', gasError);
        throw gasError;
      }
      
    } catch (err: any) {
      console.error('Staking error:', err);
      
      // Enhanced error logging
      console.error('Error details:', {
        code: err.code,
        reason: err.reason,
        message: err.message,
        data: err.data
      });
      
      setTxStatus('failed');
      
      const errorMessage = ErrorHandler.handleStakingError(err, 'stake');
      setError(errorMessage);
      
      toast({
        title: "Staking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (onStakeError) {
        onStakeError(errorMessage);
      }
    }
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
          <CardTitle>Stake FVT Tokens</CardTitle>
          <CardDescription>Connect your wallet to start staking</CardDescription>
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
    <Card className="w-full max-w-md overflow-visible">
      <CardHeader>
        <CardTitle>Stake FVT Tokens</CardTitle>
        <CardDescription>
          Earn rewards by staking your FVT tokens
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 overflow-visible">
        {/* Wallet Info */}
        <div className="text-sm text-muted-foreground">
          <p>Balance: {formattedBalanceFVT} FVT</p>
        </div>

        {/* Pool Selection */}
        <div className="space-y-2">
          <Label htmlFor="pool">Select Pool</Label>
          <Select value={selectedPool} onValueChange={setSelectedPool}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a staking pool" />
            </SelectTrigger>
            <SelectContent>
              {pools.filter(p => p.isActive).map((pool, index) => {
                // Safe key validation using Number.isFinite
                const poolIdParsed = pool.id ? Number(pool.id) : NaN;
                const isValidPoolId = Number.isFinite(poolIdParsed) && poolIdParsed >= 0;
                const safeKey = isValidPoolId ? `stake-form-pool-${poolIdParsed}` : `stake-form-fallback-${index}`;
                
                // Log pool key validation for debugging
                if (!isValidPoolId) {
                  console.warn(`⚠️ StakeForm pool with invalid key:`, {
                    poolData: pool,
                    originalKey: pool.id,
                    parsedKey: poolIdParsed,
                    fallbackKey: safeKey,
                    index
                  });
                }

                return (
                  <SelectItem key={safeKey} value={pool.id || `fallback-${index}`}>
                    <div className="flex items-center justify-between w-full">
                      <span>{pool.name || `Pool ${index + 1}`}</span>
                      <Badge variant="secondary">{pool.apy || 0}% APY</Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {selectedPoolData && (
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
              <p>{selectedPoolData.description}</p>
              <p>Min: {selectedPoolData.minStake} FVT</p>
              {selectedPoolData.maxStake && (
                <p>Max: {selectedPoolData.maxStake} FVT</p>
              )}
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount to Stake</Label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            pattern="^\d*(\.\d{0,8})?$"
            placeholder="0.00000000"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onBlur={validateStakeAmount}
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
          
          {selectedPoolData && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {selectedPoolData.minStake} FVT</span>
              <button 
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  const maxAmount = (parseFloat(balanceFVT || '0')).toFixed(8).replace(/\.?0+$/, '');
                  handleAmountChange(maxAmount);
                }}
              >
                Use Max
              </button>
            </div>
          )}
        </div>

        {/* Lock Period Selection */}
        <div className="space-y-2">
          <Label htmlFor="lockPeriod">
            Lock Period
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-1 inline" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Longer lock periods earn bonus APY</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select value={lockPeriod} onValueChange={setLockPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Choose lock period" />
            </SelectTrigger>
            <SelectContent>
              {lockPeriodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.bonusApy && (
                      <Badge variant="outline" className="ml-2">
                        +{option.bonusApy}%
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedLockData && selectedPoolData && (
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
              <p>
                Total APY: {selectedPoolData.apy + (selectedLockData.bonusApy || 0)}%
                {selectedLockData.bonusApy && (
                  <span className="text-green-600 ml-1">
                    (+{selectedLockData.bonusApy}% bonus)
                  </span>
                )}
              </p>
              <p>Lock until: {new Date(Date.now() + selectedLockData.value * 1000).toLocaleDateString()}</p>
            </div>
          )}
        </div>

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

        {/* Submit Button */}
        <Button 
          onClick={handleStake}
          disabled={!isFormValid || txStatus === 'pending' || txStatus === 'confirming'}
          className="w-full"
        >
          {txStatus === 'pending' || txStatus === 'confirming' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {txStatus === 'pending' ? 'Preparing...' : 'Confirming...'}
            </>
          ) : (
            'Stake Tokens'
          )}
        </Button>

        {/* Estimated Rewards */}
        {amount && selectedPoolData && selectedLockData && !validationError && (
          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg overflow-visible">
            <h4 className="font-medium mb-2">Estimated Rewards</h4>
            <div className="space-y-1">
              <p>
                Daily: {(() => {
                  try {
                    const amountWei = parseUnits(amount, 18);
                    const amountNum = parseFloat(formatUnits(amountWei, 18));
                    return (amountNum * (selectedPoolData.apy + (selectedLockData.bonusApy || 0)) / 365 / 100).toFixed(6);
                  } catch {
                    return '0.000000';
                  }
                })()} FVT
              </p>
              <p>
                Total ({selectedLockData.days} days): {(() => {
                  try {
                    const amountWei = parseUnits(amount, 18);
                    const amountNum = parseFloat(formatUnits(amountWei, 18));
                    return (amountNum * (selectedPoolData.apy + (selectedLockData.bonusApy || 0)) / 365 * selectedLockData.days / 100).toFixed(6);
                  } catch {
                    return '0.000000';
                  }
                })()} FVT
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
