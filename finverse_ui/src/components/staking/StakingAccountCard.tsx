import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardActionArea,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { formatWalletAddress } from '../../utils/stakingUtils';
import { useFormatters } from '../../hooks';
import type { StakingProfile } from '../../utils/importFixes';

interface StakingAccountCardProps {
  account: StakingProfile;
  onViewProfile: () => void;
}

const StakingAccountCard: React.FC<StakingAccountCardProps> = ({ account, onViewProfile }) => {
  const { formatCurrency } = useFormatters();
  
  // Calculate staking percentage
  const stakingPercentage = account.status?.total_staked && account.account.balance 
    ? (account.status.total_staked / (account.account.balance + account.status.total_staked)) * 100
    : 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={onViewProfile} sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <WalletIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap>
              {account.account.name}
            </Typography>
          </Box>
          
          <Chip
            label={formatWalletAddress(account.account.address)}
            variant="outlined"
            size="small"
            sx={{ fontFamily: 'monospace', mb: 2 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available Balance
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(account.account.balance)}
            </Typography>
          </Box>
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Staked Amount
            </Typography>
            <Box display="flex" alignItems="center">
              <TrendingUpIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatCurrency(account.status?.total_staked || 0)}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Rewards Earned
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="secondary.main">
              {formatCurrency(account.rewards?.earned || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Staking Utilization
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={stakingPercentage} 
              sx={{ height: 6, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {stakingPercentage.toFixed(1)}% of total funds
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StakingAccountCard;
