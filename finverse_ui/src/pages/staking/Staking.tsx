import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Box, Button, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add as AddIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useStaking, useSnackbar, usePageTitle } from '../../hooks';
import { LoadingOverlay, CustomSnackbar, EmptyState } from '../../components/shared';
import PageLayout from '../../components/layouts/PageLayout';
import StakingRegister from '../../components/staking/StakingRegister';
import StakingProfile from '../../components/staking/StakingProfile';
import stakingService from '../../services/stakingService';
import type { StakingProfile as StakingProfileType } from '../../utils/importFixes';
import { getErrorMessage } from '../../utils/importFixes';

const Staking: React.FC = () => {
  usePageTitle('Staking');
  
  const { stakeStatus, loading: stakingLoading, error: stakingError, stakeTokens, unstakeTokens } = useStaking();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  
  const [stakingProfile, setStakingProfile] = useState<StakingProfileType | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  const [registerDialogOpen, setRegisterDialogOpen] = useState<boolean>(false);
  const [stakeDialogOpen, setStakeDialogOpen] = useState<boolean>(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch staking profile
  const fetchStakingProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      setProfileError(null);
      const profile = await stakingService.getStakingProfile();
      setStakingProfile(profile);
    } catch (error) {
      console.error(error);
      setProfileError('Failed to load staking profile. Please try again later.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchStakingProfile();
  }, [fetchStakingProfile]);

  // Handle staking
  const handleStake = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showSnackbar('Please enter a valid amount', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await stakeTokens(Number(amount));
      if (success) {
        setAmount('');
        setStakeDialogOpen(false);
        showSnackbar('Tokens staked successfully!', 'success');
        fetchStakingProfile();
      }
    } catch (error) {
      console.error(error);
      showSnackbar('Failed to stake tokens. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unstaking
  const handleUnstake = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showSnackbar('Please enter a valid amount', 'error');
      return;
    }

    if (stakingProfile && Number(amount) > stakingProfile.status.total_staked) {
      showSnackbar('Cannot unstake more than your staked amount', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await unstakeTokens(Number(amount));
      if (success) {
        setAmount('');
        setUnstakeDialogOpen(false);
        showSnackbar('Tokens unstaked successfully!', 'success');
        fetchStakingProfile();
      }
    } catch (error) {
      console.error(error);
      showSnackbar('Failed to unstake tokens. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle registration success
  const handleRegistrationSuccess = () => {
    showSnackbar('Staking account created successfully!', 'success');
    fetchStakingProfile();
  };

  // Loading state
  if (loadingProfile || stakingLoading) {
    return (
      <PageLayout title="Staking">
        <LoadingOverlay />
      </PageLayout>
    );
  }

  // Error state
  if (profileError || stakingError) {
    return (
      <PageLayout title="Staking">
        <Alert severity="error" sx={{ mb: 4 }}>
          {profileError || stakingError}
        </Alert>
        
        <Button 
          variant="contained" 
          onClick={() => fetchStakingProfile()}
        >
          Retry
        </Button>
      </PageLayout>
    );
  }

  // No staking account yet
  if (!stakingProfile) {
    return (
      <PageLayout title="Staking">
        <EmptyState
          title="No Staking Account Found"
          description="Create a staking account to start earning rewards on your tokens."
          actionLabel="Create Staking Account"
          onAction={() => setRegisterDialogOpen(true)}
          icon={<TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main' }} />}
        />
        
        <StakingRegister
          open={registerDialogOpen}
          onClose={() => setRegisterDialogOpen(false)}
          onSuccess={handleRegistrationSuccess}
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

  // Staking account exists
  return (
    <PageLayout title="Staking">
      <StakingProfile
        profile={stakingProfile}
        onStake={() => setStakeDialogOpen(true)}
        onUnstake={() => setUnstakeDialogOpen(true)}
      />
      
      {/* Stake Dialog */}
      <Dialog
        open={stakeDialogOpen}
        onClose={() => !isSubmitting && setStakeDialogOpen(false)}
      >
        <DialogTitle>Stake Tokens</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount to Stake"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
            inputProps={{ 
              min: 0.01, 
              max: stakingProfile.account.balance,
              step: 0.01 
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Available Balance: {stakingProfile.account.balance.toFixed(2)} tokens
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStakeDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleStake} 
            color="primary" 
            disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > stakingProfile.account.balance}
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
          <TextField
            autoFocus
            margin="dense"
            label="Amount to Unstake"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
            inputProps={{ 
              min: 0.01, 
              max: stakingProfile.status.total_staked,
              step: 0.01 
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Staked Amount: {stakingProfile.status.total_staked.toFixed(2)} tokens
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnstakeDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleUnstake} 
            color="primary" 
            disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > stakingProfile.status.total_staked}
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

export default Staking;
