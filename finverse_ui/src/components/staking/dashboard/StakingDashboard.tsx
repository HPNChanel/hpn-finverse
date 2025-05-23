import React from 'react';
import { Alert, Button, CircularProgress, Fab, useTheme, Box } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import useStakingDashboard from '../../../hooks/staking/useStakingDashboard';
import { EmptyState } from '../../shared';
import StakeOverview from './StakeOverview';
import StakingAccountsList from './StakingAccountsList';
import { StakingSkeleton } from '../index';
import { motion } from 'framer-motion';

const StakingDashboard: React.FC = () => {
  const theme = useTheme();
  
  const {
    stakingAccounts,
    loading,
    error,
    isRefreshing,
    totalStaked,
    totalRewards,
    accountCount,
    handleCreateAccount,
    handleViewProfile,
    refreshData
  } = useStakingDashboard();

  // If loading, show skeleton
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <StakingSkeleton type="full" />
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: theme.shape.borderRadius * 1.5, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,100,100,0.1)' : 'rgba(255,220,220,0.7)' }}
          >
            {error}
          </Alert>
        </motion.div>
        <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0 }} transition={{delay: 0.1}}>
          <Button 
            variant="contained" 
            onClick={refreshData}
            startIcon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            disabled={isRefreshing}
            sx={{ borderRadius: theme.shape.borderRadius * 1.5}}
          >
            {isRefreshing ? 'Refreshing...' : 'Retry'}
          </Button>
        </motion.div>
      </Box>
    );
  }

  // If no accounts, show empty state
  if (!stakingAccounts || stakingAccounts.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <EmptyState
            title="No Staking Accounts"
            description="Create your first staking account to start earning rewards."
            actionLabel="Create Staking Account"
            onAction={handleCreateAccount}
            icon={<AddIcon sx={{ fontSize: 64, color: theme.palette.primary.main, opacity: 0.8 }} />}
            sx={{ 
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(8px) saturate(1.2)',
              padding: {xs: 3, md: 4},
              borderRadius: theme.shape.borderRadius * 2,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)': 'rgba(0,0,0,0.08)'}`,
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 15px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.08)'
            }}
          />
        </motion.div>
      </Box>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const action = (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      onClick={handleCreateAccount}
      sx={{ borderRadius: theme.shape.borderRadius * 1.5, px: 2.5, py: 1.25, fontWeight: 600, boxShadow: theme.shadows[3] }}
    >
      New Staking Account
    </Button>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {action}
      </Box>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* Overview Cards */}
        <motion.div variants={itemVariants}>
          <StakeOverview 
            totalStaked={totalStaked}
            totalRewards={totalRewards}
            accountCount={accountCount}
            isRefreshing={isRefreshing}
            onRefresh={refreshData}
          />
        </motion.div>
        
        {/* Accounts List */}
        <motion.div variants={itemVariants} style={{ marginTop: theme.spacing(3) }}>
          <StakingAccountsList 
            accounts={stakingAccounts}
            onViewProfile={handleViewProfile}
          />
        </motion.div>
      </motion.div>
      
      {/* Mobile-only floating action button */}
      <Fab 
        color="secondary"
        aria-label="add staking account" 
        onClick={handleCreateAccount}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          bottom: { xs: 72, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: theme.zIndex.speedDial,
          boxShadow: theme.shadows[6],
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default StakingDashboard;
