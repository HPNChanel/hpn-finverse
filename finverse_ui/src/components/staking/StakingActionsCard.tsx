import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert
} from '@mui/material';
import { useFormatters } from '../../hooks';
import type { StakingProfile } from '../../utils/importFixes';

interface StakingActionsCardProps {
  stakingAccount: StakingProfile;
  onStake: () => void;
  onUnstake: () => void;
}

const StakingActionsCard: React.FC<StakingActionsCardProps> = ({ 
  stakingAccount, 
  onStake, 
  onUnstake 
}) => {
  const { formatCurrency } = useFormatters();
  const { account, status } = stakingAccount;

  // Calculate staking utilization percentage
  const utilizationPercentage = account.balance > 0 
    ? Math.min(100, (status.total_staked / (account.balance + status.total_staked)) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader title="Staking Actions" />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Staking Utilization
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={utilizationPercentage} 
            sx={{ height: 10, borderRadius: 1, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {utilizationPercentage.toFixed(1)}% of your total funds are currently staked
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Staking your tokens earns rewards at {stakingAccount.rewards.apy.toFixed(2)}% APY. 
          Unstaking removes tokens from earning rewards.
        </Alert>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            onClick={onStake}
            disabled={account.balance <= 0}
          >
            Stake Tokens
          </Button>
          <Button 
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={onUnstake}
            disabled={status.total_staked <= 0}
          >
            Unstake Tokens
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StakingActionsCard;
