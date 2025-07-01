import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface SavingsProjection {
  month_index: number;
  balance: number;
  interest_earned: number;
}

interface SavingsPlanChartProps {
  projections: SavingsProjection[];
  height?: number;
  showInterest?: boolean;
}

export function SavingsPlanChart({ 
  projections, 
  height = 300, 
  showInterest = false 
}: SavingsPlanChartProps) {
  // Format the data for the chart
  const chartData = projections.map((projection, index) => ({
    month: `Month ${projection.month_index}`,
    monthNumber: projection.month_index,
    balance: projection.balance,
    interest: projection.interest_earned,
    // Calculate cumulative values for better visualization
    contributions: index === 0 ? projection.balance : projection.balance - projection.interest_earned,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      name: string;
      value: number;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!projections || projections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No projection data available</p>
      </div>
    );
  }

  if (showInterest) {
    // Show area chart with contributions and interest breakdown
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="monthNumber" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value % 6 === 0 || value === 1 ? `M${value}` : ''}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="contributions"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Contributions"
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Interest Earned"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Show simple line chart for total balance
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="monthNumber" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              // Show every 6th month for better readability, plus first and last
              if (value === 1 || value === chartData.length || value % 6 === 0) {
                return `M${value}`;
              }
              return '';
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            name="Total Balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 