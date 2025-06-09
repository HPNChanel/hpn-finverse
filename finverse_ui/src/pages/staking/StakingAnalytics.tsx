import React, { useState, useEffect } from 'react';
import { StakeAnalyticsChart } from '@/components/staking/StakeAnalyticsChart';
import { RewardTimeline } from '@/components/staking/RewardTimeline';
// import { StakeHistoryTable } from '@/components/staking/StakeHistoryTable'; // Temporarily disabled
import { useStakingData } from '@/hooks/useStakingData';
import { useWallet } from '@/hooks/useWallet';
import { stakingApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  CalendarClock, 
  // History, // Temporarily disabled
  TrendingUp,
  Award,
  Coins
} from 'lucide-react';

export default function StakingAnalytics() {
  const { stakes } = useStakingData();
  const { isConnected } = useWallet();
  const [analyticsData, setAnalyticsData] = useState<unknown>(null);
  // const [stakingLogs, setStakingLogs] = useState<unknown[]>([]); // Temporarily disabled
  // const [loading, setLoading] = useState(false); // Temporarily disabled

  // Fetch analytics data from backend
  useEffect(() => {
    if (!isConnected) return;

    const fetchAnalytics = async () => {
      try {
        const analytics = await stakingApi.getStakingAnalytics('30d');
        setAnalyticsData(analytics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();
  }, [isConnected]);

  // Calculate user-focused summary stats from analytics data or fallback to stakes
  const analyticsTyped = analyticsData as { activeCount?: number; totalStaked?: number; totalRewards?: number } | null;
  const totalStakes = analyticsTyped?.activeCount || stakes?.length || 0;
  const totalStaked = analyticsTyped?.totalStaked || 0;
  const totalRewards = analyticsTyped?.totalRewards || 0;
  const averageAPY = analyticsTyped ? 
    (analyticsTyped.totalStaked && analyticsTyped.totalStaked > 0 ? (analyticsTyped.totalRewards || 0) / analyticsTyped.totalStaked * 100 : 0) :
    (stakes?.reduce((sum: number, stake: { apy?: number }) => sum + (stake.apy || 0), 0) / Math.max(totalStakes, 1) || 0);

  const formatETH = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(4);
  };

  // Return content without StakingLayout wrapper to prevent duplication
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis of your personal staking performance
        </p>
      </div>

      {/* Personal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stakes</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStakes}</div>
            <p className="text-xs text-muted-foreground">
              Active positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatETH(totalStaked)} ETH</div>
            <p className="text-xs text-muted-foreground">
              Your total investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatETH(totalRewards)} ETH
            </div>
            <p className="text-xs text-muted-foreground">
              Your earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAPY.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Weighted average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance Charts
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Reward Timeline
          </TabsTrigger>
          {/* Stake History tab temporarily removed due to unresolved data rendering issues */}
          {/* <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Stake History
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <StakeAnalyticsChart />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <RewardTimeline />
        </TabsContent>

        {/* Stake History tab content temporarily removed due to unresolved data rendering issues */}
        {/* <TabsContent value="history" className="space-y-4">
          <StakeHistoryTable />
        </TabsContent> */}
      </Tabs>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <p className="text-sm text-orange-700">
                Connect your wallet to view detailed analytics and historical data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
