import React, { useState, useEffect } from 'react';
import { 
  Box, Button, TextField, MenuItem, FormControl, 
  InputLabel, Select, Paper, Typography,
  CircularProgress, Alert
} from '@mui/material';
import { SyncAlt as TransferIcon } from '@mui/icons-material';
import type { Account } from '../types';
import transferService from '../services/transferService';

interface TransferFormProps {
  accounts: Account[];
  onTransferComplete: () => void;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

const TransferForm: React.FC<TransferFormProps> = ({ accounts, onTransferComplete }) => {
  const [fromAccountId, setFromAccountId] = useState<number | ''>('');
  const [toAccountId, setToAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset toAccountId if it's the same as fromAccountId
  useEffect(() => {
    if (fromAccountId !== '' && fromAccountId === toAccountId) {
      setToAccountId('');
    }
  }, [fromAccountId, toAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!fromAccountId || !toAccountId || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Source and destination accounts must be different');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await transferService.transferFunds({
        from_account_id: fromAccountId as number,
        to_account_id: toAccountId as number,
        amount: amount as number,
        note: note || undefined
      });
      
      // Reset form
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
      setNote('');
      setSuccess(true);
      
      // Notify parent component
      onTransferComplete();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.detail || apiError.message || 'Failed to complete transfer');
    } finally {
      setLoading(false);
    }
  };

  const fromAccount = accounts.find(acc => acc.id === fromAccountId);
  const maxAmount = fromAccount ? fromAccount.balance : 0;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Transfer Funds
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Transfer completed successfully!
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <FormControl fullWidth margin="normal">
          <InputLabel id="from-account-label">From Account</InputLabel>
          <Select
            labelId="from-account-label"
            value={fromAccountId}
            label="From Account"
            onChange={(e) => {
              const newFromAccountId = e.target.value as number;
              setFromAccountId(newFromAccountId);
              // If the new "from account" is the same as the current "to account", reset the "to account"
              if (newFromAccountId === toAccountId) {
                setToAccountId('');
              }
            }}
            disabled={loading}
          >
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name} ({account.type}) - Balance: ${account.balance.toFixed(2)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="to-account-label">To Account</InputLabel>
          <Select
            labelId="to-account-label"
            value={toAccountId}
            label="To Account"
            onChange={(e) => setToAccountId(e.target.value as number)}
            disabled={loading}
          >
            {accounts
              .filter(account => account.id !== fromAccountId)
              .map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        
        <TextField
          margin="normal"
          fullWidth
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={loading}
          inputProps={{ 
            min: 0.01, 
            max: maxAmount,
            step: 0.01 
          }}
          helperText={fromAccount ? `Available: $${maxAmount.toFixed(2)}` : ''}
        />
        
        <TextField
          margin="normal"
          fullWidth
          label="Note (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={loading}
          multiline
          rows={2}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <TransferIcon />}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? 'Processing...' : 'Transfer Funds'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TransferForm; 