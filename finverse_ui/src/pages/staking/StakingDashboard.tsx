import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Paper,
  Chip,
  CardActionArea,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useStakingAccounts, useSnackbar, usePageTitle } from '../../hooks';
import { LoadingOverlay, CustomSnackbar, EmptyState } from '../../components/shared';
import PageLayout from '../../components/layouts/PageLayout';
import StakingAccountCard from '../../components/staking/StakingAccountCard';
import { formatWalletAddress } from '../../utils/stakingUtils';

const StakingDashboard: React.FC = () => {
  usePageTitle('Staking Dashboard');
  const navigate = useNavigate();
  const { stakingAccounts, loading, error, totalStaked, totalRewards } = useStakingAccounts();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Action handlers
  const handleCreateAccount = () => {
    navigate('/staking/register');
  };

  const handleViewProfile = (id: number) => {
    navigate(`/staking/profile/${id}`);
  };

  // Action button for header
  const actionButton = (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleCreateAccount}
    >
      Create Staking Account
    </Button>
  );

  if (loading) {
    return (
      <PageLayout title="Staking Dashboard">
        <LoadingOverlay />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Staking Dashboard">
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </PageLayout>
    );
  }

  if (!stakingAccounts || stakingAccounts.length === 0) {
    return (
      <PageLayout title="Staking Dashboard" action={actionButton}>
        <EmptyState
          title="No Staking Accounts Found"
          description="Create your first staking account to start earning rewards."
          actionLabel="Create Staking Account"
          onAction={handleCreateAccount}
          icon={<TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />}
        />
        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={hideSnackbar}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Staking Dashboard" action={actionButton}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Staking Accounts
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {stakingAccounts.length}
            </Typography>
            <Button
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={handleCreateAccount}
              sx={{ mt: 1 }}
            >
              Create New Account
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Staked
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {totalStaked.toFixed(2)} FVT
            </Typography>
            <Chip 
              icon={<TrendingUpIcon />} 
              label="Earning Rewards" 
              color="primary" 
              size="small"
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Rewards Earned
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="secondary.main">
              {totalRewards.toFixed(2)} FVT
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/staking/history')}
              sx={{ mt: 1 }}
            >
              View History
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Staking Accounts */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your Staking Accounts
      </Typography>
      
      <Grid container spacing={3}>
        {stakingAccounts.map((account) => (
          <Grid item xs={12} sm={6} md={4} key={account.account.id}>
            <StakingAccountCard
              account={account}
              onViewProfile={() => handleViewProfile(account.account.id)}
            />
          </Grid>
        ))}
      </Grid>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </PageLayout>
  );
};

export default StakingDashboard;
