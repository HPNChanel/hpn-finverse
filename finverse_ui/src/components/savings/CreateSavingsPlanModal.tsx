import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X, DollarSign, Percent, Calendar, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { savingsApi, CreateSavingsPlanRequest } from '@/services/savingsApi';
// import { SavingsCalculatorPreview } from './SavingsCalculatorPreview';

interface CreateSavingsPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSavingsPlanModal({ isOpen, onClose, onSuccess }: CreateSavingsPlanModalProps) {
  const [formData, setFormData] = useState<CreateSavingsPlanRequest>({
    name: '',
    initial_amount: 0,
    monthly_contribution: 0,
    interest_rate: 5,
    duration_months: 12,
    interest_type: 'compound',
  });
  
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const createMutation = useMutation(savingsApi.createSavingsPlan, {
    onSuccess: () => {
      onSuccess();
      handleClose();
      toast({
        title: 'Success',
        description: 'Savings plan created successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create savings plan',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setFormData({
      name: '',
      initial_amount: 0,
      monthly_contribution: 0,
      interest_rate: 5,
      duration_months: 12,
      interest_type: 'compound',
    });
    setShowPreview(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a plan name',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.monthly_contribution <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Monthly contribution must be greater than $0',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.interest_rate <= 0 || formData.interest_rate > 100) {
      toast({
        title: 'Validation Error',
        description: 'Interest rate must be between 0.01% and 100%',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.duration_months <= 0 || formData.duration_months > 600) {
      toast({
        title: 'Validation Error',
        description: 'Duration must be between 1 and 600 months',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateSavingsPlanRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Savings Plan</h2>
              <p className="text-gray-600 mt-1">Set up a new savings plan to reach your financial goals</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Emergency Fund, Vacation, New Car"
                className="w-full"
                required
              />
            </div>

            {/* Initial Amount */}
            <div className="space-y-2">
              <Label htmlFor="initial_amount">Initial Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="initial_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.initial_amount}
                  onChange={(e) => handleInputChange('initial_amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-600">Starting amount you have to put in</p>
            </div>

            {/* Monthly Contribution */}
            <div className="space-y-2">
              <Label htmlFor="monthly_contribution">Monthly Contribution *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="monthly_contribution"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.monthly_contribution}
                  onChange={(e) => handleInputChange('monthly_contribution', parseFloat(e.target.value) || 0)}
                  placeholder="100.00"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-600">Amount you'll save each month</p>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Annual Interest Rate *</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="interest_rate"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
                  placeholder="5.00"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-600">Expected annual interest rate (e.g., 5.0 for 5%)</p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration_months">Duration (Months) *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="duration_months"
                  type="number"
                  min="1"
                  max="600"
                  value={formData.duration_months}
                  onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value) || 1)}
                  placeholder="12"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-600">
                Duration: {formatYears(formData.duration_months)}
              </p>
            </div>

            {/* Interest Type */}
            <div className="space-y-2">
              <Label htmlFor="interest_type">Interest Type</Label>
              <Select
                value={formData.interest_type}
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

            {/* Preview Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>

            {/* Preview */}
            {showPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Savings Projection Preview</CardTitle>
                  <CardDescription>
                    See how your savings will grow over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-gray-600">
                    Preview calculation will be available once all components are created.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
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
                disabled={createMutation.isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isLoading ? 'Creating...' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 