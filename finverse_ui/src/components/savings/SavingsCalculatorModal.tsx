import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X, DollarSign, Percent, Calendar, Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { savingsApi, SavingsCalculationRequest } from '@/services/savingsApi';
import { SavingsPlanChart } from './SavingsPlanChart';

interface SavingsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavingsCalculatorModal({ isOpen, onClose }: SavingsCalculatorModalProps) {
  const [formData, setFormData] = useState<SavingsCalculationRequest>({
    initial_amount: 1000,
    monthly_contribution: 500,
    interest_rate: 5,
    duration_months: 24,
    interest_type: 'compound',
  });
  
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const { toast } = useToast();

  const calculateMutation = useMutation(savingsApi.calculateSavings, {
    onSuccess: (data) => {
      setCalculationResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate savings',
        variant: 'destructive',
      });
    },
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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

    calculateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof SavingsCalculationRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear previous results when inputs change
    setCalculationResult(null);
  };

  const handleClose = () => {
    setCalculationResult(null);
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Savings Calculator
              </h2>
              <p className="text-gray-600 mt-1">Calculate how your savings will grow over time</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div>
              <form onSubmit={handleCalculate} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Calculation Parameters</CardTitle>
                    <CardDescription>
                      Enter your savings details to see projections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Initial Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="calc_initial_amount">Initial Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="calc_initial_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.initial_amount}
                          onChange={(e) => handleInputChange('initial_amount', parseFloat(e.target.value) || 0)}
                          placeholder="1000.00"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Monthly Contribution */}
                    <div className="space-y-2">
                      <Label htmlFor="calc_monthly_contribution">Monthly Contribution</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="calc_monthly_contribution"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={formData.monthly_contribution}
                          onChange={(e) => handleInputChange('monthly_contribution', parseFloat(e.target.value) || 0)}
                          placeholder="500.00"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-2">
                      <Label htmlFor="calc_interest_rate">Annual Interest Rate (%)</Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="calc_interest_rate"
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
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="calc_duration_months">Duration (Months)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="calc_duration_months"
                          type="number"
                          min="1"
                          max="600"
                          value={formData.duration_months}
                          onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value) || 1)}
                          placeholder="24"
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
                      <Label htmlFor="calc_interest_type">Interest Type</Label>
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
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  disabled={calculateMutation.isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {calculateMutation.isLoading ? 'Calculating...' : 'Calculate Savings'}
                </Button>
              </form>
            </div>

            {/* Results */}
            <div>
              {calculationResult ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Final Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculationResult.final_value)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(calculationResult.total_interest)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(calculationResult.total_contributions)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Interest Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formData.interest_rate.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Growth Projection
                      </CardTitle>
                      <CardDescription>
                        See how your savings will grow month by month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SavingsPlanChart projections={calculationResult.monthly_projections} />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calculator className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Calculate</h3>
                    <p className="text-gray-600 text-center">
                      Fill in the form and click "Calculate Savings" to see your projections
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 