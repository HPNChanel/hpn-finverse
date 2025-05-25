import React, { useEffect } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  FormHelperText,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FinancialGoal } from '../../types'; // Fix import path
import { useCurrency } from '../../contexts/CurrencyContext'; // Fix import path

// Zod schema for validating financial goal form
const goalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z.number().min(0, 'Current amount cannot be negative').optional().default(0),
  start_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Start date must be a valid date'
  }),
  target_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Target date must be a valid date'
  }),
  description: z.string().optional(),
  priority: z.number().min(1).max(3).default(2),
  status: z.number().min(1).max(3).default(1),
  icon: z.string().optional().default('🎯'),
  color: z.string().optional().default('#1976d2')
}).refine(data => new Date(data.target_date) > new Date(data.start_date), {
  message: 'Target date must be after start date',
  path: ['target_date']
}).refine(data => (data.current_amount || 0) <= data.target_amount, {
  message: 'Current amount cannot exceed target amount',
  path: ['current_amount']
});

// Type for the form data
type GoalFormData = z.infer<typeof goalSchema>;

// Props for the component
interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  goal?: FinancialGoal;
  isLoading?: boolean;
}

// Helper to format date for input field
const formatDateForInput = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const GoalForm: React.FC<GoalFormProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  goal,
  isLoading = false 
}) => {
  const { formatCurrency } = useCurrency();
  
  // Default values for the form - ensure all fields have proper defaults
  const getDefaultValues = (): GoalFormData => ({
    name: goal?.name || '',
    target_amount: goal?.target_amount || 1000,
    current_amount: goal?.current_amount || 0,
    start_date: goal ? formatDateForInput(goal.start_date) : formatDateForInput(new Date().toISOString()),
    target_date: goal ? formatDateForInput(goal.target_date) : '',
    description: goal?.description || '',
    priority: goal?.priority || 2,
    status: goal?.status || 1,
    icon: goal?.icon || '🎯',
    color: goal?.color || '#1976d2'
  });

  // React Hook Form setup with Zod resolver
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange'
  });

  // Watch target_amount to update current_amount max validation
  const targetAmount = watch('target_amount');
  const currentAmount = watch('current_amount');
  
  // Handle the form submission with detailed logging and validation
  const onFormSubmit = async (data: GoalFormData) => {
    try {
      console.log('GoalForm: Submitting form with data:', data);
      
      // Additional frontend validation
      const startDate = new Date(data.start_date);
      const targetDate = new Date(data.target_date);
      
      if (targetDate <= startDate) {
        throw new Error('Target date must be after start date');
      }
      
      if ((data.current_amount || 0) > data.target_amount) {
        throw new Error('Current amount cannot exceed target amount');
      }
      
      // Format data for API - ensure proper types
      const formattedData = {
        name: data.name.trim(),
        target_amount: Number(data.target_amount),
        current_amount: Number(data.current_amount || 0),
        start_date: data.start_date,
        target_date: data.target_date,
        description: data.description?.trim() || undefined,
        priority: Number(data.priority),
        status: Number(data.status),
        icon: data.icon || '🎯',
        color: data.color || '#1976d2'
      };
      
      console.log('GoalForm: Formatted data for API:', formattedData);
      
      await onSubmit(formattedData);
    } catch (error) {
      console.error('GoalForm: Error submitting form:', error);
      throw error;
    }
  };

  // Reset form when dialog opens or goal changes
  useEffect(() => {
    if (open) {
      const defaults = getDefaultValues();
      console.log('GoalForm: Resetting form with defaults:', defaults);
      reset(defaults);
    }
  }, [open, goal, reset]);

  // Auto-adjust current_amount if it exceeds target_amount
  useEffect(() => {
    if (currentAmount > targetAmount) {
      setValue('current_amount', targetAmount);
    }
  }, [targetAmount, currentAmount, setValue]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: '12px' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {goal ? 'Edit Financial Goal' : 'Create New Financial Goal'}
        <IconButton edge="end" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" noValidate sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Goal Name */}
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Goal Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required
                    disabled={isLoading}
                    placeholder="Enter your goal name"
                  />
                )}
              />
            </Grid>
            
            {/* Target Amount */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="target_amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Target Amount"
                    type="number"
                    fullWidth
                    error={!!errors.target_amount}
                    helperText={errors.target_amount?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                    required
                    disabled={isLoading}
                    inputProps={{ min: 1, step: 0.01 }}
                  />
                )}
              />
            </Grid>
            
            {/* Current Amount */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="current_amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Current Amount"
                    type="number"
                    fullWidth
                    error={!!errors.current_amount}
                    helperText={errors.current_amount?.message || `Max: ${formatCurrency(targetAmount)}`}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      field.onChange(Math.min(value, targetAmount)); // Auto-cap at target amount
                    }}
                    disabled={isLoading}
                    inputProps={{ min: 0, max: targetAmount, step: 0.01 }}
                  />
                )}
              />
            </Grid>
            
            {/* Start Date */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start Date"
                    type="date"
                    fullWidth
                    error={!!errors.start_date}
                    helperText={errors.start_date?.message}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>
            
            {/* Target Date */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="target_date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Target Date"
                    type="date"
                    fullWidth
                    error={!!errors.target_date}
                    helperText={errors.target_date?.message}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>
            
            {/* Priority */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.priority} disabled={isLoading}>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      {...field}
                      labelId="priority-label"
                      label="Priority"
                      value={field.value || 2}
                    >
                      <MenuItem value={1}>Low</MenuItem>
                      <MenuItem value={2}>Medium</MenuItem>
                      <MenuItem value={3}>High</MenuItem>
                    </Select>
                    {errors.priority && (
                      <FormHelperText>{errors.priority.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            {/* Status */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status} disabled={isLoading}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      {...field}
                      labelId="status-label"
                      label="Status"
                      value={field.value || 1}
                    >
                      <MenuItem value={1}>Ongoing</MenuItem>
                      <MenuItem value={2}>Completed</MenuItem>
                      <MenuItem value={3}>Cancelled</MenuItem>
                    </Select>
                    {errors.status && (
                      <FormHelperText>{errors.status.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={isLoading}
                    placeholder="Enter a description for your goal"
                    value={field.value || ''}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit(onFormSubmit)} 
          variant="contained" 
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Saving...' : (goal ? 'Update Goal' : 'Create Goal')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalForm;