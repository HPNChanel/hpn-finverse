import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, AlertCircle, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Budget, budgetService, BudgetSummary as IBudgetSummary, BudgetFilters } from '@/services/budgetService';
import { ErrorHandler, useApiError } from '@/utils/errorHandler.tsx';
import { useToast } from '@/hooks/use-toast';
import { CreateBudgetForm } from '../components/CreateBudgetForm';
import { EditBudgetForm } from '../components/EditBudgetForm';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<IBudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'exceeded'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { toast } = useToast();
  const { handleError } = useApiError();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchBudgets();
    
    // Check if we should open the create form based on URL
    if (searchParams.get('create') === 'true') {
      setShowCreateForm(true);
    }
  }, [filterStatus, searchParams]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters based on filterStatus
      const filters: BudgetFilters = {};
      
      if (filterStatus === 'active') {
        filters.is_active = true;
        filters.status = 'active';
      } else if (filterStatus === 'exceeded') {
        filters.status = 'exceeded';
      }
      
      const response = await budgetService.getBudgets(filters);
      
      setBudgets(response.budgets || []);
      setSummary(response.summary || null);
    } catch (err) {
      const errorMessage = handleError(err, 'Fetch Budgets');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to fetch budgets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      await budgetService.deleteBudget(id);
      setBudgets(budgets.filter(budget => budget.id !== id));
      
      toast({
        title: "Success",
        description: "Budget deleted successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Delete Budget');
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return budgetService.formatCurrency(amount);
  };

  const getStatusColor = (status: string) => {
    return budgetService.getStatusColor(status as any);
  };

  const getUsageColor = (percentage: number) => {
    return budgetService.getUsageColor(percentage);
  };

  const handleCreateBudgetSuccess = () => {
    setShowCreateForm(false);
    fetchBudgets(); // Fix: Changed from loadBudgets to fetchBudgets
    
    toast({
      title: "Success",
      description: "Budget created successfully",
    });
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowEditForm(true);
  };

  const handleEditBudgetSuccess = () => {
    setShowEditForm(false);
    setEditingBudget(null);
    fetchBudgets(); // Fix: Changed from loadBudgets to fetchBudgets
    
    toast({
      title: "Success", 
      description: "Budget updated successfully",
    });
  };

  // Add manual budget usage refresh
  const handleRefreshBudgetUsage = async () => {
    try {
      await api.post('/budgets/update-all-usage');
      await fetchBudgets(); // Fix: Changed from loadBudgets to fetchBudgets
      
      toast({
        title: "Success",
        description: "Budget usage updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update budget usage",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="w-48 h-8 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <div className="w-32 h-4 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-muted rounded" />
                    <div className="w-24 h-4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">
            Track and manage your spending limits by category
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshBudgetUsage}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Usage
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_budgets}</div>
              <p className="text-xs text-muted-foreground">
                {summary.active_budgets} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_budget_amount)}</div>
              <p className="text-xs text-muted-foreground">
                Budgeted this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.total_spent_amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.overall_usage_percentage.toFixed(1)}% of budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exceeded Budgets</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.exceeded_budgets}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
        >
          All Budgets
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('active')}
        >
          Active
        </Button>
        <Button
          variant={filterStatus === 'exceeded' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('exceeded')}
        >
          Exceeded
        </Button>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first budget to start tracking your spending
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <Card key={budget.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{budget.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditBudget(budget)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{budget.category_name}</span>
                  <span className={getStatusColor(budget.status)}>
                    • {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{budget.usage_percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(budget.usage_percentage ?? 0, 100)} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="font-medium">{formatCurrency(budget.spent_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{formatCurrency(budget.limit_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className={`font-medium ${budget.remaining_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(budget.remaining_amount)}
                      </span>
                    </div>
                  </div>

                  {budget.days_remaining !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {budget.days_remaining > 0 
                          ? `${budget.days_remaining} days remaining`
                          : 'Period ended'
                        }
                      </span>
                    </div>
                  )}

                  {budget.usage_percentage >= 90 && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 rounded text-xs">
                      <AlertCircle className="w-3 h-3 text-red-600 mt-0.5" />
                      <span className="text-red-700">
                        {budget.usage_percentage >= 100 
                          ? 'Budget exceeded!' 
                          : 'Approaching budget limit'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <CreateBudgetForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleCreateBudgetSuccess}
      />

      {/* Edit Budget Modal */}
      <EditBudgetForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        budget={editingBudget}
        onSuccess={handleEditBudgetSuccess}
      />
    </div>
  );
}
