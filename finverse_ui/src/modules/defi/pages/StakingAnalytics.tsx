import React, { useState } from 'react';
import { useStakingAnalytics } from '@/hooks/useStakingAnalytics';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp,
  Award,
  Coins,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function StakingAnalytics() {
  const { isConnected } = useWallet();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '180d' | '365d'>('30d');
  const [activeTab, setActiveTab] = useState('performance');
  
  const { 
    analytics, 
    isLoading, 
    error, 
    refetchAnalytics
  } = useStakingAnalytics(selectedTimeframe);

  // Format ETH amounts
  const formatETH = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(4);
  };

  // Calculate weighted APY
  const calculateWeightedAPY = () => {
    if (!analytics || analytics.totalStaked === 0) return 0;
    return (analytics.totalRewards / analytics.totalStaked) * 100;
  };

  // Connection check
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            ETH staking analytics and performance insights
          </p>
        </div>
        
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            ETH staking analytics and performance insights
          </p>
        </div>
        
        {/* Time Filter & Refresh */}
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={(value: '7d' | '30d' | '90d' | '180d' | '365d') => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7D</SelectItem>
              <SelectItem value="30d">30D</SelectItem>
              <SelectItem value="90d">90D</SelectItem>
              <SelectItem value="365d">All</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAnalytics}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards (Top 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stakes</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="w-12 h-6 bg-muted animate-pulse rounded" />
              ) : (
                analytics?.activeCount || 0
              )}
            </div>
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
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="w-20 h-6 bg-muted animate-pulse rounded" />
              ) : (
                `${formatETH(analytics?.totalStaked || 0)} ETH`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active ETH amount
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
              {isLoading ? (
                <div className="w-20 h-6 bg-muted animate-pulse rounded" />
              ) : (
                `+${formatETH(analytics?.totalRewards || 0)} ETH`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Earned rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="w-16 h-6 bg-muted animate-pulse rounded" />
              ) : (
                `${calculateWeightedAPY().toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation & Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="pools" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Pool Insights
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab - Stake Growth Line Chart */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stake Growth Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total staked ETH amount progression
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading chart data...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${formatETH(value)} ETH`}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`${formatETH(value)} ETH`, 'Total Staked']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalStaked" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab - Rewards Area Chart */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reward Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cumulative rewards earned over time
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading chart data...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${formatETH(value)} ETH`}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`${formatETH(value)} ETH`, 'Rewards']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rewards" 
                      stroke="#82ca9d" 
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pool Insights Tab - Distribution Bar Chart */}
        <TabsContent value="pools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pool Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Stake amount distribution across pools
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading chart data...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : analytics?.poolDistribution && analytics.poolDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.poolDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${formatETH(value)} ETH`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'amount') return [`${formatETH(value)} ETH`, 'Staked Amount'];
                        if (name === 'rewards') return [`${formatETH(value)} ETH`, 'Rewards'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="amount" fill="#8884d8" name="amount" />
                    <Bar dataKey="rewards" fill="#82ca9d" name="rewards" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No pool data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
