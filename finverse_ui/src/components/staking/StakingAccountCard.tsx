import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardActionArea,
  Divider,
  LinearProgress,
  Button,
  CardActions,
  useTheme,
  Grid
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  Stars as RewardsIcon,
  LockClock as DurationIcon,
  ShowChart as ApyIcon,
  AddCircleOutline as StakeIcon,
  Redeem as ClaimIcon,
  ExitToApp as WithdrawIcon,
} from '@mui/icons-material';
import { formatWalletAddress } from '../../utils/stakingUtils';
import { useFormatters } from '../../hooks';
import type { StakingProfile } from '../../types';
import { motion } from 'framer-motion';

interface StakingAccountCardProps {
  account: StakingProfile;
  onViewProfile: () => void;
  apy?: number;
  duration?: string;
}

const StakingAccountCard: React.FC<StakingAccountCardProps> = ({
  account,
  onViewProfile,
  apy = 0.0,
  duration = 'Flexible',
}) => {
  const { formatCurrency } = useFormatters();
  const theme = useTheme();
  
  // Local simple percentage formatter
  const formatPercentLocal = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const stakingPercentage = account.account.balance + (account.status?.total_staked || 0) > 0
    ? ((account.status?.total_staked || 0) / (account.account.balance + (account.status?.total_staked || 0))) * 100
    : 0;

  const cardHoverVariants = {
    hover: {
      scale: 1.03,
      boxShadow: theme.palette.mode === 'dark' 
        ? `0px 10px 25px -5px rgba(0,0,0,0.4), 0px 8px 10px -6px rgba(0,0,0,0.3)`
        : `0px 10px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.08)`,
      transition: { duration: 0.25, ease: 'easeOut' }
    }
  };

  const handleStake = (e: React.MouseEvent) => { e.stopPropagation(); console.log('Stake action for:', account.account.id); };
  const handleClaim = (e: React.MouseEvent) => { e.stopPropagation(); console.log('Claim action for:', account.account.id); };
  const handleWithdraw = (e: React.MouseEvent) => { e.stopPropagation(); console.log('Withdraw action for:', account.account.id); };

  return (
    <motion.div whileHover="hover" variants={cardHoverVariants} style={{ height: '100%' }}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: theme.shape.borderRadius * 2.5,
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(35, 38, 50, 0.7)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px) saturate(1.7)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.7)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(200, 200, 200, 0.2)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 6px 22px rgba(0,0,0,0.3)'
            : '0 6px 22px rgba(150,150,150,0.12)',
          transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
            duration: theme.transitions.duration.short,
          }),
        }}
      >
        <CardActionArea onClick={onViewProfile} sx={{ flexGrow: 1, p: {xs: 2, md: 2.5} }}>
          <CardContent sx={{p:0, '&:last-child': {pb:0} }}>
            <Box display="flex" alignItems="center" mb={2}>
              <WalletIcon color="primary" sx={{ mr: 1.5, fontSize: '1.75rem' }} />
              <Typography variant="h6" fontWeight={600} noWrap sx={{flexGrow: 1}}>
                {account.account.name}
              </Typography>
            </Box>
            
            <Chip
              label={formatWalletAddress(account.account.address)}
              variant="outlined"
              size="small"
              sx={{ fontFamily: 'monospace', mb: 2.5, fontSize: '0.75rem', opacity: 0.8, borderColor: 'rgba(120,120,120,0.3)'}}
            />
            
            <Grid container spacing={{xs: 1.5, md: 2}} mb={2.5}>
              <Grid item xs={6} sm={4}>
                <Box textAlign="left">
                  <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" sx={{opacity: 0.9}}>
                    <ApyIcon sx={{ fontSize: '1rem', mr: 0.5, color: theme.palette.success.main }}/> APY
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatPercentLocal(apy)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Box textAlign="left">
                  <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" sx={{opacity: 0.9}}>
                    <DurationIcon sx={{ fontSize: '1rem', mr: 0.5, color: theme.palette.info.main }}/> Duration
                  </Typography>
                  <Typography variant="h6" fontWeight="500">
                    {duration}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box textAlign={{xs: 'left', sm: 'right'}}>
                  <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" justifyContent={{xs:'flex-start', sm: 'flex-end'}} sx={{opacity: 0.9}}>
                    <RewardsIcon sx={{ fontSize: '1rem', mr: 0.5, color: theme.palette.secondary.main }}/> Rewards
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="secondary.main">
                    {formatCurrency(account.rewards?.earned || 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2, borderColor: 'rgba(120,120,120,0.15)' }} />
            
            <Grid container spacing={{xs:1, md:1.5}} alignItems="flex-end">
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{opacity: 0.9}}>
                  Staked
                </Typography>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatCurrency(account.status?.total_staked || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{opacity: 0.9}}>
                  Available
                </Typography>
                <Typography variant="h6" fontWeight="500">
                  {formatCurrency(account.account.balance)}
                </Typography>
              </Grid>
            </Grid>
            
            {((account.status?.total_staked || 0) > 0 || account.account.balance > 0) && (
            <Box sx={{ mt: 2.5 }}>
              <LinearProgress
                variant="determinate"
                value={stakingPercentage}
                sx={{
                  height: 8, borderRadius: theme.shape.borderRadius,
                  bgcolor: 'action.disabledBackground',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right', opacity: 0.8}}>
                {stakingPercentage.toFixed(1)}% of funds actively staked
              </Typography>
            </Box>
            )}
          </CardContent>
        </CardActionArea>
        <CardActions sx={{ p: {xs: 1.5, md: 2}, pt:0, justifyContent: 'space-around', borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button 
                size="small" 
                startIcon={<StakeIcon />} 
                onClick={handleStake}
                sx={{flex:1, color: theme.palette.primary.main}}
            >
                Stake
            </Button>
            <Divider orientation="vertical" flexItem sx={{borderColor: 'rgba(120,120,120,0.2)'}} />
            <Button 
                size="small" 
                startIcon={<ClaimIcon />} 
                onClick={handleClaim} 
                disabled={(account.rewards?.earned || 0) === 0}
                sx={{flex:1, color: theme.palette.secondary.main}}
            >
                Claim
            </Button>
            
            {(account.status?.total_staked || 0) > 0 && (
              <>
                <Divider orientation="vertical" flexItem sx={{borderColor: 'rgba(120,120,120,0.2)'}} />
                <Button 
                    size="small" 
                    startIcon={<WithdrawIcon />} 
                    onClick={handleWithdraw}
                    sx={{flex:1}}
                >
                    Manage
                </Button>
              </>
            )}
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default StakingAccountCard;
