import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApiError } from '@/utils/errorHandler.tsx';
import { extractErrorMessage } from '@/utils/errorHelpers';
import api from '@/lib/api';

// Import dashboard components with correct paths
import { QuickStatsCards } from '../components/dashboard/QuickStatsCards';
import { BudgetSummary } from '../components/dashboard/BudgetSummary';
// import { SpendingBreakdown } from '../components/dashboard/SpendingBreakdown'; // ❌ Commented out
import FinancialCharts from '../components/dashboard/FinancialCharts';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { GoalsProgress } from '../components/dashboard/GoalsProgress';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DashboardData {
  overview: any;
  categoryBreakdown: any;
  trends: any;
  budgets: any[];
  recentActivity: any[];
  goals: any[];
}

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    overview: null,
    categoryBreakdown: null,
    trends: null,
    budgets: [],
    recentActivity: [],
    goals: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const { toast } = useToast();
  const { handleError } = useApiError();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Call all required dashboard APIs in parallel
      const [
        overviewResponse,
        categoryBreakdownResponse,
        trendsResponse,
        budgetsResponse,
        activityResponse,
        goalsResponse
      ] = await Promise.allSettled([
        api.get('/dashboard/overview'),
        api.get('/dashboard/category-breakdown?period=month&transaction_type=expense'),
        api.get('/dashboard/trends?period=month&months=12'),
        api.get('/budgets?is_active=true'),
        api.get('/dashboard/recent-activity?limit=10'),
        api.get('/goals')
      ]);

      // Process responses with fallbacks and validation
      const overview = overviewResponse.status === 'fulfilled' ? overviewResponse.value.data : null;
      const categoryBreakdown = categoryBreakdownResponse.status === 'fulfilled' ? categoryBreakdownResponse.value.data : null;
      const trends = trendsResponse.status === 'fulfilled' ? trendsResponse.value.data : null;
      
      // Handle budget response format with validation
      let budgets = [];
      if (budgetsResponse.status === 'fulfilled') {
        const budgetData = budgetsResponse.value.data;
        const rawBudgets = budgetData?.budgets || budgetData?.data?.budgets || (Array.isArray(budgetData) ? budgetData : []);
        budgets = Array.isArray(rawBudgets) ? rawBudgets : [];
        console.log('Dashboard: Processed budgets:', budgets.length);
      }

      // Handle activity response with validation
      let recentActivity = [];
      if (activityResponse.status === 'fulfilled') {
        const activityData = activityResponse.value.data;
        const rawActivity = activityData?.activities || activityData?.data?.activities || (Array.isArray(activityData) ? activityData : []);
        recentActivity = Array.isArray(rawActivity) ? rawActivity : [];
        console.log('Dashboard: Processed activities:', recentActivity.length);
      }

      // Handle goals response with validation
      let goals = [];
      if (goalsResponse.status === 'fulfilled') {
        const goalsData = goalsResponse.value.data;
        const rawGoals = goalsData?.data || (Array.isArray(goalsData) ? goalsData : []);
        goals = Array.isArray(rawGoals) ? rawGoals : [];
        console.log('Dashboard: Processed goals:', goals.length);
      }

      // Log any failed requests for debugging
      [overviewResponse, categoryBreakdownResponse, trendsResponse, budgetsResponse, activityResponse, goalsResponse]
        .forEach((response, index) => {
          const endpoints = ['overview', 'category-breakdown', 'trends', 'budgets', 'recent-activity', 'goals'];
          if (response.status === 'rejected') {
            console.warn(`Dashboard: Failed to fetch ${endpoints[index]}:`, response.reason);
          }
        });

      setDashboardData({
        overview,
        categoryBreakdown,
        trends,
        budgets,
        recentActivity,
        goals
      });

    } catch (err) {
      const errorMessage = handleError(err, 'Fetch Dashboard Data');
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Add budget-specific refresh function
  const refreshBudgetData = async () => {
    try {
      const budgetsResponse = await api.get('/budgets?is_active=true');
      
      if (budgetsResponse.status === 'fulfilled') {
        const budgetData = budgetsResponse.data;
        const rawBudgets = budgetData?.budgets || budgetData?.data?.budgets || (Array.isArray(budgetData) ? budgetData : []);
        const budgets = Array.isArray(rawBudgets) ? rawBudgets : [];
        
        setDashboardData(prev => ({
          ...prev,
          budgets
        }));
        
        console.log('Budget data refreshed:', budgets.length);
      }
    } catch (error) {
      console.error('Failed to refresh budget data:', error);
      // Add user notification
      toast({
        title: "Refresh Failed",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  // Expose refresh function for child components
  const handleTransactionChange = () => {
    // Refresh both transactions and budgets
    setTimeout(() => {
      fetchDashboardData();
    }, 1000); // Small delay to allow backend processing
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's your financial overview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-destructive">{error}</span>
            <button
              onClick={handleRefresh}
              className="text-sm text-destructive hover:text-destructive/80 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <QuickStatsCards 
        overview={dashboardData.overview}
        loading={loading}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Summary */}
        <BudgetSummary
          budgets={dashboardData.budgets}
          totalLimit={dashboardData.budgets.reduce((sum, b) => sum + (b.limit_amount || 0), 0)}
          totalSpent={dashboardData.budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0)}
          healthScore={dashboardData.overview?.budget_health_score || 100}
          loading={loading}
        />

        {/* Recent Transactions */}
        <RecentTransactions
          transactions={dashboardData.recentActivity}
          loading={loading}
          onRefresh={handleRefresh}
          onTransactionChange={handleTransactionChange} // Pass callback
        />
      </div>

      {/* Full Width Financial Charts */}
      <FinancialCharts
        monthlyStats={dashboardData.trends}
        timeFilter="month"
        loading={loading}
        error={error}
      />

      {/* Goals Progress */}
      {dashboardData.goals.length > 0 && (
        <GoalsProgress
          goals={dashboardData.goals}
          activeGoal={dashboardData.overview?.active_goal}
        />
      )}
    </div>
  );
}

export function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

