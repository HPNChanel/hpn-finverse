import React, { useState, useEffect } from 'react';
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
  Typography,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { 
  FrequencyType, 
  FrequencyTypeLabels, 
  TransactionType,
  TransactionTypeLabels,
  formatFrequency
} from '../../services/recurringTransactionService';
import type { 
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate
} from '../../services/recurringTransactionService';
import { useAccounts } from '../../hooks'; // Use the hooks barrel file instead of direct import

// Define validation schema with Zod
const formSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
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
  // Fetch available accounts/wallets
  const { accounts, loading: accountsLoading } = useAccounts();
  
  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nextOccurrence, setNextOccurrence] = useState<string | null>(null);
  
  // Initialize form with default values or existing transaction data
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction ? {
      category_id: transaction.category_id.toString(),
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
      category_id: '',
      wallet_id: accounts && accounts.length > 0 ? accounts[0].id : 0,
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
  
  // Update default wallet_id when accounts load
  useEffect(() => {
    if (accounts?.length > 0 && !transaction && !watch('wallet_id')) {
      setValue('wallet_id', accounts[0].id);
    }
  }, [accounts, setValue, transaction, watch]);
  
  // Watch frequency type to conditionally render frequency value input
  const frequencyType = watch('frequency_type');
  const startDate = watch('start_date');
  
  // Provide a preview of next occurrence based on frequency settings
  useEffect(() => {
    if (startDate) {
      try {
        const frequencyValue = watch('frequency_value');
        const dateStr = startDate instanceof Date ? startDate : new Date(startDate);
        
        // Simple preview calculation (this doesn't match exact backend logic but gives a reasonable preview)
        let nextDate: Date;
        
        switch (frequencyType) {
          case FrequencyType.DAILY:
            nextDate = new Date(dateStr);
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case FrequencyType.WEEKLY:
            nextDate = new Date(dateStr);
            const day = nextDate.getDay();
            const daysToAdd = (frequencyValue - day + 7) % 7;
            nextDate.setDate(nextDate.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
            break;
          case FrequencyType.MONTHLY:
            nextDate = new Date(dateStr);
            nextDate.setMonth(nextDate.getMonth() + 1);
            // Handle month length issues
            const desiredDay = Math.min(frequencyValue, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate());
            nextDate.setDate(desiredDay);
            break;
          case FrequencyType.YEARLY:
            nextDate = new Date(dateStr);
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            nextDate = new Date(dateStr);
        }
        
        setNextOccurrence(nextDate.toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        }));
      } catch (error) {
        setNextOccurrence(null);
      }
    }
  }, [frequencyType, startDate, watch]);
  
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
  
  // When start date changes and frequency type is monthly, default frequency value to the day of month
  useEffect(() => {
    if (frequencyType === FrequencyType.MONTHLY && startDate instanceof Date) {
      setValue('frequency_value', startDate.getDate());
    }
  }, [startDate, frequencyType, setValue]);
  
  // Handle form submission
  const handleFormSubmit = async (data: FormSchemaType) => {
    try {
      setSubmitting(true);
      setFormError(null);
      
      // Format data for API submission
      const formattedData = {
        category: data.category_id, // Backend expects category as string, not category_id
        wallet_id: Number(data.wallet_id),
        amount: Number(data.amount),
        transaction_type: Number(data.transaction_type),
        frequency_type: Number(data.frequency_type),
        frequency_value: Number(data.frequency_value),
        description: data.description || undefined,
        is_active: Boolean(data.is_active),
        // Format dates as YYYY-MM-DD
        start_date: data.start_date instanceof Date ? 
          data.start_date.toISOString().split('T')[0] : 
          new Date(data.start_date).toISOString().split('T')[0],
        // Only include end_date if it exists
        ...(data.end_date && {
          end_date: data.end_date instanceof Date ? 
            data.end_date.toISOString().split('T')[0] : 
            new Date(data.end_date).toISOString().split('T')[0]
        })
      };
      
      console.log('Submitting recurring transaction:', formattedData);
      
      await onSubmit(formattedData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {formError}
          </Alert>
        )}
        
        {nextOccurrence && (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2">
              <strong>Next Occurrence Preview:</strong> {nextOccurrence}
            </Typography>
            <Typography variant="caption">
              (Actual date may vary slightly based on server calculation)
            </Typography>
          </Alert>
        )}
        
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
                      required
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
                        required
                      >
                        <MenuItem value="Food">Food</MenuItem>
                        <MenuItem value="Transport">Transport</MenuItem>
                        <MenuItem value="Housing">Housing</MenuItem>
                        <MenuItem value="Entertainment">Entertainment</MenuItem>
                        <MenuItem value="Utilities">Utilities</MenuItem>
                        <MenuItem value="Insurance">Insurance</MenuItem>
                        <MenuItem value="Medical">Medical</MenuItem>
                        <MenuItem value="Education">Education</MenuItem>
                        <MenuItem value="Salary">Salary</MenuItem>
                        <MenuItem value="Investment">Investment</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
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
                        required
                        disabled={accountsLoading}
                      >
                        {accountsLoading ? (
                          <MenuItem disabled>Loading accounts...</MenuItem>
                        ) : accounts && accounts.length > 0 ? (
                          accounts.map(account => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.name} ({account.type}) - ${account.balance.toFixed(2)}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>No accounts found</MenuItem>
                        )}
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
                          } else if (type === FrequencyType.MONTHLY && startDate) {
                            // For monthly, default to the day of the month from the start date
                            const day = startDate instanceof Date ? 
                              startDate.getDate() : new Date(startDate).getDate();
                            setValue('frequency_value', day);
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
                      <Box display="flex" alignItems="center">
                        <InputLabel>{frequencyType === FrequencyType.WEEKLY ? 'Day of Week' : 'Day'}</InputLabel>
                        <Tooltip title={getFrequencyValueDescription()} placement="top">
                          <HelpOutlineIcon fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                        </Tooltip>
                      </Box>
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
                          helperText: errors.start_date?.message,
                          required: true
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
                      <Typography variant="subtitle1" gutterBottom>Status</Typography>
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
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit(handleFormSubmit)} 
          variant="contained" 
          color="primary"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Saving...' : transaction ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringTransactionForm;