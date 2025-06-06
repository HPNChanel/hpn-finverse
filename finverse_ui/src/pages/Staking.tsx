import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, TrendingUp, Award, Coins, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Import only components that exist, with fallbacks for missing ones
import { StakingPanel } from '@/components/staking/StakingPanel';
import { useToast } from '@/hooks/use-toast';
import { stakingApi } from '@/lib/api';
import { stakingService } from '@/services/stakingService';
import { useStakingData } from '@/hooks/useStakingData';
import { useWallet } from '@/hooks/useWallet';
import { useStakingEvents } from '@/hooks/useStakingEvents';

// Enhanced StakeModal with token selection
const StakeModal = ({ isOpen, onClose, pools, selectedPool, onStake }: any) => {
  const [selectedToken, setSelectedToken] = useState('');
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [amount, setAmount] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchSupportedTokens = async () => {
      try {
        const tokensData = await stakingService.getSupportedTokens();
        setSupportedTokens(tokensData.tokens);
        // Set default to FVT if available
        const fvtToken = tokensData.tokens.find(t => t.symbol === 'FVT');
        if (fvtToken && fvtToken.isSupported) {
          setSelectedToken(fvtToken.address);
        }
      } catch (error) {
        console.error('Failed to fetch supported tokens:', error);
        toast({
          title: "Error",
          description: "Failed to load supported tokens",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      fetchSupportedTokens();
    }
  }, [isOpen, toast]);

  const handleTokenChange = async (tokenAddress: string) => {
    setSelectedToken(tokenAddress);
    setValidationError('');
    
    // Validate token if amount is entered
    if (amount && parseFloat(amount) > 0) {
      await validateTokenAndAmount(tokenAddress, parseFloat(amount));
    }
  };

  const validateTokenAndAmount = async (tokenAddress: string, stakeAmount: number) => {
    if (!tokenAddress || stakeAmount <= 0) return;

    setIsValidating(true);
    setValidationError('');

    try {
      await stakingService.validateTokenForStaking(tokenAddress, stakeAmount);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setValidationError('');
    
    // Validate on amount change if token is selected
    if (selectedToken && parseFloat(value) > 0) {
      const debounceTimer = setTimeout(() => {
        validateTokenAndAmount(selectedToken, parseFloat(value));
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  };

  const handleStake = async () => {
    if (!selectedToken) {
      setValidationError('Please select a token');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setValidationError('Please enter a valid amount');
      return;
    }

    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsValidating(true);
      await onStake(selectedPool?.id || 1, parseFloat(amount), selectedToken);
      onClose();
      
      // Reset form
      setAmount('');
      setSelectedToken('');
      setValidationError('');
    } catch (error) {
      toast({
        title: "Staking Failed",
        description: error.message || "Failed to stake tokens",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getSelectedTokenInfo = () => {
    return supportedTokens.find(token => token.address === selectedToken);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Stake Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Token</label>
            <Select value={selectedToken} onValueChange={handleTokenChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a token to stake" />
              </SelectTrigger>
              <SelectContent>
                {supportedTokens.map((token) => (
                  <SelectItem 
                    key={token.address} 
                    value={token.address}
                    disabled={!token.isSupported}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={token.icon} 
                        alt={token.symbol} 
                        className="w-5 h-5"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-muted-foreground">({token.name})</span>
                      {!token.isSupported && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount to stake"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                step="0.01"
              />
              {getSelectedTokenInfo() && (
                <span className="absolute right-3 top-2 text-sm text-muted-foreground">
                  {getSelectedTokenInfo().symbol}
                </span>
              )}
            </div>
          </div>

          {/* Validation Status */}
          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Validating token and amount...
            </div>
          )}

          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Selected Token Info */}
          {getSelectedTokenInfo() && !validationError && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="font-medium">Token: {getSelectedTokenInfo().name}</div>
                <div className="text-muted-foreground">
                  Address: {getSelectedTokenInfo().address.slice(0, 6)}...{getSelectedTokenInfo().address.slice(-4)}
                </div>
              </div>
            </div>
          )}

          {/* Pool Info */}
          {selectedPool && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="font-medium">Pool: {selectedPool.name || 'Default Pool'}</div>
                <div className="text-muted-foreground">APY: {selectedPool.apy || '10'}%</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleStake} 
              className="flex-1"
              disabled={isValidating || !!validationError || !selectedToken || !amount}
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Stake Tokens'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Fallback components for missing ones
const StakingPoolCard = ({ pool, onStake, formatCurrency }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        {pool.name}
        <div className="flex items-center gap-1">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Multi-token</span>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>APY:</span>
          <span className="font-bold text-green-600">{pool.apy}%</span>
        </div>
        <div className="flex justify-between">
          <span>Min Stake:</span>
          <span>{formatCurrency(pool.min_stake)}</span>
        </div>
        <div className="flex justify-between">
          <span>Supported Tokens:</span>
          <span className="text-sm">FVT, ETH*</span>
        </div>
      </div>
      <Button onClick={() => onStake(pool.id, pool.min_stake)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Stake Now
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        * ETH support coming soon
      </p>
    </CardContent>
  </Card>
);

const StakePositionCard = ({ position, onRefresh, formatCurrency }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>{position.stake.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <p>Amount: {formatCurrency(position.stake.amount)}</p>
      <p>Rewards: {formatCurrency(position.rewards.earned)}</p>
      <Button onClick={onRefresh} size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </CardContent>
  </Card>
);

const RewardsPanel = ({ claimableRewards, onClaim, formatCurrency }: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Award className="w-5 h-5" />
        Claimable Rewards
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-green-600 mb-4">
        {formatCurrency(claimableRewards)}
      </div>
      <Button onClick={onClaim} className="w-full" disabled={claimableRewards <= 0}>
        Claim Rewards
      </Button>
    </CardContent>
  </Card>
);

const StakingChart = ({ data }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>Staking Performance</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Chart component would be rendered here
      </div>
    </CardContent>
  </Card>
);

const StakingHistory = () => (
  <Card>
    <CardHeader>
      <CardTitle>Staking History</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center text-muted-foreground py-8">
        No staking history available
      </div>
    </CardContent>
  </Card>
);

const GlobalStakingDashboard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Global Staking Statistics</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center text-muted-foreground py-8">
        Global staking dashboard would be rendered here
      </div>
    </CardContent>
  </Card>
);

export function Staking() {
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const { toast } = useToast();

  const {
    stakes,
    pools,
    rewards,
    claimableRewards,
    tokenBalances,
    globalStats,
    isLoading,
    isRefreshing,
    error,
    refreshData,
    clearError
  } = useStakingData();

  const {
    isConnected,
    isCorrectNetwork,
    accountAddress,
    shortAddress,
    formattedBalanceETH,
    formattedBalanceFVT,
    balanceETH,
    balanceFVT,
    connectWallet,
    switchToHardhatNetwork
  } = useWallet();

  // Add event listening
  const {
    recentStakedEvents,
    isListening,
    startListening,
    stopListening,
    clearEvents
  } = useStakingEvents();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleStakeSuccess = useCallback(async (txHash: string, amount: number, poolId: string) => {
    try {
      // Record the staking position using unified API (primary method)
      await stakingApi.recordStakingPosition({
        poolId: poolId,
        amount: amount,
        txHash: txHash,
        lockPeriod: selectedPool?.lockPeriod || 0,
        walletAddress: accountAddress || ''
      });

      setShowStakeModal(false);
      setSelectedPool(null);
      
      // Refresh data to show updated stakes
      await refreshData();
      
      toast({
        title: "Success",
        description: "Your stake has been recorded successfully!",
      });

      // Note: Backend sync will be handled automatically by the event listener
      // in useStakingEvents when the blockchain event is detected
      
    } catch (error: any) {
      console.error('Error recording stake:', error);
      toast({
        title: "Warning",
        description: "Stake transaction completed but recording failed. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [selectedPool, accountAddress, refreshData, toast]);

  const handleQuickStake = useCallback((pool: StakingPool) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to start staking",
        variant: "destructive",
      });
      return;
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Hardhat Local network",
        variant: "destructive",
        action: {
          altText: "Switch Network",
          onClick: switchToHardhatNetwork
        }
      });
      return;
    }

    setSelectedPool(pool);
    setShowStakeModal(true);
  }, [isConnected, isCorrectNetwork, toast, switchToHardhatNetwork]);

  // Refresh data when new staking events are received (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (recentStakedEvents.length > 0) {
        refreshData();
      }
    }, 2000); // 2 second delay to allow blockchain confirmation

    return () => clearTimeout(timeoutId);
  }, [recentStakedEvents.length, refreshData]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Loading state for initial load
  if (isLoading && !tokenBalances && !pools.length) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Staking Data</h2>
            <p className="text-muted-foreground">
              {!isConnected ? 'Connect your wallet to view staking options' : 'Fetching your staking information...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Enhanced Header with Balance Display */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FVT Staking</h1>
          <p className="text-muted-foreground">
            Stake your FVT tokens to earn rewards
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Wallet Balance Summary in Header */}
          {isConnected && accountAddress && (
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">{shortAddress}</span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">ETH:</span>
                  <span className="font-mono font-medium">{formattedBalanceETH}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-blue-500" />
                  <span className="font-mono font-medium text-blue-600">{formattedBalanceFVT}</span>
                  <span className="text-xs text-muted-foreground">FVT</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Event listening indicator */}
          {isConnected && isCorrectNetwork && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">
                {isListening ? 'Live' : 'Offline'}
              </span>
            </div>
          )}
          
          {isRefreshing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Recent Events Display */}
      {recentStakedEvents.length > 0 && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Recent Activity:</strong> {recentStakedEvents.length} recent staking event(s) detected
              </div>
              <Button variant="outline" size="sm" onClick={clearEvents}>
                Clear
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              {recentStakedEvents.slice(0, 3).map((event, index) => (
                <div key={`${event.transactionHash}-${index}`} className="text-sm text-muted-foreground">
                  • Staked {event.amount} FVT at {new Date(event.timestamp * 1000).toLocaleTimeString()}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>Connect your wallet to start staking and view your portfolio</span>
            <Button onClick={connectWallet} size="sm">
              Connect Wallet
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isConnected && !isCorrectNetwork && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Please switch to Hardhat Local network for staking functionality</span>
            <Button onClick={switchToHardhatNetwork} size="sm" variant="outline">
              Switch Network
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={clearError} size="sm" variant="outline">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="stake" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stake" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Stake
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-6">
          <StakingPanel onStakeSuccess={handleStakeSuccess} />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {/* Enhanced Portfolio content with balance integration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* ETH Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ETH Balance</CardTitle>
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Ξ</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formattedBalanceETH} ETH
                </div>
                <p className="text-xs text-muted-foreground">
                  ≈ ${(parseFloat(balanceETH) * 2000).toLocaleString()} USD
                </p>
              </CardContent>
            </Card>

            {/* Available FVT */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available FVT</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {parseFloat(formattedBalanceFVT).toLocaleString()} FVT
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for staking
                </p>
              </CardContent>
            </Card>

            {/* Total Staked */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {tokenBalances ? parseFloat(tokenBalances.stakedBalance).toLocaleString() : '0'} FVT
                </div>
                <p className="text-xs text-muted-foreground">
                  Your total staked amount
                </p>
              </CardContent>
            </Card>

            {/* Claimable Rewards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Claimable Rewards</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {claimableRewards.toLocaleString()} FVT
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready to claim
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active stakes */}
          <Card>
            <CardHeader>
              <CardTitle>Active Stakes</CardTitle>
            </CardHeader>
            <CardContent>
              {stakes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active stakes found</p>
                  <p className="text-sm">Start staking to see your positions here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stakes.map((stake) => (
                    <div
                      key={stake.stakeId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">Stake #{stake.stakeId}</h3>
                        <p className="text-sm text-muted-foreground">
                          {parseFloat(stake.amount).toLocaleString()} FVT
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +{parseFloat(stake.accumulatedRewards).toLocaleString()} FVT
                        </p>
                        <p className="text-sm text-muted-foreground">Rewards</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {/* History component would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Staking History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Staking history will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {/* Analytics component would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Staking Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics and charts will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stake Modal */}
      <StakeModal
        isOpen={showStakeModal}
        onClose={() => setShowStakeModal(false)}
        pools={pools}
        selectedPool={selectedPool}
        onStake={stakingApi.stakeTokens} // Use unified API
      />
    </div>
  );
}

// Also export as default for compatibility
export default Staking;
