import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  StarRate as StarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useFormatters } from '../../hooks';

interface StakeStatus {
  total_staked: number;
  last_updated: string;
}

interface StakingReward {
  earned: number;
  apy: number;
  duration_days: number;
}

interface StakingRewardsCardProps {
  status: StakeStatus;
  rewards: StakingReward;
}

const StakingRewardsCard: React.FC<StakingRewardsCardProps> = ({ status, rewards }) => {
  const { formatCurrency, formatDate } = useFormatters();

  return (
    <Card>
      <CardHeader
        title="Staking Status & Rewards"
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
                  Staking Period
                </Typography>
                <Box display="flex" alignItems="center">
                  <TimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                  <Typography variant="body2" fontWeight="medium">
                    {rewards.duration_days} days
                  </Typography>
                </Box>
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
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Annual Percentage Yield (APY)
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {rewards.apy.toFixed(2)}%
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StakingRewardsCard;
