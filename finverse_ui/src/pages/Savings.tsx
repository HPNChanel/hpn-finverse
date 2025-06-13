import React, { useState } from 'react';
import { Plus, Calculator, TrendingUp, Wallet, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CreateSavingsPlanModal } from '@/components/savings/CreateSavingsPlanModal';
import { SavingsPlanChart } from '@/components/savings/SavingsPlanChart';
import { SavingsCalculatorModal } from '@/components/savings/SavingsCalculatorModal';
import { EditSavingsPlanModal } from '@/components/savings/EditSavingsPlanModal';
import {
  useSavingsPlans,
  useSavingsSummary,
  useDeleteSavingsPlan,
  useSavingsPlanDetail
} from '@/hooks/useSavings';
import { SavingsPlan, SavingsPlanDetail } from '@/services/savingsApi';

interface SavingsProjection {
  id: number;
  plan_id: number;
  month_index: number;
  balance: number;
  interest_earned: number;
}

interface SavingsSummary {
  total_plans: number;
  total_saved: number;
  total_projected_value: number;
  total_projected_interest: number;
}

export function Savings() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<SavingsPlanDetail | null>(null);
  
  const { toast } = useToast();

  // Use the new React Query hooks
  const { data: savingsPlans = [], isLoading: plansLoading, error: plansError } = useSavingsPlans();
  const { data: savingsSummary, error: summaryError } = useSavingsSummary();
  const { data: planDetail, isLoading: planDetailLoading } = useSavingsPlanDetail(
    selectedPlan?.id || 0
  );
  
  const deleteMutation = useDeleteSavingsPlan();

  // Handle errors from queries
  React.useEffect(() => {
    if (plansError) {
      console.error('Savings plans error:', plansError);
    }
    if (summaryError) {
      console.error('Savings summary error:', summaryError);
    }
  }, [plansError, summaryError]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    // Toast is handled by the hook
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPlan(null);
    setSelectedPlanDetail(null);
    // Toast is handled by the hook
  };

  const handleEditPlan = (plan: SavingsPlan) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  // Update plan detail when data is loaded
  React.useEffect(() => {
    if (planDetail && selectedPlan) {
      setSelectedPlanDetail(planDetail);
    }
  }, [planDetail, selectedPlan]);

  const handleDeletePlan = async (planId: number) => {
    if (confirm('Are you sure you want to delete this savings plan?')) {
      deleteMutation.mutate(planId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  const getProgressPercentage = (plan: SavingsPlan) => {
    // Calculate how many months have passed since creation
    const createdDate = new Date(plan.created_at);
    const now = new Date();
    const monthsPassed = Math.max(0, 
      (now.getFullYear() - createdDate.getFullYear()) * 12 + 
      (now.getMonth() - createdDate.getMonth())
    );
    return Math.min(100, (monthsPassed / plan.duration_months) * 100);
  };

  if (plansLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Savings</h1>
          <p className="text-gray-600 mt-1">Plan and track your savings goals</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Calculator
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {savingsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingsSummary.total_plans}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savingsSummary.total_saved)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savingsSummary.total_projected_value)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Interest</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savingsSummary.total_projected_interest)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Savings Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Savings Plans</h2>
        
        {savingsPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No savings plans yet</h3>
              <p className="text-gray-600 mb-6 text-center max-w-sm">
                Create your first savings plan to start tracking your financial goals and projections.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(savingsPlans as SavingsPlan[]).map((plan) => {
              const progress = getProgressPercentage(plan);
              const isCompound = plan.interest_type === 'compound';
              
              return (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant={isCompound ? "default" : "secondary"}>
                        {isCompound ? "Compound" : "Simple"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {formatPercentage(plan.interest_rate)} annual interest
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Initial Amount:</span>
                        <span className="font-medium">{formatCurrency(plan.initial_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Monthly Contribution:</span>
                        <span className="font-medium">{formatCurrency(plan.monthly_contribution)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Progress:</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm text-gray-600">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {plan.duration_months} months
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                          disabled={planDetailLoading && selectedPlan?.id === plan.id}
                        >
                          {planDetailLoading && selectedPlan?.id === plan.id ? 'Loading...' : 'Edit'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={deleteMutation.isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateSavingsPlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <SavingsCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
      />

      {selectedPlan && selectedPlanDetail && (
        <EditSavingsPlanModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPlan(null);
            setSelectedPlanDetail(null);
          }}
          plan={selectedPlan}
          planDetail={selectedPlanDetail}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
} 