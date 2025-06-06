import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Coins, Lock, TrendingUp, Wallet, Network, DollarSign, Shield } from 'lucide-react';
import { useStakingData } from '@/hooks/useStakingData';
import { useWallet } from '@/hooks/useWallet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StakingPanelProps {
  onStakeSuccess?: () => void;
}

export function StakingPanel({ onStakeSuccess }: StakingPanelProps) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState<number>(1);
  const [isStaking, setIsStaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { 
    tokenBalances, 
    globalStats, 
    isLoading, 
    error,
    stakeTokensWithPool, 
    approveTokens, 
    getAllowance 
  } = useStakingData();

  const { 
    isConnected, 
    isCorrectNetwork, 
    isReconnecting,
    accountAddress,
    shortAddress,
    formattedBalanceETH,
    formattedBalanceFVT,
    balanceETH,
    balanceFVT,
    networkName,
    reconnectWallet
  } = useWallet();

  const { toast } = useToast();

  // Safe access to token balances with fallbacks
  const fvtBalance = tokenBalances?.fvtBalance ?? formattedBalanceFVT ?? '0';
  const stakedBalance = tokenBalances?.stakedBalance ?? '0';
  const allowance = tokenBalances?.allowance ?? '0';
  
  // Calculate if approval is needed
  const needsApproval = parseFloat(stakeAmount || '0') > parseFloat(allowance);
  const insufficientBalance = parseFloat(stakeAmount || '0') > parseFloat(fvtBalance);
  const canStake = stakeAmount && !needsApproval && !insufficientBalance && isConnected && isCorrectNetwork;

  // Predefined staking pools
  const stakingPools = [
    {
      id: 1,
      name: "Standard Pool",
      apy: globalStats?.apy || 10,
      lockPeriodDays: globalStats?.lockPeriodDays || 30,
      minStake: "1",
      description: "Standard staking with base APY"
    },
    {
      id: 2,
      name: "Premium Pool",
      apy: (globalStats?.apy || 10) * 1.5,
      lockPeriodDays: (globalStats?.lockPeriodDays || 30) * 2,
      minStake: "100",
      description: "Higher APY with longer lock period"
    }
  ];

  const selectedPool = stakingPools.find(pool => pool.id === selectedPoolId) || stakingPools[0];

  // Show loading state while data is being fetched
  if (isLoading && !tokenBalances) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Stake FVT Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading staking data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Stake FVT Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please connect your wallet to start staking.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Handle staking with backend sync
  const handleStake = async () => {
    if (!stakeAmount || !selectedPool || isStaking) return;

    setIsStaking(true);
    try {
      // Use the enhanced staking function that includes backend sync
      await stakeTokensWithPool(stakeAmount, selectedPoolId);
      
      // Reset form on success
      setStakeAmount('');
      
      // Notify parent component
      onStakeSuccess?.();
      
      toast({
        title: "Success",
        description: `Successfully staked ${stakeAmount} FVT tokens in ${selectedPool.name}`,
      });

    } catch (error: any) {
      console.error('Staking failed:', error);
      
      toast({
        title: "Staking Failed",
        description: error.message || "Failed to complete staking transaction",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  // Handle token approval with better UX
  const handleApprove = async () => {
    if (!stakeAmount || isApproving) return;

    setIsApproving(true);
    try {
      await approveTokens(stakeAmount);
      
      toast({
        title: "Approval Successful",
        description: `Approved ${stakeAmount} FVT tokens for staking`,
      });

    } catch (error: any) {
      console.error('Approval failed:', error);
      
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve tokens",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Stake FVT Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Balances Display - Prominent Section */}
        {isConnected && accountAddress && (
          <div className="p-4 bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Wallet className="w-5 h-5" />
                <span className="font-semibold">Wallet Balances</span>
              </div>
              {isReconnecting && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Updating...
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ETH Balance */}
              <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Ξ</span>
                  </div>
                  <span className="text-sm font-medium text-blue-700">ETH</span>
                </div>
                <div className={cn(
                  "text-xl font-bold text-blue-600",
                  isReconnecting && "opacity-50 animate-pulse"
                )}>
                  {formattedBalanceETH}
                </div>
                <div className="text-xs text-blue-600/70">
                  ≈ ${(parseFloat(balanceETH) * 2000).toLocaleString()} USD
                </div>
              </div>

              {/* FVT Balance */}
              <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">FVT Available</span>
                </div>
                <div className={cn(
                  "text-xl font-bold text-green-600",
                  isReconnecting && "opacity-50 animate-pulse"
                )}>
                  {parseFloat(fvtBalance).toLocaleString()}
                </div>
                <div className="text-xs text-green-600/70">
                  Available for staking
                </div>
              </div>

              {/* Staked Balance */}
              <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">FVT Staked</span>
                </div>
                <div className={cn(
                  "text-xl font-bold text-purple-600",
                  isReconnecting && "opacity-50 animate-pulse"
                )}>
                  {parseFloat(stakedBalance).toLocaleString()}
                </div>
                <div className="text-xs text-purple-600/70">
                  Earning {globalStats?.apy || 0}% APY
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="mt-3 pt-3 border-t border-blue-200/50 flex justify-between text-xs">
              <div className="text-blue-700">
                <span className="text-blue-600">Account:</span> {shortAddress}
              </div>
              <div className="text-blue-700">
                <span className="text-blue-600">Network:</span> {networkName || 'Unknown'}
              </div>
              <button
                onClick={reconnectWallet}
                disabled={isReconnecting}
                className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                {isReconnecting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  '🔄 Refresh'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Account switching indicator */}
        {isReconnecting && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Account is switching... Please wait while we update your balances.
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Info Panel with switching notice */}
        {isConnected && accountAddress && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-green-800">
                <Wallet className="w-4 h-4" />
                <span className="font-medium">Wallet Connected</span>
              </div>
              {isReconnecting && (
                <Badge variant="secondary" className="text-xs">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Updating...
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-green-700 font-medium">Account</div>
                <div className="text-green-600">{shortAddress}</div>
              </div>
              <div>
                <div className="text-green-700 font-medium">Network</div>
                <div className="text-green-600">{networkName || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-green-700 font-medium">ETH Balance</div>
                <div className={cn(
                  "text-green-600",
                  isReconnecting && "opacity-50"
                )}>
                  {formattedBalanceETH} ETH
                </div>
              </div>
              <div>
                <div className="text-green-700 font-medium">FVT Balance</div>
                <div className={cn(
                  "text-green-600",
                  isReconnecting && "opacity-50"
                )}>
                  {formattedBalanceFVT} FVT
                </div>
              </div>
            </div>
            
            {/* Account switching help */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-700">
                  💡 Switch accounts in MetaMask to use different wallet
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnectWallet}
                  disabled={isReconnecting}
                  className="h-6 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
                >
                  {isReconnecting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pool Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Staking Pool</label>
          <Select value={selectedPoolId.toString()} onValueChange={(value) => setSelectedPoolId(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a staking pool" />
            </SelectTrigger>
            <SelectContent>
              {stakingPools.map((pool) => (
                <SelectItem key={pool.id} value={pool.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{pool.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {pool.apy}% APY
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Pool Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{selectedPool.name}</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>APY:</span>
                <span className="font-medium">{selectedPool.apy}%</span>
              </div>
              <div className="flex justify-between">
                <span>Lock Period:</span>
                <span className="font-medium">{selectedPool.lockPeriodDays} days</span>
              </div>
              <div className="flex justify-between">
                <span>Min Stake:</span>
                <span className="font-medium">{selectedPool.minStake} FVT</span>
              </div>
              <p className="text-xs mt-2">{selectedPool.description}</p>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current APY</div>
            <div className="text-lg font-bold text-green-600">{globalStats?.apy || '0'}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Lock Period</div>
            <div className="text-lg font-bold">{globalStats?.lockPeriodDays || '0'} days</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Staked</div>
            <div className="text-lg font-bold">{parseFloat(globalStats?.totalStaked || '0').toLocaleString()} FVT</div>
          </div>
        </div>

        {/* FVT Balance Display */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-3">
            <Coins className="w-4 h-4" />
            <span className="font-medium">FVT Token Balance</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-blue-700 font-medium">Available Balance</div>
              <div className="text-2xl font-bold text-blue-600">{parseFloat(fvtBalance).toLocaleString()} FVT</div>
              <div className="text-xs text-blue-600">≈ ${(parseFloat(fvtBalance) * 1.25).toLocaleString()} USD</div>
            </div>
            <div>
              <div className="text-green-700 font-medium">Staked Balance</div>
              <div className="text-2xl font-bold text-green-600">{parseFloat(stakedBalance).toLocaleString()} FVT</div>
              <div className="text-xs text-green-600">Earning {globalStats?.apy || 0}% APY</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex justify-between text-xs text-blue-700">
              <span>Current Allowance:</span>
              <span className="font-medium">{parseFloat(allowance).toLocaleString()} FVT</span>
            </div>
          </div>
        </div>

        {/* Token Balances */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Available FVT:</span>
            <span className="font-mono font-medium text-lg">
              {parseFloat(fvtBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Currently Staked:</span>
            <span className="font-mono font-medium text-lg text-green-600">
              {parseFloat(stakedBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Approved Amount:</span>
            <span className="font-mono font-medium text-sm text-blue-600">
              {parseFloat(allowance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>

        {/* Staking Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount to Stake</label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value || '')}
                disabled={isStaking || isApproving || isLoading}
              />
              <Button
                variant="outline"
                onClick={() => setStakeAmount(fvtBalance)}
                disabled={isStaking || isApproving || isLoading || parseFloat(fvtBalance) === 0}
                title={`Use maximum available: ${parseFloat(fvtBalance).toLocaleString()} FVT`}
              >
                Max
              </Button>
            </div>
            
            {/* Balance feedback */}
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-muted-foreground">
                Available: <span className="font-mono font-medium">{parseFloat(fvtBalance).toLocaleString()} FVT</span>
              </span>
              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <span className="text-muted-foreground">
                  Remaining: <span className="font-mono font-medium">
                    {Math.max(0, parseFloat(fvtBalance) - parseFloat(stakeAmount)).toLocaleString()} FVT
                  </span>
                </span>
              )}
            </div>
            
            {insufficientBalance && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Insufficient FVT balance. You have {parseFloat(fvtBalance).toLocaleString()} FVT available.
              </p>
            )}
            {needsApproval && stakeAmount && !insufficientBalance && (
              <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Approval needed: You need to approve {stakeAmount} FVT for staking.
              </p>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="space-y-3">
            {needsApproval ? (
              <Button 
                onClick={handleApprove}
                disabled={!stakeAmount || insufficientBalance || isApproving || !isConnected || !isCorrectNetwork}
                className="w-full"
                size="lg"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Approve {stakeAmount} FVT
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleStake}
                disabled={!canStake || isStaking}
                className="w-full"
                size="lg"
              >
                {isStaking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Staking...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Stake {stakeAmount} FVT
                  </>
                )}
              </Button>
            )}

            {/* Transaction Status */}
            {(isStaking || isApproving) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isApproving ? 'Approving tokens...' : 'Processing stake transaction...'}
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  This may take a few moments. Please don't close this page.
                </div>
              </div>
            )}
          </div>

          {/* Staking Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Staking Terms</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {globalStats?.apy || '0'}% APY rewards</li>
              <li>• {globalStats?.lockPeriod || '0'} day lock period</li>
              <li>• Rewards can be claimed anytime</li>
              <li>• Early unstaking not allowed</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
