import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Coins, 
  Users, 
  Lock,
  PieChart,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useStakingData } from '@/hooks/useStakingData';
import { useWallet } from '@/hooks/useWallet';

export function GlobalStakingDashboard() {
  const { 
    globalStats, 
    tokenBalances, 
    isLoading, 
    error 
  } = useStakingData();

  const { isConnected } = useWallet();

  // Safe access to balances with fallbacks
  const fvtBalance = tokenBalances?.fvtBalance ?? '0';
  const stakedBalance = tokenBalances?.stakedBalance ?? '0';
  const totalStaked = globalStats?.totalStaked ?? '0';
  const apy = globalStats?.apy ?? 0;
  const lockPeriodDays = globalStats?.lockPeriodDays ?? 30;
  const totalStakers = globalStats?.totalStakers ?? 0;

  const formatLargeNumber = (num: string | number): string => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const calculateAPR = (apy: number): number => {
    // Convert APY to APR (simple approximation)
    return apy * 0.95; // Approximate 5% difference
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load staking data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Global Staking Overview</h2>
          <p className="text-muted-foreground">
            Real-time statistics from the FVT staking protocol
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value Locked */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatLargeNumber(totalStaked)} FVT
            </div>
            <p className="text-xs text-muted-foreground">
              ${formatLargeNumber(parseFloat(totalStaked) * 1.25)} USD
            </p>
          </CardContent>
        </Card>

        {/* APY */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Percentage Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {apy}%
            </div>
            <p className="text-xs text-muted-foreground">
              ~{calculateAPR(apy)}% APR
            </p>
          </CardContent>
        </Card>

        {/* Lock Period */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lock Period</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lockPeriodDays} Days
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum staking duration
            </p>
          </CardContent>
        </Card>

        {/* Your Staked Amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stake</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? formatLargeNumber(stakedBalance) : '0'} FVT
            </div>
            <p className="text-xs text-muted-foreground">
              {isConnected && parseFloat(totalStaked) > 0 ? 
                `${((parseFloat(stakedBalance) / parseFloat(totalStaked)) * 100).toFixed(2)}% of total` :
                'Connect wallet to view'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Protocol Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Protocol Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Stakers</span>
              <span className="font-medium">{totalStakers || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Stake Size</span>
              <span className="font-medium">
                {totalStakers > 0 ? 
                  formatLargeNumber(parseFloat(totalStaked) / totalStakers) : 
                  'N/A'
                } FVT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily Rewards Pool</span>
              <span className="font-medium">
                {formatLargeNumber((parseFloat(totalStaked) * apy) / 365 / 100)} FVT
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <span className="font-medium">{formatLargeNumber(fvtBalance)} FVT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Staked Balance</span>
                  <span className="font-medium text-green-600">
                    {formatLargeNumber(stakedBalance)} FVT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Rewards Est.</span>
                  <span className="font-medium">
                    +{formatLargeNumber((parseFloat(stakedBalance) * apy) / 365 / 100)} FVT
                  </span>
                </div>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  Connect your wallet to view your portfolio statistics.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Protocol Status */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-green-600">
              Active
            </Badge>
            <Badge variant="outline">
              V1.0.0
            </Badge>
            <Badge variant="outline">
              Audited
            </Badge>
            <Badge variant="outline">
              {apy}% APY Guaranteed
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            The FVT staking protocol is fully operational and secured by smart contracts on the blockchain.
            All rewards are automatically calculated and distributed based on your stake duration and amount.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
