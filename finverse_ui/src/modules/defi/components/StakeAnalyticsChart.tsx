import { useState } from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useStakingAnalytics } from '@/hooks/useStakingAnalytics';
import { useWallet } from '@/hooks/useWallet';

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0',
  '#87ceeb', '#dda0dd', '#98fb98', '#f0e68c', '#ff6347'
];

type TimeframeOption = '7d' | '30d' | '90d' | '180d' | '365d';

export function StakeAnalyticsChart() {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30d');
  const { isConnected, accountAddress } = useWallet();
  
  const {
    analytics,
    isLoading,
    error,
    refetchAnalytics,
    formatFVTAmount,
    formatPercentage
  } = useStakingAnalytics(timeframe);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
  };

  // Custom tooltip components with safe formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatFVTAmount(entry.value || 0)} FVT`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">{`Amount: ${formatFVTAmount(data.amount || 0)} FVT`}</p>
          <p className="text-muted-foreground">{`Stakes: ${data.count || 0}`}</p>
          <p className="text-muted-foreground">{`${formatPercentage(data.percentage || 0)} of total`}</p>
        </div>
      );
    }
    return null;
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Wallet Required</h3>
            <p className="text-muted-foreground">Connect your wallet to view staking analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading analytics data...</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Analytics</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetchAnalytics} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
          <p className="text-muted-foreground">
            Detailed view of your staking performance over time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="180d">6 Months</SelectItem>
              <SelectItem value="365d">1 Year</SelectItem>
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

      {/* Charts */}
      <Tabs defaultValue="stake-growth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake-growth">Stake Growth</TabsTrigger>
          {/* Removed duplicate inner Reward Timeline (conflicts with global Reward Timeline tab) */}
          <TabsTrigger value="distribution">Pool Distribution</TabsTrigger>
        </TabsList>

        {/* Stake Growth Chart */}
        <TabsContent value="stake-growth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Staking Growth Over Time
              </CardTitle>
              <CardDescription>
                Track your total staked amount growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.dailyData && analytics.dailyData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatFVTAmount(value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalStaked"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        name="Total Staked"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No staking data yet</p>
                    <p className="text-sm">Start staking to see your growth chart</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Removed duplicate inner Reward Timeline (conflicts with global Reward Timeline tab) */}

        {/* Pool Distribution Chart */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Staking Pool Distribution
              </CardTitle>
              <CardDescription>
                Overview of your stakes across different pools
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.poolDistribution && analytics.poolDistribution.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.poolDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name || 'Unnamed'} (${formatPercentage(percentage || 0)})`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {analytics.poolDistribution.map((entry, index) => {
                            // Safe key for pie chart cells
                            const poolIdParsed = entry.poolId ? Number(entry.poolId) : NaN;
                            const isValidPoolId = Number.isFinite(poolIdParsed) && poolIdParsed >= 0;
                            const safeKey = isValidPoolId ? `pie-cell-${poolIdParsed}` : `pie-cell-${index}`;

                            return (
                              <Cell key={safeKey} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            );
                          })}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pool Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Pool Breakdown</h4>
                    <div className="space-y-3">
                      {analytics.poolDistribution.map((pool, index) => {
                        // Safe key validation for pool distribution
                        const poolIdParsed = pool.poolId ? Number(pool.poolId) : NaN;
                        const isValidPoolId = Number.isFinite(poolIdParsed) && poolIdParsed >= 0;
                        const safeKey = isValidPoolId ? `analytics-pool-${poolIdParsed}` : `analytics-pool-${index}-${pool.name || 'unnamed'}`;

                        // Log any problematic pool distribution data
                        if (!isValidPoolId) {
                          console.warn(`⚠️ Analytics pool with invalid poolId:`, {
                            poolData: pool,
                            originalPoolId: pool.poolId,
                            parsedPoolId: poolIdParsed,
                            fallbackKey: safeKey,
                            index
                          });
                        }

                        return (
                          <div key={safeKey} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <div>
                                <p className="font-medium">{pool.name || `Pool ${index + 1}`}</p>
                                <p className="text-sm text-muted-foreground">{pool.count || 0} stake{(pool.count || 0) > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatFVTAmount(pool.amount || 0)} FVT</p>
                              <p className="text-sm text-muted-foreground">{formatPercentage(pool.percentage || 0)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No pool distribution data</p>
                    <p className="text-sm">Stake in different pools to see distribution</p>
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
