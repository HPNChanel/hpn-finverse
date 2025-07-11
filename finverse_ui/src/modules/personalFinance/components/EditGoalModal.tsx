import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, DollarSign, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

// Enhanced Goal interface based on API response
interface Goal {
  id: number;
  user_id: number;
  account_id?: number;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority: number;
  status: number;
  icon?: string;
  color?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

// Update request interface
interface UpdateGoalRequest {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  start_date?: string;
  target_date?: string;
  description?: string;
  priority?: number;
  status?: number;
  icon?: string;
  color?: string;
  account_id?: number;
}

interface UpdateGoalResponse {
  success: boolean;
  message: string;
  data: Goal;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  type: string;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSuccess?: () => void; // Callback for successful update
}

// Priority options (same as CreateGoalModal)
const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low', color: 'text-gray-600' },
  { value: 2, label: 'Medium', color: 'text-blue-600' },
  { value: 3, label: 'High', color: 'text-red-600' },
];

// Status options
const STATUS_OPTIONS = [
  { value: 1, label: 'Ongoing', color: 'text-yellow-600' },
  { value: 2, label: 'Completed', color: 'text-green-600' },
  { value: 3, label: 'Cancelled', color: 'text-gray-600' },
];

// Goal icons (same as CreateGoalModal)
const GOAL_ICONS = [
  '🎯', '🏠', '🚗', '🌴', '💍', '🎓', '💰', '✈️', '🎮', '📱', '💻', '📚'
];

// Goal colors (same as CreateGoalModal)
const GOAL_COLORS = [
  '#1976d2', '#2e7d32', '#f57c00', '#7b1fa2', '#c62828', '#00695c',
  '#5d4037', '#455a64', '#e65100', '#ad1457', '#1565c0', '#388e3c'
];

