import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Icon,
  Tooltip
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  Savings as SavingsIcon,
  EmojiEvents as GoalIcon,
  TrendingUp as InvestmentIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useFormatters } from '../../hooks';
import accountService from '../../services/accountService';
import type { Account } from '../../types';

interface AccountCardProps {
  account: Account;
  onUpdate?: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onUpdate }) => {
  const { formatCurrency, formatDate } = useFormatters();
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get icon based on account type
  const getAccountIcon = () => {
    if (account.icon) {
      return <Icon fontSize="large">{account.icon}</Icon>;
    }
    
    switch (account.type) {
      case 'saving':
        return <SavingsIcon fontSize="large" />;
      case 'goal':
        return <GoalIcon fontSize="large" />;
      case 'investment':
        return <InvestmentIcon fontSize="large" />;
      default:
        return <WalletIcon fontSize="large" />;
    }
  };

  // Get color based on account type
  const getAccountColor = () => {
    return account.color || (
      account.type === 'saving' ? '#2e7d32' :
      account.type === 'goal' ? '#ff9800' :
      account.type === 'investment' ? '#9c27b0' :
      '#1976d2'
    );
  };

  // Handle top-up
  const handleTopUp = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await accountService.topUpAccount({
        account_id: account.id,
        amount: Number(amount),
        note: note || `Top-up for ${account.name}`
      });

      // Close dialog and reset form
      setTopUpDialogOpen(false);
      setAmount('');
      setNote('');

      // Refresh accounts immediately if callback provided
      if (onUpdate) {
        await onUpdate();
      }
    } catch (err) {
      console.error('Top-up error:', err);
      setError('Failed to top up account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Tooltip title={account.note ? `${account.type}: ${account.note}` : account.type}>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    color: getAccountColor(),
                    bgcolor: `${getAccountColor()}1A`,
                    p: 1,
                    borderRadius: 1,
                    mr: 2
                  }}
                >
                  {getAccountIcon()}
                </Box>
                <Box>
                  <Typography variant="h6" component="div">
                    {account.name}
                  </Typography>
                  <Chip
                    label={account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </Tooltip>
            
            {/* Top-up Button */}
            <IconButton 
              onClick={() => setTopUpDialogOpen(true)}
              color="primary"
              size="small"
              sx={{ 
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                }
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Balance
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {formatCurrency(account.balance)}
            </Typography>
          </Box>
          
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Created on {formatDate(account.created_at)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Top-up Dialog */}
      <Dialog 
        open={topUpDialogOpen} 
        onClose={() => !loading && setTopUpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Top Up {account.name}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            Enter the amount you want to add to this account.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loading}
            variant="outlined"
            inputProps={{ min: 0.01, step: 0.01 }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Note (Optional)"
            type="text"
            fullWidth
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
            variant="outlined"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopUpDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleTopUp} 
            color="primary" 
            disabled={loading || !amount || Number(amount) <= 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : 'Top Up'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AccountCard;
