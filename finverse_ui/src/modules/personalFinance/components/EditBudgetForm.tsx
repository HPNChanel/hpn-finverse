import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { budgetService, Budget, CreateBudgetRequest } from '@/services/budgetService';
import { categoryService, Category } from '@/services/categoryService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditBudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  onSuccess?: () => void;
}

export function EditBudgetForm({ open, onOpenChange, budget, onSuccess }: EditBudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateBudgetRequest>({
    name: '',
    category_id: 0,
    limit_amount: 0,
    period_type: 'monthly',
    start_date: '',
    end_date: '',
    description: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCategories();
      
      // Populate form with budget data
      if (budget) {
        setFormData({
          name: budget.name,
          category_id: budget.category_id,
          limit_amount: budget.limit_amount,
          period_type: budget.period_type,
          start_date: budget.start_date,
          end_date: budget.end_date || '',
          description: budget.description || ''
        });
      }
    }
  }, [open, budget]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await categoryService.getCategories();
      const expenseCategories = categoryService.filterByType(response, 'expense');
      setCategories(expenseCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budget) {
      toast({
        title: "Error",
        description: "No budget selected for editing",
        variant: "destructive",
      });
      return;
    }

    // Enhanced validation with better error messages
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Budget name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category_id || formData.category_id === 0) { // Fix: Added explicit check for 0
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (formData.limit_amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Budget amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Ensure category_id is properly formatted
      const updateData = {
        ...formData,
        category_id: parseInt(formData.category_id.toString()),
      };
      
      console.log('Updating budget with data:', updateData); // Debug log
      
      await budgetService.updateBudget(budget.id, updateData);
      
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to update budget:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to update budget",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBudgetRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Groceries, Entertainment"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id > 0 ? formData.category_id.toString() : ""}
              onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
              disabled={loading || categoriesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  categoriesLoading ? "Loading categories..." : 
                  categories.length === 0 ? "No categories available" :
                  "Select a category"
                } />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {categoryService.getCategoryIcon(category)} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.limit_amount}
              onChange={(e) => handleInputChange('limit_amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Select
              value={formData.period_type}
              onValueChange={(value) => handleInputChange('period_type', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add notes about this budget..."
              disabled={loading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Budget'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
