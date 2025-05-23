import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  FormHelperText,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useAccounts, useSnackbar } from '../../hooks';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { CustomSnackbar } from '../../components/shared';
import { format } from 'date-fns';
import { TransactionTypeEnum } from '../../types/transactionTypes';
import type { CreateTransactionRequest } from '../../services/transactionService';
import { z } from 'zod'; // Import zod for validation
import { formatCurrency } from '../../utils/formatters'; // Import the formatCurrency function

const TRANSACTION_TYPES = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' }
];

const CATEGORIES = {
  INCOME: [
    { value: 'SALARY', label: 'Salary' },
    { value: 'INVESTMENT', label: 'Investment Return' },
    { value: 'GIFT', label: 'Gift' },
    { value: 'OTHER', label: 'Other Income' }
  ],
  EXPENSE: [
    { value: 'FOOD', label: 'Food & Dining' },
    { value: 'TRANSPORT', label: 'Transportation' },
    { value: 'ENTERTAINMENT', label: 'Entertainment' },
    { value: 'HOUSING', label: 'Housing & Utilities' },
    { value: 'SHOPPING', label: 'Shopping' },
    { value: 'HEALTH', label: 'Healthcare' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'OTHER', label: 'Other Expense' }
  ]
};

interface FormData {
  amount: string;
  transactionType: string;
  category: string;
  accountId: number | '';
  description: string;
  date: Date | null;
}

// Define a validation schema using zod
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  transactionType: z.number().int().min(0).max(1),
  category: z.string().optional(),
  accountId: z.number().int().positive('Please select an account'),
  description: z.string().optional(),
  date: z.date().refine(d => d !== null, 'Date is required')
});

const CreateTransaction: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
  const { createTransaction, loading: transactionLoading, error: transactionError } = useTransactionHistory();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    transactionType: 'INCOME',
    category: '',
    accountId: '',
    description: '',
    date: new Date()
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // State for error display
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Create separate handlers for different input types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error when field is changed
      if (errors[name as keyof FormData]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // Handle Select change events
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error when field is changed
      if (errors[name as keyof FormData]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      
      // Reset category when transaction type changes
      if (name === 'transactionType') {
        setFormData(prev => ({ ...prev, category: '' }));
      }
    }
  };

  // Handle account selection separately as it might be a number
  const handleAccountChange = (e: SelectChangeEvent<number | string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error when field is changed
      if (errors[name as keyof FormData]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, date }));
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

  const validateForm = (): boolean => {
    try {
      // Validate with zod schema
      transactionSchema.parse({
        amount: Number(formData.amount),
        transactionType: Number(formData.transactionType) === 0 ? 0 : 1,
        category: formData.category,
        accountId: Number(formData.accountId),
        description: formData.description,
        date: formData.date
      });
      
      // Clear previous errors if validation passes
      setValidationErrors({});
      setApiError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert zod errors to a record for easy display
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setApiError(null);
      
      // Format data to match backend API expectations
      const transactionData: CreateTransactionRequest = {
        wallet_id: formData.accountId as number, // Changed from account_id to wallet_id
        amount: Number(formData.amount),
        transaction_type: Number(formData.transactionType) === 0 ? 0 : 1, // Ensure correct type
        description: formData.description || undefined,
        transaction_date: formData.date ? format(formData.date, 'yyyy-MM-dd') : undefined // Changed from timestamp to transaction_date
      };

      console.log('Sending transaction data:', JSON.stringify(transactionData, null, 2));
      
      await createTransaction(transactionData);
      
      // Refresh accounts data to update balances
      await fetchAccounts();
      
      // Show success message
      showSnackbar('Transaction created successfully', 'success');
      
      // Reset form
      setFormData({
        amount: '',
        transactionType: 'INCOME',
        category: '',
        accountId: '',
        description: '',
        date: new Date()
      });
      
    } catch (error) {
      console.error('Transaction creation error:', error);
      
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
      
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to create transaction',
        'error'
      );
    }
  };

  const handleViewHistory = () => {
    navigate('/transactions/history');
  };

  const loading = accountsLoading || transactionLoading;
  const error = accountsError || transactionError;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {apiError && <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>}
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">Create Transaction</Typography>
        <Button 
          variant="outlined" 
          onClick={handleViewHistory}
        >
          View Transaction History
        </Button>
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: theme => theme.palette.divider
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Amount Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                fullWidth
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={!!validationErrors.amount}
                helperText={validationErrors.amount}
                required
              />
            </Grid>
            
            {/* Transaction Type Field */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!validationErrors.transactionType}>
                <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
                <Select
                  labelId="transaction-type-label"
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleSelectChange}
                  label="Transaction Type"
                  required
                >
                  <MenuItem value={TransactionTypeEnum.INCOME.toString()}>Income</MenuItem>
                  <MenuItem value={TransactionTypeEnum.EXPENSE.toString()}>Expense</MenuItem>
                </Select>
                {validationErrors.transactionType && (
                  <FormHelperText>{validationErrors.transactionType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Category Field */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!validationErrors.category}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  label="Category"
                >
                  {formData.transactionType === 'INCOME' ? (
                    CATEGORIES.INCOME.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))
                  ) : (
                    CATEGORIES.EXPENSE.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))
                  )}
                </Select>
                {validationErrors.category && (
                  <FormHelperText>{validationErrors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Account Field */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!validationErrors.accountId}>
                <InputLabel id="account-label">Account</InputLabel>
                <Select
                  labelId="account-label"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleAccountChange}
                  label="Account"
                  required
                >
                  {accounts.map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.accountId && (
                  <FormHelperText>{validationErrors.accountId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Description Field */}
            <Grid item xs={12}>
              <TextField
                label="Description (Optional)"
                fullWidth
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
              />
            </Grid>
            
            {/* Date Field */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!validationErrors.date,
                      helperText: validationErrors.date,
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Creating...' : 'Create Transaction'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </Box>
  );
};

export default CreateTransaction;