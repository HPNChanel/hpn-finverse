import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Slide
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { formatWalletAddress } from '../../utils/stakingUtils';
import stakingService from '../../services/stakingService';

// Slide up transition for the dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface StakingRegisterProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StakingRegister: React.FC<StakingRegisterProps> = ({ open, onClose, onSuccess }) => {
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!accountName.trim()) {
      setError('Account name is required');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Create staking account
      await stakingService.createStakingAccount({
        name: accountName.trim(),
        initial_balance: initialBalance === '' ? 0 : initialBalance
      });

      // Reset form
      setAccountName('');
      setInitialBalance('');
      
      // Notify parent component of success
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create staking account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Register Staking Account</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Create a staking account to start earning rewards on your tokens.
          </Typography>

          <TextField
            margin="normal"
            required
            fullWidth
            id="accountName"
            label="Account Name"
            name="accountName"
            autoFocus
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            disabled={loading}
            placeholder="e.g., My Staking Account"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="normal"
            fullWidth
            id="initialBalance"
            label="Initial Balance (optional)"
            name="initialBalance"
            type="number"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loading}
            inputProps={{ min: 0, step: 0.01 }}
            helperText="You can transfer tokens later if you don't have any now."
          />

          {accountName && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview Wallet Address
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
              >
                {formatWalletAddress(accountName ? '0x0000000000000000000000000000000000000000' : '')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                A unique wallet address will be generated when you create your account.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !accountName.trim()} 
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Creating...' : 'Create Staking Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StakingRegister;
