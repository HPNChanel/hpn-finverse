import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Percent, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SavingsPlanChart } from '@/components/savings/SavingsPlanChart';
import { EditSavingsPlanModal } from '@/components/savings/EditSavingsPlanModal';
import {
  useSavingsPlanDetail,
  useSavingsPlanProjections,
  useDeleteSavingsPlan
} from '@/hooks/useSavings';

export function SavingsDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = React.useState(false);

  const planIdNumber = planId ? parseInt(planId, 10) : 0;
  
  const { data: planDetail, isLoading: planLoading, error: planError } = useSavingsPlanDetail(planIdNumber);
  const { data: projections, isLoading: projectionsLoading } = useSavingsPlanProjections(planIdNumber);
  const deleteMutation = useDeleteSavingsPlan();

  const handleBack = () => {
    navigate('/savings');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    if (!planDetail) return;
    
    if (confirm(`Are you sure you want to delete "${planDetail.name}"? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(planIdNumber);
        toast({
          title: 'Success',
          description: 'Savings plan deleted successfully!',
        });
        navigate('/savings');
      } catch (error) {
        console.error('Failed to delete savings plan:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete savings plan. Please try again.',
          variant: 'destructive',
        });
      }
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

  if (planLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (planError || !planDetail) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Plan Not Found</h2>
          <p className="text-gray-600 mb-6">The savings plan you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Savings
          </Button>
        </div>
      </div>
    );
  }

  const isCompound = planDetail.interest_type === 'compound';

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{planDetail.name}</h1>
            <p className="text-gray-600 mt-1">Savings plan details and projections</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteMutation.isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Plan Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interest Type</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isCompound ? "default" : "secondary"}>
                {isCompound ? "Compound" : "Simple"}
              </Badge>
              <span className="text-sm text-gray-600">
                {formatPercentage(planDetail.interest_rate)} annual
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initial Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(planDetail.initial_amount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Contribution</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(planDetail.monthly_contribution)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planDetail.duration_months}</div>
            <p className="text-xs text-muted-foreground">months</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(planDetail.final_value)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(planDetail.total_interest)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(
                planDetail.initial_amount + 
                (planDetail.monthly_contribution * planDetail.duration_months)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Growth Projection</CardTitle>
          <CardDescription>
            See how your savings will grow over time with {isCompound ? 'compound' : 'simple'} interest
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectionsLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : projections && projections.length > 0 ? (
            <SavingsPlanChart projections={projections} />
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              No projection data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && planDetail && (
        <EditSavingsPlanModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          plan={{
            id: planDetail.id,
            source_account_id: planDetail.source_account_id,
            name: planDetail.name,
            initial_amount: planDetail.initial_amount,
            monthly_contribution: planDetail.monthly_contribution,
            interest_rate: planDetail.interest_rate,
            duration_months: planDetail.duration_months,
            interest_type: planDetail.interest_type,
            created_at: planDetail.created_at,
            updated_at: planDetail.updated_at,
          }}
          planDetail={planDetail}
        />
      )}
    </div>
  );
} 