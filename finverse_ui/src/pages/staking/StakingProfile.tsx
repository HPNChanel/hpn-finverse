import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useStakingAccounts, useSnackbar, usePageTitle } from '../../hooks';
import { LoadingOverlay, CustomSnackbar } from '../../components/shared';
import PageLayout from '../../components/layouts/PageLayout';
import StakingProfileCard from '../../components/staking/StakingProfileCard';
import StakingRewardsCard from '../../components/staking/StakingRewardsCard';
import StakingActionsCard from '../../components/staking/StakingActionsCard';
import type { StakingProfile as StakingProfileType } from '../../utils/importFixes';

const StakingProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStakingAccount, stakeTokens, unstakeTokens, loading, error } = useStakingAccounts();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  
  usePageTitle('Staking Account');

  const [stakingProfile, setStakingProfile] = useState<StakingProfileType | null>(null);
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadStakingAccount(Number(id));
    }
  }, [id]);

  const loadStakingAccount = async (accountId: number) => {
    try {
      const profile = await getStakingAccount(accountId);
      setStakingProfile(profile);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle staking
  const handleStake = async () => {
    if (!amount || !stakingProfile) return;
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      const success = await stakeTokens(Number(id), amount as number);
      
      if (success) {
        setStakeDialogOpen(false);
        setAmount('');
        showSnackbar('Tokens staked successfully!', 'success');
        loadStakingAccount(Number(id));
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to stake tokens. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unstaking
  const handleUnstake = async () => {
    if (!amount || !stakingProfile) return;
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      const success = await unstakeTokens(Number(id), amount as number);
      
      if (success) {
        setUnstakeDialogOpen(false);
        setAmount('');
        showSnackbar('Tokens unstaked successfully!', 'success');
        loadStakingAccount(Number(id));
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to unstake tokens. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout 
        title="Staking Account"
        breadcrumbs={[
          { label: 'Staking', path: '/staking' },
          { label: 'Account Details' }
        ]}
      >
        <LoadingOverlay />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout 
        title="Staking Account"
        breadcrumbs={[
          { label: 'Staking', path: '/staking' },
          { label: 'Account Details' }
        ]}
      >
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/staking')}
        >
          Back to Staking
        </Button>
      </PageLayout>
    );
  }

  if (!stakingProfile) {
    return (
      <PageLayout 
        title="Staking Account"
        breadcrumbs={[
          { label: 'Staking', path: '/staking' },
          { label: 'Account Details' }
        ]}
      >
        <Alert severity="info" sx={{ mb: 4 }}>
          Account not found.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/staking')}
        >
          Back to Staking
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={stakingProfile.account.name}
      breadcrumbs={[
        { label: 'Staking', path: '/staking' },
        { label: stakingProfile.account.name }
      ]}
      action={
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/staking')}
        >
          Back to Staking
        </Button>
      }
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StakingProfileCard stakingAccount={stakingProfile.account} />
        </Grid>
        <Grid item xs={12} md={8}>
          <StakingRewardsCard 
            status={stakingProfile.status} 
            rewards={stakingProfile.rewards} 
          />
        </Grid>
        <Grid item xs={12}>
          <StakingActionsCard 
            stakingAccount={stakingProfile}
            onStake={() => setStakeDialogOpen(true)}
            onUnstake={() => setUnstakeDialogOpen(true)}
          />
        </Grid>
      </Grid>

      {/* Stake Dialog */}
      <Dialog 
        open={stakeDialogOpen} 
        onClose={() => !isSubmitting && setStakeDialogOpen(false)}
      >
        <DialogTitle>Stake Tokens</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Amount to Stake"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ 
              min: 0.01, 
              max: stakingProfile.account.balance,
              step: 0.01 
            }}
            disabled={isSubmitting}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Available: {stakingProfile.account.balance.toFixed(2)} tokens
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStakeDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleStake} 
            color="primary" 
            disabled={isSubmitting || !amount || (amount as number) <= 0 || (amount as number) > stakingProfile.account.balance}
          >
            {isSubmitting ? 'Processing...' : 'Stake'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unstake Dialog */}
      <Dialog 
        open={unstakeDialogOpen} 
        onClose={() => !isSubmitting && setUnstakeDialogOpen(false)}
      >
        <DialogTitle>Unstake Tokens</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Amount to Unstake"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ 
              min: 0.01, 
              max: stakingProfile.status.total_staked,
              step: 0.01 
            }}
            disabled={isSubmitting}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Staked: {stakingProfile.status.total_staked.toFixed(2)} tokens
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnstakeDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleUnstake} 
            color="primary" 
            disabled={isSubmitting || !amount || (amount as number) <= 0 || (amount as number) > stakingProfile.status.total_staked}
          >
            {isSubmitting ? 'Processing...' : 'Unstake'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </PageLayout>
  );
};

export default StakingProfile;
