import React, { useMemo, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  Award, 
  Coins, 
  BarChart3, 
  Shield,
  Clock,
  Wallet,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStakingData } from '@/hooks/useStakingData';
import { useStakingDashboard } from '@/hooks/useStakingDashboard';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { StakingPanel } from '@/components/staking/StakingPanel';
import { MetaMaskConnectionGuard } from '@/components/MetaMaskConnectionGuard';

export default function StakingDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    stakes,
    refreshData: refreshStakingData
  } = useStakingData();

  // New dashboard data hook
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refreshData: refreshDashboardData,
    hasData,
    lastUpdated
  } = useStakingDashboard();

  const { 
    accountAddress, 
    formattedBalanceETH,
    refreshBalances,
    isConnected,
    isCorrectNetwork
  } = useWallet();

  const { toast } = useToast();

  // Use dashboard data from API, fallback to calculated stats if needed
  const dashboardStats = useMemo(() => {
    // If we have dashboard data from API, use it (preferred)
    if (dashboardData && hasData) {
      const dailyRewards = dashboardData.total_staked * dashboardData.apy_weighted / 365 / 100;
      
      return {
        totalStaked: dashboardData.total_staked,
        totalRewards: dashboardData.total_rewards,
        activeStakes: dashboardData.active_positions,
        avgAPY: dashboardData.apy_weighted,
        nextUnlock: null, // Can be calculated from stakes if needed
        dailyRewards,
        hasActiveStakes: dashboardData.active_positions > 0
      };
    }

    // Fallback to calculated stats from stakes if dashboard data not available
    if (!stakes?.length) {
      return {
        totalStaked: 0,
        totalRewards: 0,
        activeStakes: 0,
        avgAPY: 0,
        nextUnlock: null,
        dailyRewards: 0,
        hasActiveStakes: false
      };
    }

    let totalStaked = 0;
    let totalRewards = 0;
    let activeStakes = 0;
    let totalAPY = 0;
    let validAPYCount = 0;
    let nextUnlockDate: Date | null = null;

    stakes.forEach(stake => {
      // Use !claimed to determine if stake is active
      if (!stake.claimed) {
        activeStakes++;
        
        // Safe amount parsing
        const stakeAmount = parseFloat(stake.amountFormatted || '0');
        totalStaked += stakeAmount;
        
        // Safe rewards parsing  
        const rewardAmount = parseFloat(stake.rewardFormatted || '0');
        totalRewards += rewardAmount;
        
        // APY calculation
        if (stake.apy && stake.apy > 0) {
          totalAPY += stake.apy;
          validAPYCount++;
        }
        
        // Next unlock calculation - use lockPeriod + startDate for next unlock
        if (stake.startDate && stake.lockPeriodDays > 0) {
          const unlockDate = new Date(stake.startDate.getTime() + (stake.lockPeriodDays * 24 * 60 * 60 * 1000));
          if (!nextUnlockDate || unlockDate < nextUnlockDate) {
            nextUnlockDate = unlockDate;
          }
        }
      }
    });

    return {
      totalStaked,
      totalRewards,
      activeStakes,
      avgAPY: validAPYCount > 0 ? totalAPY / validAPYCount : 0,
      nextUnlock: nextUnlockDate,
      dailyRewards: totalStaked * (validAPYCount > 0 ? totalAPY / validAPYCount : 0) / 365 / 100,
      hasActiveStakes: activeStakes > 0
    };
  }, [dashboardData, hasData, stakes]);

  const handleRefreshWallet = useCallback(async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      await refreshBalances();
      await refreshStakingData();
      await refreshDashboardData();
      toast({
        title: "Success",
        description: "Wallet data refreshed successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh wallet data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, refreshBalances, refreshStakingData, refreshDashboardData, toast]);

  const formatTimeUntil = (date: Date | null): string => {
    if (!date) return 'No active locks';
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Available now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };



  // Use the MetaMaskConnectionGuard to handle all connection states
  return (
    <MetaMaskConnectionGuard>
      {/* Only render dashboard when we have a connected account */}
      {!accountAddress || !isConnected || !isCorrectNetwork ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading staking interface...</p>
          </div>
        </div>
      ) : isDashboardLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Staking Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your ETH staking positions and track rewards
                </p>
              </div>
              <Button 
                onClick={refreshDashboardData}
                disabled={isDashboardLoading}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {isDashboardLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh Dashboard
              </Button>
            </div>
            {dashboardError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  Failed to load dashboard data: {dashboardError}
                </p>
                <button
                  onClick={refreshDashboardData}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Wallet Information Block */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50/50 to-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <span>Wallet Information</span>
                  </div>
                  <Button 
                    onClick={handleRefreshWallet}
                    disabled={refreshing}
                    size="sm"
                    variant="outline"
                  >
                    {refreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Connected Address */}
                  <div className="bg-white/70 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Connected Address</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-blue-600">
                      {accountAddress ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}` : '0x0000...0000'}
                    </div>
                    <div className="text-xs text-blue-600/70">MetaMask Wallet</div>
                  </div>

                  {/* ETH Balance */}
                  <div className="bg-white/70 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Ξ</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">ETH Balance</span>
                    </div>
                    <div className="text-lg font-bold text-gray-600">
                      {formattedBalanceETH || '0.0000'}
                    </div>
                    <div className="text-xs text-gray-600/70">Network fees</div>
                  </div>

                  {/* ETH Available */}
                  <div className="bg-white/70 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">ETH Available</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formattedBalanceETH || '0.0000'}
                    </div>
                    <div className="text-xs text-green-600/70">Ready to stake</div>
                  </div>

                  {/* ETH Staked */}
                  <div className="bg-white/70 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">ETH Staked</span>
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      {dashboardStats.totalStaked.toFixed(4)}
                    </div>
                    <div className="text-xs text-purple-600/70">
                      {dashboardStats.activeStakes} active position{dashboardStats.activeStakes !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Removed Wallet Overview (duplicated), but KEEP Wallet Information above (critical for wallet UI) */}

            {/* Personal Stats Cards - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Staked */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardStats.totalStaked > 0 ? `${dashboardStats.totalStaked.toFixed(4)} ETH` : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats.activeStakes} active position{dashboardStats.activeStakes !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Your Weighted APY */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Weighted APY</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats.hasActiveStakes ? `${dashboardStats.avgAPY.toFixed(1)}%` : 'No active positions'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats.hasActiveStakes ? 'Weighted across all positions' : 'Stake ETH to start earning'}
                  </p>
                </CardContent>
              </Card>

              {/* Next Unlock */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Unlock</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTimeUntil(dashboardStats.nextUnlock)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Earliest available withdrawal
                  </p>
                </CardContent>
              </Card>

              {/* Total Rewards Earned */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Rewards Earned</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +{dashboardStats.totalRewards.toFixed(4)} ETH
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ~{dashboardStats.dailyRewards.toFixed(6)} ETH per day
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Staking Actions */}
            <StakingPanel onStakeSuccess={() => { 
              refreshStakingData(); 
              refreshDashboardData(); 
            }} />
          </div>
        </div>
        </div>
      )}
    </MetaMaskConnectionGuard>
  );
}
