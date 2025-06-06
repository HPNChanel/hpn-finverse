import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import api from '@/lib/api';

interface TrendDataPoint {
  period: string;
  period_label: string;
  income: number;
  expenses: number;
  net: number;
  period_start: string;
  period_end: string;
}

interface CashflowTrendData {
  period_type: string;
  total_periods: number;
  data_points: TrendDataPoint[];
  summary: {
    total_income: number;
    total_expenses: number;
    total_net: number;
    avg_income: number;
    avg_expenses: number;
    avg_net: number;
  };
}

interface FinancialChartsProps {
  monthlyStats?: any; // Keep for backward compatibility
  timeFilter?: string;
  loading?: boolean;
  error?: string;
  userId?: number;
  period?: string;
  months?: number;
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ 
  monthlyStats,
  timeFilter,
  loading: externalLoading,
  error: externalError,
  userId, 
  period = 'month', 
  months = 12 
}) => {
  const [trendsData, setTrendsData] = useState<CashflowTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<6 | 12>(12);

  // Use external data if provided, otherwise fetch
  useEffect(() => {
    if (monthlyStats) {
      setTrendsData(monthlyStats);
      setLoading(false);
      setError(null);
    } else {
      fetchTrendsData();
    }
  }, [monthlyStats, userId, period, selectedPeriod]);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(
        `/dashboard/trends?period=${period}&months=${selectedPeriod}`
      );

      const data = response.data;
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      if (!Array.isArray(data.data_points)) {
        console.warn('data_points is not an array, using empty array');
        data.data_points = [];
      }

      setTrendsData(data);
    } catch (err) {
      console.error('Error fetching trends data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (periodLabel: string) => {
    const parts = periodLabel.split(' ');
    if (parts.length >= 1) {
      return parts[0].substring(0, 3);
    }
    return periodLabel;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.fullLabel || label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm capitalize">{entry.dataKey}:</span>
                </div>
                <span className="font-medium" style={{ color: entry.color }}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
          {payload[0]?.payload?.net !== undefined && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Net Income:</span>
                <span className={`font-semibold ${
                  payload[0].payload.net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {payload[0].payload.net >= 0 ? '+' : ''}{formatCurrency(payload[0].payload.net)}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const isLoadingState = loading || externalLoading;
  const errorState = error || externalError;

  if (isLoadingState) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorState) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-500 mb-2">Failed to load chart data</p>
              <p className="text-sm text-gray-500 mb-4">{errorState}</p>
              <Button onClick={fetchTrendsData} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendsData || !Array.isArray(trendsData.data_points) || trendsData.data_points.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-gray-500 mb-4">Start adding transactions to see your financial trends</p>
              <Button onClick={() => window.location.href = '/transactions'} size="sm">
                Add Transactions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process chart data
  const chartData = trendsData.data_points.slice(-selectedPeriod).map(point => ({
    month: formatMonth(point.period_label || point.period),
    income: Math.max(0, point.income || 0),
    expense: Math.max(0, point.expenses || 0),
    net: point.net || 0,
    fullLabel: point.period_label || point.period
  }));

  const summary = trendsData.summary || {
    total_income: 0,
    total_expenses: 0,
    total_net: 0,
    avg_income: 0,
    avg_expenses: 0,
    avg_net: 0
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Trends
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Income, expenses, and net income over time
            </p>
          </div>
          
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              <Button
                variant={selectedPeriod === 6 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(6)}
              >
                6 Months
              </Button>
              <Button
                variant={selectedPeriod === 12 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(12)}
              >
                12 Months
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart Container */}
        <div className="w-full h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              
              {/* Animated Lines */}
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                strokeWidth={3}
                name="Income"
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                animationDuration={1500}
                animationBegin={0}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Expenses"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                animationDuration={1500}
                animationBegin={500}
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Net Income"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                animationDuration={1500}
                animationBegin={1000}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">Average Income</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(summary.avg_income)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700">Average Expenses</span>
            </div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(summary.avg_expenses)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">Average Net</span>
            </div>
            <div className={`text-lg font-bold ${
              summary.avg_net >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {summary.avg_net >= 0 ? '+' : ''}{formatCurrency(summary.avg_net)}
            </div>
          </div>
        </div>

        {/* Period Summary */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedPeriod} Month Summary
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Total Net: {summary.total_net >= 0 ? '+' : ''}{formatCurrency(summary.total_net)}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-500">
                {summary.total_net >= 0 ? 'Positive cashflow' : 'Negative cashflow'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialCharts;
export { FinancialCharts };
