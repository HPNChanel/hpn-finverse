import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  IconButton,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon, 
  Star as StarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useFormatters } from '../../../hooks';
import { motion } from 'framer-motion';

interface StakeOverviewProps {
  totalStaked: number;
  totalRewards: number;
  accountCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const StakeOverview: React.FC<StakeOverviewProps> = React.memo(({
  totalStaked,
  totalRewards,
  accountCount,
  isRefreshing,
  onRefresh
}) => {
  const { formatCurrency } = useFormatters();
  const theme = useTheme();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const statCardSx = {
    p: { xs: 2, sm: 2.5, md: 3 },
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: theme.shape.borderRadius * 2.5,
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(40, 40, 50, 0.7)'
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(12px) saturate(1.6)',
    border: '1px solid',
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(200, 200, 200, 0.25)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 7px 28px rgba(0,0,0,0.35)'
      : '0 7px 28px rgba(100,100,100,0.15)',
    transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow', 'transform'], {
      duration: theme.transitions.duration.short,
    }),
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.palette.mode === 'dark'
        ? '0 10px 35px rgba(0,0,0,0.4)'
        : '0 10px 35px rgba(100,100,100,0.2)',
    }
  };

  return (
    <Box sx={{ mb: {xs: 3, md: 4} }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: {xs: 2, md: 3} }}>
        <Typography variant="h5" fontWeight={600} sx={{opacity: 0.95}}>Overview</Typography>
        <Tooltip title="Refresh data">
          <span>
            <IconButton 
              onClick={onRefresh} 
              disabled={isRefreshing} 
              size="medium"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                }
              }}
            >
              {isRefreshing ? <CircularProgress size={22} color="inherit"/> : <RefreshIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Account Count Card */}
        <Grid item xs={12} sm={6} md={4}>
          <motion.div variants={cardVariants} style={{height: '100%'}}>
            <Paper sx={statCardSx} elevation={0}>
              <Box display="flex" alignItems="center" mb={1.5}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1.5, fontSize: '1.8rem' }} />
                <Typography variant="subtitle1" fontWeight={500} color="text.secondary">Staking Accounts</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5, color: theme.palette.text.primary }}>
                {accountCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto', opacity: 0.8 }}>
                Active staking positions
              </Typography>
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Total Staked Card */}
        <Grid item xs={12} sm={6} md={4}>
          <motion.div variants={cardVariants} style={{height: '100%'}}>
            <Paper sx={statCardSx} elevation={0}>
              <Box display="flex" alignItems="center" mb={1.5}>
                <TrendingUpIcon color="primary" sx={{ mr: 1.5, fontSize: '1.8rem' }} />
                <Typography variant="subtitle1" fontWeight={500} color="text.secondary">Total Value Staked</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5, color: theme.palette.text.primary }}>
                {formatCurrency(totalStaked)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto', opacity: 0.8 }}>
                Across all active accounts
              </Typography>
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Total Rewards Card */}
        <Grid item xs={12} sm={12} md={4}>
          <motion.div variants={cardVariants} style={{height: '100%'}}>
            <Paper sx={{...statCardSx, borderColor: theme.palette.secondary.main } } elevation={0}>
              <Box display="flex" alignItems="center" mb={1.5}>
                <StarIcon color="secondary" sx={{ mr: 1.5, fontSize: '1.8rem' }} />
                <Typography variant="subtitle1" fontWeight={500} color="text.secondary">Total Rewards Earned</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="secondary.main" sx={{ mb: 0.5 }}>
                {formatCurrency(totalRewards)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto', opacity: 0.8 }}>
                Net rewards from all staking
              </Typography>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
});

StakeOverview.displayName = 'StakeOverview';
export default StakeOverview;
