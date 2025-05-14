import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Link
} from '@mui/material';
import { useStakingAccounts, useSnackbar, usePageTitle } from '../../hooks';
import PageLayout from '../../components/layouts/PageLayout';
import { CustomSnackbar } from '../../components/shared';
import { generateWalletAddress, formatWalletAddress } from '../../utils/stakingUtils';

const StakingRegister: React.FC = () => {
  usePageTitle('Register Staking Account');
  const navigate = useNavigate();
  const { createStakingAccount } = useStakingAccounts();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | ''>('');
  const [previewAddress, setPreviewAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate preview address when account name changes
  React.useEffect(() => {
    if (accountName.trim()) {
      const address = generateWalletAddress(accountName);
      setPreviewAddress(address);
    } else {
      setPreviewAddress('');
    }
  }, [accountName]);

  // Handle form submission
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

      const success = await createStakingAccount(
        accountName.trim(),
        initialBalance === '' ? 0 : initialBalance
      );

      if (success) {
        showSnackbar('Staking account created successfully!', 'success');
        navigate('/staking');
      } else {
        setError('Failed to create staking account. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout 
      title="Register Staking Account"
      breadcrumbs={[
        { label: 'Staking', path: '/staking' },
        { label: 'Register Account' }
      ]}
    >
      <Paper sx={{ p: 4, maxWidth: 'md', mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Create a Staking Account
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            A staking account allows you to stake your tokens and earn rewards. 
            Each account has a unique blockchain-style address.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
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
            sx={{ mb: 3 }}
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
            sx={{ mb: 3 }}
          />

          {previewAddress && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview Wallet Address
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
              >
                {formatWalletAddress(previewAddress)}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="button" 
              onClick={() => navigate('/staking')} 
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !accountName.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating...' : 'Create Staking Account'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </PageLayout>
  );
};

export default StakingRegister;
