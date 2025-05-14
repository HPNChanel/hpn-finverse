import React from 'react';
import { 
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { 
  FrequencyType, 
  FrequencyTypeLabels, 
  TransactionType,
  TransactionTypeLabels,
} from '../../services/recurringTransactionService';
import type { 
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate
} from '../../services/recurringTransactionService';

// Define validation schema with Zod
const formSchema = z.object({
  category_id: z.number().int().positive('Category is required'),
  wallet_id: z.number().int().positive('Account is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  transaction_type: z.number().int().min(0).max(1),
  description: z.string().optional(),
  frequency_type: z.number().int().min(1).max(4),
  frequency_value: z.number().int(),
  start_date: z.date(),
  end_date: z.date().optional().nullable(),
  is_active: z.boolean().default(true),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface RecurringTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecurringTransactionCreate | RecurringTransactionUpdate) => void;
  transaction?: RecurringTransaction;
  title?: string;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  title = 'Create Recurring Transaction'
}) => {
  // Initialize form with default values or existing transaction data
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction ? {
      category_id: transaction.category_id,
      wallet_id: transaction.wallet_id,
      amount: Number(transaction.amount),
      transaction_type: transaction.transaction_type,
      description: transaction.description || '',
      frequency_type: transaction.frequency_type,
      frequency_value: transaction.frequency_value,
      start_date: new Date(transaction.start_date),
      end_date: transaction.end_date ? new Date(transaction.end_date) : null,
      is_active: transaction.is_active,
    } : {
      category_id: 0,
      wallet_id: 0,
      amount: 0,
      transaction_type: TransactionType.EXPENSE,
      description: '',
      frequency_type: FrequencyType.MONTHLY,
      frequency_value: 1, // Default to 1st day of month
      start_date: new Date(),
      end_date: null,
      is_active: true,
    }
  });
  
  // Watch frequency type to conditionally render frequency value input
  const frequencyType = watch('frequency_type');
  
  // Get descriptions for frequency value based on frequency type
  const getFrequencyValueDescription = () => {
    switch (frequencyType) {
      case FrequencyType.DAILY:
        return 'Every day';
      case FrequencyType.WEEKLY:
        return 'Select day of week (0 = Monday, 6 = Sunday)';
      case FrequencyType.MONTHLY:
        return 'Select day of month (1-31)';
      case FrequencyType.YEARLY:
        return 'Select day of year (1-366)';
      default:
        return '';
    }
  };
  
  // Get min/max values for frequency value based on frequency type
  const getFrequencyValueLimits = () => {
    switch (frequencyType) {
      case FrequencyType.DAILY:
        return { min: 1, max: 1 };
      case FrequencyType.WEEKLY:
        return { min: 0, max: 6 };
      case FrequencyType.MONTHLY:
        return { min: 1, max: 31 };
      case FrequencyType.YEARLY:
        return { min: 1, max: 366 };
      default:
        return { min: 0, max: 0 };
    }
  };
  
  // Render weekday options for weekly frequency
  const renderWeekdayOptions = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day, index) => (
      <MenuItem key={index} value={index}>{day}</MenuItem>
    ));
  };
  
  // Handle form submission
  const handleFormSubmit = (data: FormSchemaType) => {
    onSubmit({
      ...data,
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : undefined,
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              {/* Transaction Type */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Transaction Type</Typography>
                <Controller
                  name="transaction_type"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      color="primary"
                      value={field.value}
                      exclusive
                      onChange={(_, value) => value !== null && field.onChange(value)}
                      fullWidth
                    >
                      <ToggleButton value={TransactionType.EXPENSE}>
                        {TransactionTypeLabels[TransactionType.EXPENSE]}
                      </ToggleButton>
                      <ToggleButton value={TransactionType.INCOME}>
                        {TransactionTypeLabels[TransactionType.INCOME]}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                />
              </Grid>
              
              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Amount"
                      fullWidth
                      type="number"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </Grid>
              
              {/* Description */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
              
              {/* Category */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.category_id}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        {...field}
                        label="Category"
                      >
                        {/* TODO: Replace with actual categories from API */}
                        <MenuItem value={1}>Food</MenuItem>
                        <MenuItem value={2}>Transport</MenuItem>
                        <MenuItem value={3}>Housing</MenuItem>
                        <MenuItem value={4}>Entertainment</MenuItem>
                        <MenuItem value={5}>Salary</MenuItem>
                      </Select>
                      {errors.category_id && <FormHelperText>{errors.category_id.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
              
              {/* Account/Wallet */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="wallet_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.wallet_id}>
                      <InputLabel>Account</InputLabel>
                      <Select
                        {...field}
                        label="Account"
                      >
                        {/* TODO: Replace with actual accounts from API */}
                        <MenuItem value={1}>Main Account</MenuItem>
                        <MenuItem value={2}>Savings</MenuItem>
                        <MenuItem value={3}>Investment</MenuItem>
                      </Select>
                      {errors.wallet_id && <FormHelperText>{errors.wallet_id.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
              
              {/* Frequency Type */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="frequency_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.frequency_type}>
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        {...field}
                        label="Frequency"
                        onChange={(e) => {
                          field.onChange(e);
                          // Reset frequency value based on new type
                          const type = Number(e.target.value);
                          if (type === FrequencyType.DAILY) {
                            setValue('frequency_value', 1);
                          } else if (type === FrequencyType.WEEKLY) {
                            setValue('frequency_value', 0);
                          } else if (type === FrequencyType.MONTHLY) {
                            setValue('frequency_value', 1);
                          } else if (type === FrequencyType.YEARLY) {
                            setValue('frequency_value', 1);
                          }
                        }}
                      >
                        <MenuItem value={FrequencyType.DAILY}>{FrequencyTypeLabels[FrequencyType.DAILY]}</MenuItem>
                        <MenuItem value={FrequencyType.WEEKLY}>{FrequencyTypeLabels[FrequencyType.WEEKLY]}</MenuItem>
                        <MenuItem value={FrequencyType.MONTHLY}>{FrequencyTypeLabels[FrequencyType.MONTHLY]}</MenuItem>
                        <MenuItem value={FrequencyType.YEARLY}>{FrequencyTypeLabels[FrequencyType.YEARLY]}</MenuItem>
                      </Select>
                      {errors.frequency_type && <FormHelperText>{errors.frequency_type.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
              
              {/* Frequency Value */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="frequency_value"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.frequency_value}>
                      <InputLabel>{frequencyType === FrequencyType.WEEKLY ? 'Day of Week' : 'Day'}</InputLabel>
                      {frequencyType === FrequencyType.WEEKLY ? (
                        <Select
                          {...field}
                          label="Day of Week"
                        >
                          {renderWeekdayOptions()}
                        </Select>
                      ) : (
                        <TextField
                          {...field}
                          label={frequencyType === FrequencyType.MONTHLY ? 'Day of Month' : 'Day of Year'}
                          type="number"
                          InputProps={{
                            inputProps: { 
                              min: getFrequencyValueLimits().min,
                              max: getFrequencyValueLimits().max 
                            }
                          }}
                          disabled={frequencyType === FrequencyType.DAILY}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      )}
                      <FormHelperText error={!!errors.frequency_value}>
                        {errors.frequency_value?.message || getFrequencyValueDescription()}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
              
              {/* Start Date */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Start Date"
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.start_date,
                          helperText: errors.start_date?.message
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              
              {/* End Date */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="End Date (Optional)"
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.end_date,
                          helperText: errors.end_date?.message
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              
              {/* Active Status */}
              <Grid item xs={12}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <ToggleButtonGroup
                        color="primary"
                        value={field.value ? 'active' : 'inactive'}
                        exclusive
                        onChange={(_, value) => field.onChange(value === 'active')}
                        fullWidth
                      >
                        <ToggleButton value="active">Active</ToggleButton>
                        <ToggleButton value="inactive">Inactive</ToggleButton>
                      </ToggleButtonGroup>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSubmit(handleFormSubmit)} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
        >
          {transaction ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringTransactionForm; 