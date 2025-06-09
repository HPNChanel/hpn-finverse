import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, TrendingUp, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { useStakingData } from '@/hooks/useStakingData';
import { ethers } from 'ethers';
import { stakingApi } from '@/lib/api';

// Types
interface StakingPool {
  id: string;
  name: string;
  apy: number;
  lockPeriodDays: number;
  minStake: number;
  maxStake?: number;
  description: string;
  isActive: boolean;
  bonusApy?: number;
  tokenAddress?: string;
  tokenSymbol?: string;
  rewardTokenSymbol?: string;
}



interface StakeTokenFormProps {
  onStakeSuccess?: (txHash: string, amount: number, poolId: string) => void;
  onStakeError?: (error: string) => void;
  className?: string;
}

type TransactionStatus = 'idle' | 'approving' | 'pending' | 'confirming' | 'success' | 'error';



const FormSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    <div className="space-y-3">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded"></div>
  </div>
);



export function StakeTokenForm({ onStakeSuccess, onStakeError, className }: StakeTokenFormProps) {
  // Hooks
  const { toast } = useToast();
  const { 
    isConnected, 
    accountAddress, 
    balanceETH, 
    formattedBalanceETH,
    isCorrectNetwork, 
    switchToHardhatNetwork 
  } = useWallet();

  const { 
    pools: stakingPools, 
    isLoading: stakingDataLoading, 
    refreshData 
  } = useStakingData();

  // Form state
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [lockDuration, setLockDuration] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');

  // ETH-only balances
  const userBalance = useMemo(() => {
    return balanceETH || 0;
  }, [balanceETH]);

  const formattedBalance = useMemo(() => {
    return formattedBalanceETH || '0';
  }, [formattedBalanceETH]);

  // Filter pools for ETH only
  const filteredPools = useMemo(() => {
    const filtered = stakingPools.filter(pool => 
      pool.tokenSymbol === 'ETH' && 
      pool.isActive
    );
    
    console.log(`🔍 Filtered ETH pools:`, filtered.map(pool => ({
      id: pool.id,
      name: pool.name,
      tokenSymbol: pool.tokenSymbol
    })));
    
    return filtered;
  }, [stakingPools]);



  // Selected pool
  const selectedPool = useMemo(() => {
    return filteredPools.find(pool => pool.id === selectedPoolId);
  }, [filteredPools, selectedPoolId]);

  // Enhanced validation with explicit Number() casting and numeric pool limits
  const validateAmount = useCallback((value: string): string | null => {
    const stakeAmount = Number(value);
    if (!value || isNaN(stakeAmount) || stakeAmount <= 0) {
      return 'Please enter a valid amount';
    }
    
    // Use explicit Number() casting with fallbacks
    const minStakeRequired = Number(selectedPool?.minStake) || 0;
    const maxStakeAllowed = selectedPool?.maxStake ? Number(selectedPool.maxStake) : Infinity;

    if (stakeAmount < minStakeRequired) {
      const minStakeFormatted = minStakeRequired.toFixed(4);
      return `Minimum stake for ${selectedPool?.name || 'this pool'} is ${minStakeFormatted} ETH`;
    }

    if (maxStakeAllowed !== Infinity && stakeAmount > maxStakeAllowed) {
      const maxStakeFormatted = maxStakeAllowed.toFixed(4);
      return `Maximum stake for ${selectedPool?.name || 'this pool'} is ${maxStakeFormatted} ETH`;
    }

    const availableBalance = Number(userBalance) || 0;
    const gasBuffer = 0.01; // Reserve for gas fees

    if (stakeAmount > availableBalance - gasBuffer) {
      return `Insufficient ETH balance. Available: ${availableBalance.toFixed(6)}, Required: ${(stakeAmount + gasBuffer).toFixed(6)}`;
    }

    return null;
  }, [selectedPool, userBalance]);

  // Enhanced validation with explicit Number() casting and debugging
  const isStakeAmountValid = useMemo(() => {
    if (!amount || !selectedPool) return false;
    
    const stakeAmount = Number(amount);  // ✅ Explicit casting
    if (isNaN(stakeAmount) || stakeAmount <= 0) return false;
    
    // ✅ Direct numeric comparison - no parseFloat needed!
    const minStakeRequired = Number(selectedPool.minStake) || 0;
    const maxStakeAllowed = selectedPool.maxStake ? Number(selectedPool.maxStake) : Infinity;
    const availableBalance = Number(userBalance) || 0;
    const gasBuffer = 0.01;
    
    return stakeAmount >= minStakeRequired && 
           stakeAmount <= maxStakeAllowed && 
           stakeAmount <= (availableBalance - gasBuffer);
  }, [amount, selectedPool, userBalance]);

  // Handle staking
  const handleStake = async () => {
    if (!isConnected || !accountAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake",
        variant: "destructive",
      });
      return;
    }

    if (!isCorrectNetwork) {
      await switchToHardhatNetwork();
      return;
    }

    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedPool) {
      setError('Please select a staking pool');
      return;
    }

    try {
      setTxStatus('pending');
      setError('');

      // Get contract addresses using axios
      const contractsResponse = await fetch('/contracts.json');
      const contractsData = await contractsResponse.json();
      const stakeVaultAddress = contractsData.contracts.StakeVault.address;

      // ✅ FIX: Properly format the stakeAmount as BigNumber in WEI
      const stakeAmountWei = ethers.parseEther(amount.toString());
      
      // Validate stakeAmount is not undefined or NaN
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Invalid stake amount');
      }
      
      toast({
        title: "Transaction Pending",
        description: `Staking ${amount} ETH to ${selectedPool.name}...`,
      });

      // ✅ Use proper ethers.js contract interaction instead of low-level window.ethereum.request
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance with proper ABI
      const stakingContract = new ethers.Contract(
        stakeVaultAddress,
        [
          "function stake(uint256 poolId) external payable"
        ],
        signer
      );

      // ✅ FIX: Execute transaction with proper value parameter as BigNumber WEI
      const tx = await stakingContract.stake(
        selectedPool.id,
        {
          value: stakeAmountWei // This is already in WEI format as BigNumber
        }
      );

      setTxHash(tx.hash);
      setTxStatus('confirming');

      toast({
        title: "Transaction Submitted",
        description: `Transaction hash: ${tx.hash.slice(0, 10)}...`,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setTxStatus('success');
        
        // ✅ CRITICAL: Record stake to backend database using axios
        try {
          await stakingApi.recordStakingPosition({
            walletAddress: accountAddress,
            poolId: selectedPool.id,
            amount: parseFloat(amount),
            blockchainTxHash: tx.hash,
            lockPeriod: parseInt(lockDuration) || 0
          });

          toast({
            title: "Staking Successful!",
            description: `Successfully staked ${amount} ETH in ${selectedPool.name} and recorded to database`,
          });
        } catch (dbError) {
          console.error('Failed to record stake to database:', dbError);
          toast({
            title: "Staking Complete (Database Warning)",
            description: `ETH staked successfully, but failed to record to database. Please contact support.`,
            variant: "destructive",
          });
        }

        // Reset form
        setAmount('');
        setSelectedPoolId('');
        setLockDuration('');

        // Refresh data
        await refreshData();

        // Call success callback
        if (onStakeSuccess) {
          onStakeSuccess(tx.hash, parseFloat(amount), selectedPool.id);
        }
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: unknown) {
      console.error('Staking error:', error);
      setTxStatus('error');
      
      // Handle MetaMask rejection specifically
      const err = error as { code?: number; reason?: string; message?: string };
      if (err.code === 4001) {
        setError('Transaction was rejected by user');
      } else {
        const errorMessage = err.reason || err.message || 'Staking failed';
        setError(errorMessage);
      }
      
      toast({
        title: "Staking Failed",
        description: err.code === 4001 ? 'Transaction was rejected by user' : (err.reason || err.message || 'Staking failed'),
        variant: "destructive",
      });

      if (onStakeError) {
        onStakeError(err.reason || err.message || 'Staking failed');
      }
    }
  };

  // Auto-select first pool if available
  useEffect(() => {
    if (filteredPools.length > 0 && !selectedPoolId) {
      setSelectedPoolId(filteredPools[0].id);
    }
  }, [filteredPools, selectedPoolId]);

  // Loading state
  if (stakingDataLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>ETH Staking</CardTitle>
          <CardDescription>Loading staking pools...</CardDescription>
        </CardHeader>
        <CardContent>
          <FormSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>ETH Staking</CardTitle>
        <CardDescription>
          Stake your ETH to earn rewards. All staking is done with ETH only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {!isConnected && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Wallet Not Connected</span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Connect your MetaMask wallet to start staking ETH and earning rewards.
            </p>
          </div>
        )}

        {/* Balance Display */}
        {isConnected && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Available ETH:</span>
              <span className="text-sm font-mono">{formattedBalance}</span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ 0.01 ETH reserved for gas fees
            </p>
          </div>
        )}

        {/* Pool Selection */}
        <div className="space-y-3">
          <Label>Select Staking Pool</Label>
          {filteredPools.length > 0 ? (
            <>
              <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an ETH staking pool" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPools.map((pool) => (
                    <SelectItem key={pool.id} value={pool.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{pool.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">ETH</Badge>
                          <Badge variant="secondary" className="ml-1">
                            {pool.apy}% APY
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedPool && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">{selectedPool.name}</span>
                    <Badge variant="outline" className="text-xs">ETH</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{selectedPool.description}</p>
                    <div className="flex justify-between">
                      <span>APY:</span>
                      <span className="text-green-600 font-medium">{selectedPool.apy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min/Max Stake:</span>
                      <span>{selectedPool.minStake} - {selectedPool.maxStake || '∞'} ETH</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">No ETH pools available</span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                {stakingDataLoading 
                  ? "Loading ETH pools..." 
                  : "No active pools found for ETH. Please refresh or contact support."
                }
              </p>
              {!stakingDataLoading && (
                <Button 
                  onClick={() => refreshData().catch(console.error)} 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Refresh Pools
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Amount Input */}
        {filteredPools.length > 0 && (
          <div className="space-y-3">
            <Label htmlFor="amount">Stake Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount to stake in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
            
            {/* Quick amount buttons */}
            <div className="flex gap-2">
                          {[25, 50, 75, 90].map((percentage) => (
              <Button
                key={percentage}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const numericBalance = typeof userBalance === 'number' ? userBalance : 0;
                  const maxAmount = Math.max(0, numericBalance - 0.01); // Reserve for gas
                  const quickAmount = (maxAmount * percentage) / 100;
                  setAmount(quickAmount.toFixed(6));
                }}
                disabled={!isConnected || (typeof userBalance === 'number' ? userBalance : 0) <= 0.01}
              >
                {percentage}%
              </Button>
            ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Transaction Status */}
        {txStatus !== 'idle' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              {txStatus === 'pending' || txStatus === 'confirming' ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : txStatus === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {txStatus === 'pending' && 'Submitting transaction...'}
                {txStatus === 'confirming' && 'Confirming transaction...'}
                {txStatus === 'success' && 'Transaction successful!'}
                {txStatus === 'error' && 'Transaction failed'}
              </span>
            </div>
            {txHash && (
              <p className="text-xs text-muted-foreground mt-1">
                Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {/* Stake Button */}
        <Button
          onClick={handleStake}
          disabled={
            !isConnected || 
            !isStakeAmountValid || 
            txStatus === 'pending' || 
            txStatus === 'confirming'
          }
          className="w-full"
          size="lg"
        >
          {txStatus === 'pending' || txStatus === 'confirming' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {txStatus === 'pending' ? 'Submitting...' : 'Confirming...'}
            </>
          ) : (
            `Stake ${amount || '0'} ETH`
          )}
        </Button>
        
        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && selectedPool && amount && (
          <div className="p-2 bg-gray-100 rounded text-xs">
            <div>Button Status: {!isConnected ? 'Not Connected' : !isStakeAmountValid ? 'Invalid Amount' : 'Ready'}</div>
            <div>Amount: {amount} (type: {typeof Number(amount)})</div>
            <div>Min Stake: {selectedPool.minStake} (type: {typeof selectedPool.minStake})</div>
            <div>Max Stake: {selectedPool.maxStake || 'None'} (type: {typeof selectedPool.maxStake})</div>
            <div>ETH Balance: {userBalance} (type: {typeof userBalance})</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
