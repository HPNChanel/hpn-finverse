import React from 'react';
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
import type { FinancialGoal } from '../../utils/importFixes';

// Zod schema for validating financial goal form
const goalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z.number().min(0, 'Current amount cannot be negative')
    .refine(val => val !== undefined, { message: 'Current amount is required' }),
  start_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Start date must be a valid date'
  }),
  target_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Target date must be a valid date'
  }),
  description: z.string().optional(),
  priority: z.number().min(1).max(3),
  status: z.number().min(1).max(3),
  icon: z.string().optional(),
  color: z.string().optional().refine(val => !val || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val), {
    message: 'Color must be a valid hex color'
  })
}).refine(data => new Date(data.target_date) >= new Date(data.start_date), {
  message: 'Target date must be after start date',
  path: ['target_date']
}).refine(data => data.current_amount <= data.target_amount, {
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
    // If using date-fns, you can use this:
    // return format(new Date(dateString), 'yyyy-MM-dd');
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
  // Default values for the form
  const defaultValues: Partial<GoalFormData> = {
    name: goal?.name || '',
    target_amount: goal?.target_amount || 0,
    current_amount: goal?.current_amount || 0,
    start_date: goal ? formatDateForInput(goal.start_date) : formatDateForInput(new Date().toISOString()),
    target_date: goal ? formatDateForInput(goal.target_date) : '',
    description: goal?.description || '',
    priority: goal?.priority || 2,
    status: goal?.status || 1,
    icon: goal?.icon || '',
    color: goal?.color || '#1976d2'
  };

  // React Hook Form setup with Zod resolver
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid },
    reset
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Handle the form submission
  const onFormSubmit = async (data: GoalFormData) => {
    await onSubmit(data);
  };

  // Reset form on open and when goal changes
  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
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
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    required
                    disabled={isLoading}
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
                    helperText={errors.current_amount?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    required
                    disabled={isLoading}
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
            
            {/* Color */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Color"
                    type="color"
                    fullWidth
                    error={!!errors.color}
                    helperText={errors.color?.message || 'Choose a color for your goal'}
                    InputLabelProps={{ shrink: true }}
                    disabled={isLoading}
                    sx={{ 
                      '& input[type="color"]': {
                        width: '100%',
                        height: '50px',
                        padding: '0 5px',
                        cursor: 'pointer'
                      } 
                    }}
                  />
                )}
              />
            </Grid>
            
            {/* Icon */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Icon (Optional)"
                    fullWidth
                    error={!!errors.icon}
                    helperText={errors.icon?.message || 'Icon name (e.g., "star", "home")'}
                    disabled={isLoading}
                  />
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
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit(onFormSubmit)} 
          variant="contained" 
          disabled={!isValid || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalForm; 