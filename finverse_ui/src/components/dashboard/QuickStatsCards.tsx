import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle, Target } from 'lucide-react';
import { safeNumber, safeToFixed } from '@/utils/errorHelpers';

interface DashboardOverview {
  total_balance: number;
  total_income_month: number;
  total_expenses_month: number;
  net_income_month: number;
  active_budgets_count: number;
  total_budget_limit: number;
  total_budget_spent: number;
  budget_health_score: number;
  active_goals_count: number;
  total_goals_target: number;
  total_goals_current: number;
  goals_completion_rate: number;
  savings_rate: number;
  spending_trend: string;
  top_expense_category?: string;
}

interface QuickStatsCardsProps {
  overview: DashboardOverview | null;
  loading?: boolean;
}

export function QuickStatsCards({ overview, loading = false }: QuickStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(safeNumber(amount));
    } catch (error) {
      return `$${safeNumber(amount)}`;
    }
  };

  const formatPercentage = (value: number) => {
    return `${safeToFixed(value, 1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBudgetHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="w-16 h-4 bg-muted animate-pulse rounded" />
              <div className="w-5 h-5 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="w-20 h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="w-24 h-3 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Balance",
      value: formatCurrency(overview.total_balance),
      description: "Across all accounts",
      icon: DollarSign,
      trend: null
    },
    {
      title: "Monthly Income",
      value: formatCurrency(overview.total_income_month),
      description: "This month",
      icon: TrendingUp,
      trend: "positive"
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(overview.total_expenses_month),
      description: overview.spending_trend ? `Trend: ${overview.spending_trend}` : "This month",
      icon: TrendingDown,
      trend: overview.spending_trend,
      trendIcon: getTrendIcon(overview.spending_trend)
    },
    {
      title: "Net Income",
      value: formatCurrency(overview.net_income_month),
      description: `Savings rate: ${formatPercentage(overview.savings_rate)}`,
      icon: Wallet,
      trend: overview.net_income_month >= 0 ? "positive" : "negative"
    },
    {
      title: "Budget Health",
      value: formatPercentage(overview.budget_health_score),
      description: `${overview.active_budgets_count} active budgets`,
      icon: AlertCircle,
      trend: null,
      valueColor: getBudgetHealthColor(overview.budget_health_score)
    },
    {
      title: "Goals Progress",
      value: formatPercentage(overview.goals_completion_rate),
      description: `${overview.active_goals_count} active goals`,
      icon: Target,
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="flex items-center gap-1">
                {stat.trendIcon && stat.trendIcon}
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.valueColor || 'text-foreground'}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