export function EditGoalModal({ isOpen, onClose, goal, onSuccess }: EditGoalModalProps) {
  const { toast } = useToast();
  
  // Form state - will be populated from goal prop
  const [formData, setFormData] = useState<UpdateGoalRequest>({});

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get today's date for minimum date validation
  const today = new Date().toISOString().split('T')[0];

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Populate form data when goal prop changes
  useEffect(() => {
    if (goal && isOpen) {
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        start_date: goal.start_date,
        target_date: goal.target_date,
        description: goal.description || '',
        priority: goal.priority,
        status: goal.status,
        icon: goal.icon || '🎯',
        color: goal.color || '#1976d2',
        account_id: goal.account_id,
      });
      setErrors({});
    }
  }, [goal, isOpen]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await api.get('/categories/');
      const data = response.data;
      
      if (data && data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        console.warn('Categories API returned unexpected format:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Goal name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Goal name must be less than 255 characters';
    }

    if (!formData.target_amount || formData.target_amount <= 0) {
      newErrors.target_amount = 'Target amount must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.target_date) {
      newErrors.target_date = 'Target date is required';
    }

    // Date validation
    if (formData.start_date && formData.target_date) {
      if (new Date(formData.target_date) <= new Date(formData.start_date)) {
        newErrors.target_date = 'Target date must be after start date';
      }
    }

    // Amount validation
    if (formData.current_amount && formData.target_amount) {
      if (formData.current_amount > formData.target_amount) {
        newErrors.current_amount = 'Current amount cannot exceed target amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goal || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the payload - only include changed fields
      const payload: UpdateGoalRequest = {
        name: formData.name?.trim(),
        target_amount: Number(formData.target_amount),
        current_amount: Number(formData.current_amount) || 0,
        start_date: formData.start_date,
        target_date: formData.target_date,
        description: formData.description?.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        icon: formData.icon,
        color: formData.color,
        account_id: formData.account_id || undefined,
      };

      console.log('Updating goal with payload:', payload);

      const response = await api.put<UpdateGoalResponse>(`/goals/${goal.id}`, payload);
      
      console.log('Goal update response:', response.data);

      // Check if response indicates success
      if (response.data && response.data.success) {
        toast({
          title: "Success! ✏️",
          description: `Goal "${formData.name}" updated successfully.`,
        });

        // Call success callback to refresh the goals list
        if (onSuccess) {
          onSuccess();
        }

        onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to update goal');
      }

    } catch (error: any) {
      console.error('Error updating goal:', error);
      
      let errorMessage = 'Failed to update goal. Please try again.';
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.map((err: any) => err.detail).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UpdateGoalRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Don't render if no goal is provided
  if (!goal) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-blue-600" />
            Edit Goal: {goal.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Name */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Goal Name *
            </Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Buy a car, Save for vacation, Emergency fund"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isSubmitting}
              maxLength={255}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Target Amount *
              </Label>
              <Input
                id="target_amount"
                type="number"
                value={formData.target_amount || ''}
                onChange={(e) => handleInputChange('target_amount', parseFloat(e.target.value) || 0)}
                placeholder="10000"
                min="0.01"
                step="0.01"
                className={errors.target_amount ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.target_amount && <p className="text-sm text-red-500 mt-1">{errors.target_amount}</p>}
            </div>

            <div>
              <Label htmlFor="current_amount">Current Amount</Label>
              <Input
                id="current_amount"
                type="number"
                value={formData.current_amount || ''}
                onChange={(e) => handleInputChange('current_amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
                className={errors.current_amount ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.current_amount && <p className="text-sm text-red-500 mt-1">{errors.current_amount}</p>}
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date *
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={errors.start_date ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>}
            </div>

            <div>
              <Label htmlFor="target_date">Target Date *</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date || ''}
                onChange={(e) => handleInputChange('target_date', e.target.value)}
                min={formData.start_date || today}
                className={errors.target_date ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.target_date && <p className="text-sm text-red-500 mt-1">{errors.target_date}</p>}
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select 
                value={formData.priority?.toString() || '2'} 
                onValueChange={(value) => handleInputChange('priority', parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS
                    .filter(option => option && option.value && option.label)
                    .map((option, index) => (
                      <SelectItem key={`priority-${option.value}-${index}`} value={option.value.toString()}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status?.toString() || '1'} 
                onValueChange={(value) => handleInputChange('status', parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS
                    .filter(option => option && option.value && option.label)
                    .map((option, index) => (
                      <SelectItem key={`status-${option.value}-${index}`} value={option.value.toString()}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Icon and Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Goal Icon</Label>
              <Select 
                value={formData.icon || '🎯'} 
                onValueChange={(value) => handleInputChange('icon', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an icon" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_ICONS
                    .filter(icon => icon && icon.trim())
                    .map((icon, index) => (
                      <SelectItem key={`icon-${index}-${icon}`} value={icon}>
                        <span className="text-lg">{icon}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Goal Color</Label>
              <Select 
                value={formData.color || '#1976d2'} 
                onValueChange={(value) => handleInputChange('color', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a color" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_COLORS
                    .filter(color => color && color.trim() && color.startsWith('#'))
                    .map((color, index) => (
                      <SelectItem key={`color-${index}-${color}`} value={color}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: color }}
                          />
                          <span>{color}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categories (Optional) */}
          {categories.length > 0 && (
            <div>
              <Label>Category (Optional)</Label>
              <Select 
                value={formData.account_id?.toString() || '0'} 
                onValueChange={(value) => handleInputChange('account_id', value && value !== '0' ? parseInt(value) : undefined)}
                disabled={isSubmitting || loadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="no-category" value="0">No category</SelectItem>
                  {categories
                    .filter(category => category && category.id && category.name && category.name.trim())
                    .map((category, index) => (
                      <SelectItem key={`category-${category.id}-${index}`} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          {category.icon && <span>{category.icon}</span>}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add notes about your goal, savings strategy, or motivation..."
              rows={3}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.description || '').length}/1000 characters
            </p>
          </div>

          {/* Progress Preview */}
          {formData.target_amount && formData.target_amount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Goal Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>
                    {formatCurrency(formData.current_amount || 0)} / {formatCurrency(formData.target_amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((formData.current_amount || 0) / formData.target_amount) * 100)}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  {((formData.current_amount || 0) / formData.target_amount * 100).toFixed(1)}% complete
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 