import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Brain,
  Loader2
} from 'lucide-react';
import { useStakingAuth } from '@/hooks/useStakingAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  rewards_over_time: {
    date: string;
    cumulative_rewards: number;
    daily_rewards: number;
    predicted_rewards: number;
  }[];
  pool_distribution: {
    pool_name: string;
    pool_id: number;
    staked_amount: number;
    percentage: number;
    apy: number;
    lock_period: number;
  }[];
  performance_comparison: {
    month: string;
    predicted_rewards: number;
    actual_rewards: number;
    variance_percentage: number;
  }[];
  summary_stats: {
    total_staked: number;
    total_rewards_earned: number;
    average_apy: number;
    best_performing_pool: string;
    prediction_accuracy: number;
    portfolio_growth: number;
  };
}

const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
];

export function StakingAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartView, setChartView] = useState<'area' | 'line'>('area');

  const { user } = useStakingAuth();
  const { isConnected, accountAddress } = useWallet();
  const { toast } = useToast();

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!user || !isConnected) {
      setAnalyticsData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await import('@/lib/api').then(module => module.default.get(`/staking/analytics?timeframe=${timeframe}`));
      setAnalyticsData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load analytics';
      setError(errorMessage);
      
      toast({
        title: "Failed to Load Analytics",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and timeframe change
  useEffect(() => {
    fetchAnalyticsData();
  }, [user, isConnected, timeframe]);

  // Format currency with safe number handling
  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount ?? 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(safeAmount);
  };

  // Format percentage with safe number handling
  const formatPercentage = (value: number | undefined | null) => {
    const safeValue = value ?? 0;
    return `${safeValue.toFixed(1)}%`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)} FVT
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalyticsData();
    toast({
      title: "Refreshing Analytics",
      description: "Updating your staking analytics...",
    });
  };

  // Loading state
  if (isLoading && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staking Analytics</h1>
            <p className="text-muted-foreground">Performance insights and data visualization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staking Analytics</h1>
            <p className="text-muted-foreground">Performance insights and data visualization</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load analytics: {error}</span>
            <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Safe access to analytics data with fallbacks
  const safeAnalyticsData = analyticsData ? {
    rewards_over_time: analyticsData.rewards_over_time || [],
    pool_distribution: analyticsData.pool_distribution || [],
    performance_comparison: analyticsData.performance_comparison || [],
    summary_stats: {
      total_staked: analyticsData.summary_stats?.total_staked ?? 0,
      total_rewards_earned: analyticsData.summary_stats?.total_rewards_earned ?? 0,
      average_apy: analyticsData.summary_stats?.average_apy ?? 0,
      best_performing_pool: analyticsData.summary_stats?.best_performing_pool ?? 'N/A',
      prediction_accuracy: analyticsData.summary_stats?.prediction_accuracy ?? 0,
      portfolio_growth: analyticsData.summary_stats?.portfolio_growth ?? 0,
    }
  } : null;

  // Empty state
  if (!safeAnalyticsData || !isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staking Analytics</h1>
            <p className="text-muted-foreground">Performance insights and data visualization</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-16">
            <div className="max-w-md mx-auto">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground mb-6">
                {!isConnected 
                  ? "Connect your wallet to view analytics data." 
                  : "Start staking to generate analytics and performance insights!"
                }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staking Analytics</h1>
          <p className="text-muted-foreground">
            Performance insights and predictive analytics for your staking portfolio
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(safeAnalyticsData.summary_stats.total_staked)} FVT
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio growth: {safeAnalyticsData.summary_stats.portfolio_growth >= 0 ? '+' : ''}
              {safeAnalyticsData.summary_stats.portfolio_growth.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(safeAnalyticsData.summary_stats.total_rewards_earned)} FVT
            </div>
            <p className="text-xs text-muted-foreground">
              Avg APY: {safeAnalyticsData.summary_stats.average_apy.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Pool</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {safeAnalyticsData.summary_stats.best_performing_pool}
            </div>
            <p className="text-xs text-muted-foreground">
              Top performing pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {safeAnalyticsData.summary_stats.prediction_accuracy.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Prediction accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="rewards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Rewards Over Time
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Pool Distribution
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance Analysis
          </TabsTrigger>
        </TabsList>

        {/* Rewards Over Time Chart */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rewards Accumulation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your reward earnings and predictions over time
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={chartView === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('area')}
                >
                  Area
                </Button>
                <Button
                  variant={chartView === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('line')}
                >
                  Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'area' ? (
                    <AreaChart data={safeAnalyticsData.rewards_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cumulative_rewards"
                        stroke={CHART_COLORS[0]}
                        fill={CHART_COLORS[0]}
                        fillOpacity={0.3}
                        name="Actual Rewards"
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted_rewards"
                        stroke={CHART_COLORS[1]}
                        fill={CHART_COLORS[1]}
                        fillOpacity={0.2}
                        strokeDasharray="5 5"
                        name="Predicted Rewards"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={safeAnalyticsData.rewards_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cumulative_rewards"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={2}
                        name="Actual Rewards"
                        dot={{ fill: CHART_COLORS[0], strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted_rewards"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Predicted Rewards"
                        dot={{ fill: CHART_COLORS[1], strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pool Distribution Chart */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Token Distribution by Pool</CardTitle>
                <p className="text-sm text-muted-foreground">
                  How your tokens are distributed across different staking pools
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={safeAnalyticsData.pool_distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ pool_name, percentage }) => `${pool_name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="staked_amount"
                      >
                        {safeAnalyticsData.pool_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value) + ' FVT', 'Staked Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pool Details */}
            <Card>
              <CardHeader>
                <CardTitle>Pool Performance Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed breakdown of each pool's performance
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safeAnalyticsData.pool_distribution.map((pool, index) => (
                    <div key={pool.pool_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{pool.pool_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pool.lock_period === 0 ? 'Flexible' : `${pool.lock_period}d lock`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(pool.staked_amount)} FVT</p>
                        <Badge variant="secondary">{(pool.apy || 0).toFixed(1)}% APY</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Comparison Chart */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predicted vs Actual Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare AI predictions with actual reward performance
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeAnalyticsData.performance_comparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="predicted_rewards" 
                      fill={CHART_COLORS[0]} 
                      name="Predicted Rewards"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="actual_rewards" 
                      fill={CHART_COLORS[1]} 
                      name="Actual Rewards"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {safeAnalyticsData.performance_comparison.map((period, index) => (
              <Card key={period.month}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{period.month}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Predicted</span>
                    <span className="font-medium">{formatCurrency(period.predicted_rewards)} FVT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Actual</span>
                    <span className="font-medium">{formatCurrency(period.actual_rewards)} FVT</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Variance</span>
                    <div className="flex items-center gap-1">
                      {(period.variance_percentage || 0) >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-600" />
                      )}
                      <span className={cn(
                        "font-medium text-sm",
                        (period.variance_percentage || 0) >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {Math.abs(period.variance_percentage || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
