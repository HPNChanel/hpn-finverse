import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { budgetService } from '@/services/budgetService';
import { useToast } from '@/hooks/use-toast';

interface Budget {
  id: number;
  budget_id?: number; // Some APIs might use budget_id instead of id
  budget_name?: string;
  name: string;
  category_name: string;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
  status: string;
  is_active?: boolean;
  days_remaining?: number;
}

interface BudgetSummaryProps {
  budgets?: Budget[]; // Make optional to allow internal fetching
  totalLimit?: number;
  totalSpent?: number;
  healthScore?: number;
  loading?: boolean;
}

const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export function BudgetSummary({ 
  budgets: externalBudgets, 
  totalLimit: externalTotalLimit, 
  totalSpent: externalTotalSpent, 
  healthScore: externalHealthScore, 
  loading: externalLoading = false 
}: BudgetSummaryProps) {
  const [internalBudgets, setInternalBudgets] = useState<Budget[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Use external data if provided, otherwise fetch internally
  const budgets = externalBudgets || internalBudgets;
  const loading = externalLoading || internalLoading;

  useEffect(() => {
    // Only fetch if no external budgets provided
    if (!externalBudgets) {
      fetchBudgets();
    }
  }, [externalBudgets]);

  const fetchBudgets = async () => {
    try {
      setInternalLoading(true);
      setError(null);
      
      console.log('BudgetSummary: Fetching active budgets...');
      
      // 1. Ensure correct API call
      const response = await budgetService.getBudgets({ 
        is_active: true,
        status: 'active'
      });
      
      console.log('BudgetSummary: Raw API response:', response);
      
      // 2. Verify response structure and extract budgets
      let budgetsList: Budget[] = [];
      
      if (response && typeof response === 'object') {
        // Try different possible response structures
        budgetsList = response.budgets || response.data?.budgets || [];
        
        if (Array.isArray(response) && !response.budgets) {
          budgetsList = response;
        }
      }
      
      console.log('BudgetSummary: Extracted budgets:', budgetsList);
      console.log('BudgetSummary: Budget count:', budgetsList.length);
      
      // Validate and normalize budget objects
      const validBudgets = budgetsList.filter((budget: any) => {
        if (!budget || typeof budget !== 'object') {
          console.warn('BudgetSummary: Invalid budget object:', budget);
          return false;
        }
        
        // Check for required fields
        const hasRequiredFields = (
          (budget.id || budget.budget_id) &&
          (budget.name || budget.budget_name) &&
          typeof budget.limit_amount === 'number' &&
          typeof budget.spent_amount === 'number'
        );
        
        if (!hasRequiredFields) {
          console.warn('BudgetSummary: Budget missing required fields:', budget);
          return false;
        }
        
        // 4. Fix display logic - check both status and is_active
        const isActive = budget.is_active === true || 
                         budget.status === 'active' || 
                         budget.status === 'Active';
        
        if (!isActive) {
          console.log('BudgetSummary: Filtering out inactive budget:', {
            id: budget.id || budget.budget_id,
            name: budget.name || budget.budget_name,
            status: budget.status,
            is_active: budget.is_active
          });
        }
        
        return isActive;
      }).map((budget: any) => ({
        // Normalize budget object structure
        id: budget.id || budget.budget_id,
        name: budget.name || budget.budget_name,
        category_name: budget.category_name || 'Unknown Category',
        limit_amount: safeNumber(budget.limit_amount),
        spent_amount: safeNumber(budget.spent_amount),
        remaining_amount: safeNumber(budget.remaining_amount || (budget.limit_amount - budget.spent_amount)),
        usage_percentage: safeNumber(budget.usage_percentage || ((budget.spent_amount / budget.limit_amount) * 100)),
        status: budget.status || 'active',
        is_active: budget.is_active,
        days_remaining: budget.days_remaining
      }));
      
      console.log('BudgetSummary: Valid active budgets:', validBudgets);
      setInternalBudgets(validBudgets);
      
    } catch (err: any) {
      console.error('BudgetSummary: Failed to fetch budgets:', err);
      setError(err.message || 'Failed to load budgets');
      setInternalBudgets([]);
      
      toast({
        title: "Error",
        description: "Failed to load budget data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInternalLoading(false);
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
      console.error('Error formatting currency:', error);
      return `$${safeNumber(amount).toFixed(0)}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'exceeded':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'active':
        return 'text-green-600';
      case 'completed':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (status: string, percentage: number) => {
    if (percentage >= 100) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (status.toLowerCase() === 'completed') return <CheckCircle className="h-4 w-4 text-blue-500" />;
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <Clock className="h-4 w-4 text-green-500" />;
  };

  // Calculate totals from budgets if not provided externally
  const totalLimit = externalTotalLimit ?? budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = externalTotalSpent ?? budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const healthScore = externalHealthScore ?? 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
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
            <DollarSign className="h-5 w-5" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-red-500 mb-2">Failed to load budgets</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchBudgets}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Show cards if budgets.length > 0
  if (!budgets || budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">No active budgets found</p>
            <p className="text-sm text-gray-400">Create a budget to start tracking your spending</p>
            <button
              onClick={() => window.location.href = '/budgets?create=true'}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Budget
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeTotalLimit = safeNumber(totalLimit);
  const safeTotalSpent = safeNumber(totalSpent);
  const safeHealthScore = safeNumber(healthScore);
  const overallUsage = safeTotalLimit > 0 ? (safeTotalSpent / safeTotalLimit) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Budget Summary
        </CardTitle>
        <div className="text-sm text-gray-600">
          {budgets.length} active budget{budgets.length !== 1 ? 's' : ''} • Health Score: {safeHealthScore.toFixed(0)}%
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Budget Progress */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Budget Usage</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(safeTotalSpent)} / {formatCurrency(safeTotalLimit)}
            </span>
          </div>
          <Progress value={Math.min(overallUsage, 100)} className="mb-2" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{overallUsage.toFixed(1)}% used</span>
            <span>{formatCurrency(safeTotalLimit - safeTotalSpent)} remaining</span>
          </div>
        </div>

        {/* Individual Budget Items */}
        <div className="space-y-4">
          {budgets.slice(0, 5).map((budget) => {
            const safeUsagePercentage = safeNumber(budget.usage_percentage);
            const safeSpentAmount = safeNumber(budget.spent_amount);
            const safeLimitAmount = safeNumber(budget.limit_amount);
            
            return (
              <div key={budget.id} className="border-l-4 border-gray-200 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(budget.status, safeUsagePercentage)}
                    <div>
                      <p className="font-medium text-sm">{budget.name}</p>
                      <p className="text-xs text-gray-500">{budget.category_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(safeSpentAmount)} / {formatCurrency(safeLimitAmount)}
                    </p>
                    <p className={`text-xs ${getStatusColor(budget.status)}`}>
                      {safeUsagePercentage.toFixed(1)}% used
                    </p>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span></span>
                    <span className={getStatusColor(budget.status)}>
                      {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(safeUsagePercentage)}`}
                      style={{ width: `${Math.min(safeUsagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    {formatCurrency(Math.max(0, safeLimitAmount - safeSpentAmount))} remaining
                  </span>
                  {budget.days_remaining && (
                    <span>{budget.days_remaining} days left</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Health Score Indicator */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Budget Health Score</p>
              <p className="text-xs text-gray-600">Based on usage patterns and remaining amounts</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                safeHealthScore >= 80 ? 'text-green-600' : 
                safeHealthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {safeHealthScore.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">
                {safeHealthScore >= 80 ? 'Excellent' : 
                 safeHealthScore >= 60 ? 'Good' : 'Needs Attention'}
              </p>
            </div>
          </div>
        </div>

        {budgets.length > 5 && (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              And {budgets.length - 5} more budget{budgets.length - 5 !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Debug Info (only in development) */}
                  {import.meta.env.DEV && (
          <details className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <summary className="cursor-pointer text-gray-600">Debug Info</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify({
                budgetCount: budgets.length,
                totalLimit: safeTotalLimit,
                totalSpent: safeTotalSpent,
                healthScore: safeHealthScore,
                sampleBudget: budgets[0] || null
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
