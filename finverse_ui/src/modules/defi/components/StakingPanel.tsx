import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useStakingData } from '@/hooks/useStakingData';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { StakeTokenForm } from './StakeTokenForm';
import { SendTokenForm } from './SendTokenForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractErrorMessage } from '@/utils/errorHelpers';


interface StakingPanelProps {
  onStakeSuccess?: () => void;
}

export function StakingPanel({ onStakeSuccess }: StakingPanelProps) {
    const { 
    formattedBalanceETH, 
    balancesLoading
  } = useWallet();

  const {
    pools, 
    tokenBalances,
    globalStats,
    isLoading: stakingDataLoading,
    error,
    refreshData
  } = useStakingData();

  // Add the missing toast hook
  const { toast } = useToast();

  // Safe balance values with loading states
  const balanceValues = useMemo(() => {
    if (balancesLoading) {
      return {
        ethBalance: '...',
        fvtBalance: '...',
        stakedBalance: '...'
      };
    }
    
    return {
      ethBalance: formattedBalanceETH || '0.0000',
      stakedBalance: tokenBalances?.stakedBalance || '0.0000'
    };
  }, [formattedBalanceETH, tokenBalances?.stakedBalance, balancesLoading]);

  // Enhanced success handler with pool validation
  const handleStakeSuccess = useCallback(async (txHash: string, amount: number, poolId: string) => {
    try {
      console.log('✅ Stake successful:', { txHash, amount, poolId });
      
      if (onStakeSuccess) {
        onStakeSuccess();
      }
      
      // Refresh data after successful stake
      setTimeout(async () => {
        try {
          await refreshData();
          console.log('🔄 Data refreshed after successful stake');
        } catch (error) {
          console.error('Failed to refresh after stake:', extractErrorMessage(error));
        }
      }, 2000);
    } catch (error) {
      console.error('Error in stake success handler:', extractErrorMessage(error));
    }
  }, [onStakeSuccess, refreshData]);

  const handleStakeError = useCallback((error: string) => {
    console.error('Stake error:', error);
    toast({
      title: "Staking Failed",
      description: extractErrorMessage(error),
      variant: "destructive",
    });
  }, [toast]);

  // Calculate active pools consistently with better validation
  const activePools = useMemo(() => {
    if (!pools || !Array.isArray(pools)) {
      console.warn('⚠️ Pools data is not valid:', pools);
      return [];
    }
    return pools.filter(p => p && p.isActive !== false) || [];
  }, [pools]);

  // Enhanced pool availability check
  const poolsAvailable = useMemo(() => {
    return activePools.length > 0;
  }, [activePools]);

  // Enhanced loading check - FIX: Remove conflicting variable names
  const isDataLoading = useMemo(() => {
    return stakingDataLoading || (balancesLoading && !formattedBalanceETH);
  }, [stakingDataLoading, balancesLoading, formattedBalanceETH]);

  // Show loading state while data is being fetched
  if (isDataLoading && (!tokenBalances && activePools.length === 0)) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading staking data...</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Connecting to blockchain and loading pools...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{extractErrorMessage(error)}</span>
            <Button onClick={() => refreshData().catch(console.error)} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Removed Wallet Overview (duplicate), Wallet Information is retained */}

      {/* Action Forms Tabs */}
      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
          <TabsTrigger value="send">Send Tokens</TabsTrigger>
          {/* Stake History tab temporarily removed due to unresolved data rendering issues */}
          {/* <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Stake History
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="stake" className="space-y-4">
          {/* Global Stats with Pool Count */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Current APY</div>
                  <div className="text-lg font-bold text-green-600">
                    {globalStats?.apy || '0'}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Pools</div>
                  <div className="text-lg font-bold">
                    {activePools.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Staked</div>
                  <div className="text-lg font-bold">
                    {parseFloat(globalStats?.totalStaked || '0').toLocaleString()} ETH
                  </div>
                </div>
              </div>
              
              {/* Pool availability indicator */}
              {activePools.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground text-center">
                    Available pools: {activePools.map(p => `${p.name || `Pool ${p.id}`} (${p.tokenSymbol || 'FVT'})`).join(', ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Stake Token Form with Pool Validation */}
          {poolsAvailable ? (
            <div className="space-y-4">
              <StakeTokenForm 
                onStakeSuccess={handleStakeSuccess}
                onStakeError={handleStakeError}
                className="w-full max-w-none"
              />
              
              {/* Pool information display */}
              <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-2">💡 Available Staking Pools:</h4>
                <div className="space-y-1 text-blue-700">
                  {activePools.slice(0, 3).map((pool, index) => {
                    // Safe key validation for pool display
                    const poolIdNumber = pool.id ? Number(pool.id) : NaN;
                    const isValidPoolId = Number.isFinite(poolIdNumber) && poolIdNumber >= 0;
                    const safeKey = isValidPoolId ? `panel-pool-${poolIdNumber}` : `panel-pool-${index}`;
                    
                    if (!isValidPoolId) {
                      console.warn(`⚠️ StakingPanel pool with invalid ID:`, {
                        poolData: pool,
                        originalId: pool.id,
                        fallbackKey: safeKey,
                        index
                      });
                    }
                    
                    return (
                      <div key={safeKey} className="text-xs">
                        • {pool.name || `Pool ${index + 1}`}: {pool.apy || 0}% APY
                      </div>
                    );
                  })}
                  {activePools.length > 3 && (
                    <div key="more-pools-indicator" className="text-xs">
                      + {activePools.length - 3} more pools
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  {stakingDataLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading staking pools...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>No active staking pools available</span>
                    </>
                  )}
                </div>
                
                {!stakingDataLoading && (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Staking pools may be temporarily unavailable or not yet deployed.
                    </div>
                    <Button 
                      onClick={() => refreshData().catch(console.error)} 
                      size="sm" 
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Pools
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <SendTokenForm 
            onSendSuccess={(txHash, token, amount, recipient) => {
              toast({
                title: "Transfer Successful",
                description: `Sent ${amount} ${token} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
              });
            }}
            onSendError={(error) => {
              toast({
                title: "Transfer Failed",
                description: extractErrorMessage(error),
                variant: "destructive",
              });
            }}
          />
        </TabsContent>

        {/* Stake History tab content temporarily removed due to unresolved data rendering issues */}
        {/* <TabsContent value="history" className="space-y-4">
          <StakeHistoryTable />
        </TabsContent> */}
      </Tabs>

      {/* Insufficient Balance Warning */}
      {!balancesLoading && parseFloat(balanceValues.ethBalance) <= 0.01 && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Your ETH balance is insufficient for staking. Please deposit ETH to stake (minimum 0.01 ETH for gas fees).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
