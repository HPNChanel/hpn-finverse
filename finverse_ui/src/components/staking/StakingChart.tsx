import { BarChart3, TrendingUp } from 'lucide-react';
import { RewardHistory } from '@/services/stakingService';

interface StakingChartProps {
  data: RewardHistory[];
  title: string;
  type: 'line' | 'bar';
}

export function StakingChart({ data, title, type }: StakingChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  // Group data by date and sum rewards
  const groupedData = data.reduce((acc, reward) => {
    const date = reward.date;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += reward.reward_amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(groupedData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7); // Last 7 days

  const maxValue = Math.max(...chartData.map(([, value]) => value));

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      
      {chartData.length > 0 ? (
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-40 flex items-end justify-between gap-2">
            {chartData.map(([date, value]) => {
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="bg-gradient-to-t from-primary to-primary/60 w-full rounded-t transition-all duration-300 hover:from-primary/80"
                    style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0px' }}
                    title={`${date}: ${formatCurrency(value)}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className="flex items-center justify-between text-sm border-t border-border pt-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Total Rewards (7 days)</span>
            </div>
            <span className="font-bold text-green-600">
              {formatCurrency(chartData.reduce((sum, [, value]) => sum + value, 0))}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No reward data available</p>
        </div>
      )}
    </div>
  );
}
