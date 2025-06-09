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
  Loader2,
  Wallet
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

  const { isConnected, accountAddress } = useWallet();

  // Safe access to balances with fallbacks
  const fvtBalance = tokenBalances?.fvtBalance ?? '0';
  const stakedBalance = tokenBalances?.stakedBalance ?? '0';
  const apy = globalStats?.apy ?? 0;
  const lockPeriodDays = globalStats?.lockPeriodDays ?? 30;

  const formatLargeNumber = (num: string | number): string => {
    try {
      if (num === null || num === undefined || num === '') {
        return '0';
      }
      
      const value = typeof num === 'string' ? parseFloat(num) : num;
      
      if (isNaN(value) || !isFinite(value)) {
        return '0';
      }
      
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    } catch (error) {
      console.error('Error formatting large number:', error, 'Input:', num);
      return '0';
    }
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
          <h2 className="text-2xl font-bold">Personal Staking Overview</h2>
          <p className="text-muted-foreground">
            Your FVT staking position and available rewards
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* User-focused Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current APY */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current APY</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {apy}%
            </div>
            <p className="text-xs text-muted-foreground">
              Annual percentage yield
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
              {isConnected ? 'Currently staked' : 'Connect wallet to view'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Portfolio Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
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
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Rewards Est.</span>
                <span className="font-medium text-blue-600">
                  +{formatLargeNumber((parseFloat(stakedBalance) * apy) / 12 / 100)} FVT
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

      {/* Local Network Status */}
      <Card>
        <CardHeader>
          <CardTitle>Local Development Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-blue-600">
              Local Network
            </Badge>
            <Badge variant="outline">
              Development Mode
            </Badge>
            <Badge variant="outline">
              Single User
            </Badge>
            <Badge variant="outline">
              {apy}% APY
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Running on local Hardhat network for development and testing. 
            Your staking positions are managed by smart contracts deployed locally.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
