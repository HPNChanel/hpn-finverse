import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  LinearProgress,
  Paper,
  Grid,
  Button,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ContentCopy as CopyIcon,
  TrendingUp as TrendingUpIcon,
  StarRate as StarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { formatWalletAddress } from '../../utils/stakingUtils';
import type { StakingProfile as StakingProfileType } from '../../utils/importFixes';
import { useFormatters } from '../../hooks';

interface StakingProfileProps {
  profile: StakingProfileType;
  onStake: () => void;
  onUnstake: () => void;
}

const StakingProfile: React.FC<StakingProfileProps> = ({ profile, onStake, onUnstake }) => {
  const { formatCurrency, formatDate } = useFormatters();
  const [copied, setCopied] = React.useState(false);
  
  const { account, status, rewards } = profile;

  // Calculate staking utilization percentage
  const utilizationPercentage = account.balance > 0 
    ? Math.min(100, (status.total_staked / account.balance) * 100) 
    : 0;

  // Handle copy wallet address
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Grid container spacing={3}>
      {/* Staking Account Card */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <WalletIcon />
              </Avatar>
            }
            title={account.name}
            subheader="Staking Account"
            action={
              <Tooltip title={copied ? "Copied!" : "Copy Address"}>
                <Button 
                  size="small" 
                  startIcon={<CopyIcon />} 
                  onClick={handleCopyAddress}
                >
                  Copy
                </Button>
              </Tooltip>
            }
          />
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Wallet Address
              </Typography>
              <Chip
                label={formatWalletAddress(account.address)}
                variant="outlined"
                size="small"
                sx={{ fontFamily: 'monospace', mb: 1 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Created on {formatDate(account.created_at)}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Available Balance
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" color="primary.main">
                {formatCurrency(account.balance)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available for staking
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Staking Status Card */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader
            title="Staking Status"
            subheader={`Last updated: ${formatDate(status.last_updated)}`}
          />
          <CardContent>
            <Grid container spacing={3}>
              {/* Total Staked */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }} elevation={0} variant="outlined">
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Staked</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(status.total_staked)}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Utilization
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={utilizationPercentage} 
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {utilizationPercentage.toFixed(1)}% of available balance
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Rewards */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }} elevation={0} variant="outlined">
                  <Box display="flex" alignItems="center" mb={1}>
                    <StarIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Rewards Earned</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {formatCurrency(rewards.earned)}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        APY
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {rewards.apy.toFixed(2)}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Staking Period
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <TimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {rewards.duration_days} days
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
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
      </Grid>
    </Grid>
  );
};

export default StakingProfile;
