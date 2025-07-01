import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { budgetService, CreateBudgetRequest } from '@/services/budgetService';
import { categoryService, Category } from '@/services/categoryService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateBudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateBudgetForm({ open, onOpenChange, onSuccess }: CreateBudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateBudgetRequest>({
    name: '',
    category_id: 0,
    limit_amount: 0,
    period_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCategories();
      // Set default end date to end of current month
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFormData(prev => ({
        ...prev,
        end_date: endOfMonth.toISOString().split('T')[0]
      }));
    }
  }, [open]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await categoryService.getCategories();
      // Filter for expense categories since budgets are typically for expenses
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
      console.log('Submitting budget data:', formData); // Debug log
      
      await budgetService.createBudget(formData);
      
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
      
      // Reset form
      setFormData({
        name: '',
        category_id: 0,
        limit_amount: 0,
        period_type: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        description: ''
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create budget:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create budget",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
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
              onValueChange={(value) => {
                const categoryId = parseInt(value);
                handleInputChange('category_id', categoryId);
                console.log('Category selected:', categoryId); // Debug log
              }}
              disabled={loading || categoriesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {categoryService.getCategoryIcon(category)} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && !categoriesLoading && (
              <p className="text-sm text-muted-foreground">
                No expense categories found. Create some categories first.
              </p>
            )}
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Budget'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
