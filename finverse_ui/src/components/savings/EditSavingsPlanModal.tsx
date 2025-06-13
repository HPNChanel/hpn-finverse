import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { X, DollarSign, Percent, Calendar, Calculator, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { savingsApi, UpdateSavingsPlanRequest, SavingsPlan, SavingsPlanDetail } from '@/services/savingsApi';
import { SavingsPlanChart } from './SavingsPlanChart';

interface EditSavingsPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: SavingsPlan;
  planDetail: SavingsPlanDetail;
}

export function EditSavingsPlanModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  plan, 
  planDetail 
}: EditSavingsPlanModalProps) {
  const [formData, setFormData] = useState<UpdateSavingsPlanRequest>({});
  const { toast } = useToast();

  // Initialize form data when plan changes
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        initial_amount: plan.initial_amount,
        monthly_contribution: plan.monthly_contribution,
        interest_rate: plan.interest_rate,
        duration_months: plan.duration_months,
        interest_type: plan.interest_type,
      });
    }
  }, [plan]);

  const updateMutation = useMutation(
    (data: UpdateSavingsPlanRequest) => savingsApi.updateSavingsPlan(plan.id, data),
    {
      onSuccess: () => {
        onSuccess();
        handleClose();
        toast({
          title: 'Success',
          description: 'Savings plan updated successfully!',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update savings plan',
          variant: 'destructive',
        });
      },
    }
  );

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.name && !formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a plan name',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.monthly_contribution !== undefined && formData.monthly_contribution <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Monthly contribution must be greater than $0',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.interest_rate !== undefined && (formData.interest_rate <= 0 || formData.interest_rate > 100)) {
      toast({
        title: 'Validation Error',
        description: 'Interest rate must be between 0.01% and 100%',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.duration_months !== undefined && (formData.duration_months <= 0 || formData.duration_months > 600)) {
      toast({
        title: 'Validation Error',
        description: 'Duration must be between 1 and 600 months',
        variant: 'destructive',
      });
      return;
    }

    // Only send changed fields
    const changedFields = Object.entries(formData).reduce((acc, [key, value]) => {
      const originalValue = plan[key as keyof SavingsPlan];
      if (value !== originalValue && value !== undefined) {
        acc[key as keyof UpdateSavingsPlanRequest] = value;
      }
      return acc;
    }, {} as UpdateSavingsPlanRequest);

    if (Object.keys(changedFields).length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes detected to save.',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate(changedFields);
  };

  const handleInputChange = (field: keyof UpdateSavingsPlanRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatYears = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  const getProgressPercentage = () => {
    const createdDate = new Date(plan.created_at);
    const now = new Date();
    const monthsPassed = Math.max(0, 
      (now.getFullYear() - createdDate.getFullYear()) * 12 + 
      (now.getMonth() - createdDate.getMonth())
    );
    return Math.min(100, (monthsPassed / plan.duration_months) * 100);
  };

  if (!isOpen || !plan || !planDetail) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Savings Plan</h2>
              <p className="text-gray-600 mt-1">Update your savings plan details and view projections</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Edit Plan
              </TabsTrigger>
              <TabsTrigger value="projections" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                View Projections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Form Fields */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Plan Details</CardTitle>
                        <CardDescription>
                          Update your savings plan information
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Plan Name */}
                        <div className="space-y-2">
                          <Label htmlFor="edit_name">Plan Name</Label>
                          <Input
                            id="edit_name"
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., Emergency Fund, Vacation, New Car"
                            className="w-full"
                          />
                        </div>

                        {/* Initial Amount */}
                        <div className="space-y-2">
                          <Label htmlFor="edit_initial_amount">Initial Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="edit_initial_amount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.initial_amount || ''}
                              onChange={(e) => handleInputChange('initial_amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Monthly Contribution */}
                        <div className="space-y-2">
                          <Label htmlFor="edit_monthly_contribution">Monthly Contribution</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="edit_monthly_contribution"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={formData.monthly_contribution || ''}
                              onChange={(e) => handleInputChange('monthly_contribution', parseFloat(e.target.value) || 0)}
                              placeholder="100.00"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Interest Rate */}
                        <div className="space-y-2">
                          <Label htmlFor="edit_interest_rate">Annual Interest Rate (%)</Label>
                          <div className="relative">
                            <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="edit_interest_rate"
                              type="number"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={formData.interest_rate || ''}
                              onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
                              placeholder="5.00"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                          <Label htmlFor="edit_duration_months">Duration (Months)</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="edit_duration_months"
                              type="number"
                              min="1"
                              max="600"
                              value={formData.duration_months || ''}
                              onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value) || 1)}
                              placeholder="12"
                              className="pl-10"
                            />
                          </div>
                          {formData.duration_months && (
                            <p className="text-sm text-gray-600">
                              Duration: {formatYears(formData.duration_months)}
                            </p>
                          )}
                        </div>

                        {/* Interest Type */}
                        <div className="space-y-2">
                          <Label htmlFor="edit_interest_type">Interest Type</Label>
                          <Select
                            value={formData.interest_type || plan.interest_type}
                            onValueChange={(value) => handleInputChange('interest_type', value as 'simple' | 'compound')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select interest type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compound">
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">Compound Interest</span>
                                  <span className="text-sm text-gray-600">Interest on interest (recommended)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="simple">
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">Simple Interest</span>
                                  <span className="text-sm text-gray-600">Interest on principal only</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Current Status */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Current Status</CardTitle>
                        <CardDescription>
                          Overview of your current plan performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Final Value</p>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(planDetail.final_value)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Interest</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {formatCurrency(planDetail.total_interest)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Progress</p>
                            <p className="text-lg font-semibold">
                              {getProgressPercentage().toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Interest Type</p>
                            <p className="text-lg font-semibold capitalize">
                              {plan.interest_type}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Preview</CardTitle>
                        <CardDescription>
                          Growth over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SavingsPlanChart 
                          projections={planDetail.projections} 
                          height={200}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {updateMutation.isLoading ? 'Updating...' : 'Update Plan'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="projections" className="space-y-6">
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Final Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(planDetail.final_value)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(planDetail.total_interest)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(plan.initial_amount + (plan.monthly_contribution * plan.duration_months))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {getProgressPercentage().toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detailed Projections</CardTitle>
                    <CardDescription>
                      Complete breakdown of savings growth with contributions and interest
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SavingsPlanChart 
                      projections={planDetail.projections} 
                      height={400}
                      showInterest={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 