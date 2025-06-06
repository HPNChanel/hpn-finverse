import { PieChart, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { budgetService } from '@/services/budgetService';
import api from '@/lib/api';
import { safeToFixed, safeNumber, extractErrorMessage } from '@/utils/errorHelpers';

interface CurrentMonthStats {
  income: number;
  expenses: number;
  net: number;
  transaction_count: number;
  month: number;
  year: number;
}

interface BudgetCategory {
  id: number;
  name: string;
  total_budget: number;
  total_spent: number;
  percentage_used: number;
  budget_count: number;
}

interface BudgetOverviewProps {
  currentStats: CurrentMonthStats | null;
  budgetStats: {
    total_budgets: number;
    active_budgets: number;
    exceeded_budgets: number;
    total_budget_amount: number;
    total_spent_amount: number;
    overall_usage_percentage: number;
  } | null;
  timeFilter: string;
  loading?: boolean;
  onRefresh?: () => void;
}

export function BudgetOverview({ currentStats, budgetStats, timeFilter, loading = false, onRefresh }: BudgetOverviewProps) {
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      // Use the correct service method
      const response = await budgetService.getBudgetSummaryStats();
      const budgetData = response?.categories || [];
      setBudgetCategories(budgetData);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch budget data:', error);
      setError(extractErrorMessage(error));
      // Fallback to empty data
      setBudgetCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Safe access to budget stats with fallbacks
  const safeBudgetStats = {
    total_budgets: safeNumber(budgetStats?.total_budgets, 0),
    active_budgets: safeNumber(budgetStats?.active_budgets, 0),
    exceeded_budgets: safeNumber(budgetStats?.exceeded_budgets, 0),
    total_budget_amount: safeNumber(budgetStats?.total_budget_amount, 0),
    total_spent_amount: safeNumber(budgetStats?.total_spent_amount, 0),
    overall_usage_percentage: safeNumber(budgetStats?.overall_usage_percentage, 0)
  };

  const getBudgetStatus = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return { status: 'over', icon: AlertCircle, color: 'text-red-600' };
    if (percentage >= 80) return { status: 'warning', icon: Clock, color: 'text-yellow-600' };
    return { status: 'good', icon: CheckCircle, color: 'text-green-600' };
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Budget Overview
        </h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          )}
          <span className="text-sm text-muted-foreground capitalize">{timeFilter}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground">Loading budget data...</p>
        </div>
      ) : !budgetStats ? (
        <div className="text-center py-8">
          <PieChart className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">No budget data available</p>
          <button
            onClick={() => window.location.href = '/budgets'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Budget Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {safeBudgetStats.total_budgets}
              </div>
              <div className="text-xs text-blue-700">Total Budgets</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {safeBudgetStats.active_budgets}
              </div>
              <div className="text-xs text-green-700">Active</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {safeBudgetStats.exceeded_budgets}
              </div>
              <div className="text-xs text-red-700">Exceeded</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {safeToFixed(safeBudgetStats.overall_usage_percentage, 1)}%
              </div>
              <div className="text-xs text-yellow-700">Usage</div>
            </div>
          </div>

          {/* Overall Budget Summary */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monthly Budget Usage</span>
              <span className="text-sm text-muted-foreground">
                {safeToFixed(safeBudgetStats.overall_usage_percentage, 1)}% used
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-2">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(safeBudgetStats.overall_usage_percentage, 100)}%` 
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(safeBudgetStats.total_spent_amount)} spent</span>
              <span>{formatCurrency(safeBudgetStats.total_budget_amount)} budgeted</span>
            </div>
          </div>

          {/* Budget Status Indicator */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Budget Status</p>
                <p className="text-blue-700">
                  {safeBudgetStats.exceeded_budgets > 0 ? 
                    `${safeBudgetStats.exceeded_budgets} budget(s) exceeded. Review your spending categories.` :
                    safeBudgetStats.overall_usage_percentage > 80 ?
                    `${safeBudgetStats.active_budgets} budget(s) approaching limit. Monitor spending closely.` :
                    "All budgets are on track. Great job managing your finances!"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
