import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface CategoryBreakdownItem {
  category_id: number;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

interface CategoryBreakdownData {
  period: string;
  transaction_type: string;
  total_amount: number;
  categories: CategoryBreakdownItem[];
  period_start: string;
  period_end: string;
}

interface SpendingBreakdownProps {
  userId?: number;
  period?: string;
  transactionType?: string;
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

export function SpendingBreakdown({ 
  userId, 
  period = 'month', 
  transactionType = 'expense' 
}: SpendingBreakdownProps) {
  const [breakdownData, setBreakdownData] = useState<CategoryBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBreakdownData();
  }, [userId, period, transactionType]);

  const fetchBreakdownData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(
        `/dashboard/category-breakdown?period=${period}&transaction_type=${transactionType}`
      );

      const data = response.data;
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      // Ensure categories is an array
      if (!Array.isArray(data.categories)) {
        console.warn('categories is not an array, using empty array');
        data.categories = [];
      }

      setBreakdownData(data);
    } catch (err) {
      console.error('Error fetching breakdown data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load category data');
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

  const getDisplayTitle = () => {
    const typeLabel = transactionType === 'expense' ? 'Spending' : 'Income';
    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
    return `${typeLabel} Breakdown - ${periodLabel}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {getDisplayTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {getDisplayTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-500 mb-2">Failed to load category data</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button 
                onClick={fetchBreakdownData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!breakdownData || !Array.isArray(breakdownData.categories) || breakdownData.categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {getDisplayTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <PieChartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No category data available</p>
              <p className="text-sm text-gray-400">
                {transactionType === 'expense' 
                  ? 'Start adding expenses to see spending breakdown'
                  : 'Start adding income to see income breakdown'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data with colors
  const chartData = breakdownData.categories.map((category, index) => ({
    name: category.category_name,
    value: category.amount,
    percentage: category.percentage,
    count: category.transaction_count,
    color: category.category_color || COLORS[index % COLORS.length]
  }));

  // Show only top 5 categories in pie chart
  const topCategories = chartData.slice(0, 5);
  const otherAmount = chartData.slice(5).reduce((sum, cat) => sum + cat.value, 0);
  
  let finalChartData = topCategories;
  if (otherAmount > 0) {
    finalChartData = [
      ...topCategories,
      {
        name: 'Others',
        value: otherAmount,
        percentage: (otherAmount / breakdownData.total_amount * 100),
        count: chartData.slice(5).reduce((sum, cat) => sum + cat.count, 0),
        color: '#9CA3AF'
      }
    ];
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Amount: {formatCurrency(data.value)}</p>
          <p className="text-sm">Percentage: {data.percentage.toFixed(1)}%</p>
          <p className="text-sm">Transactions: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {getDisplayTitle()}
        </CardTitle>
        <div className="text-sm text-gray-600">
          Total: {formatCurrency(breakdownData.total_amount)} across {breakdownData.categories.length} categories
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={finalChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {finalChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category List */}
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">Category Details</h4>
          {breakdownData.categories.slice(0, 5).map((category, index) => (
            <div key={category.category_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.category_color || COLORS[index % COLORS.length] }}
                ></div>
                <div>
                  <p className="font-medium text-sm">{category.category_name}</p>
                  <p className="text-xs text-gray-500">{category.transaction_count} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(category.amount)}</p>
                <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
          
          {breakdownData.categories.length > 5 && (
            <div className="flex items-center justify-between py-2 text-gray-500">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-gray-400"></div>
                <div>
                  <p className="font-medium text-sm">Others ({breakdownData.categories.length - 5} categories)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(otherAmount)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
