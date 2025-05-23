import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import type { StakingProfile } from '../../../types';
import StakingAccountCard from '../StakingAccountCard';
import { motion } from 'framer-motion';

interface StakingAccountsListProps {
  accounts: StakingProfile[];
  onViewProfile: (id: number) => void;
}

const StakingAccountsList: React.FC<StakingAccountsListProps> = React.memo(({
  accounts,
  onViewProfile
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.35, ease: 'easeOut' }
    }
  };

  return (
    <Box sx={{ mt: {xs: 3, md: 4} }}>
      <Typography variant="h5" fontWeight={600} sx={{ mb: {xs: 2, md: 3}, opacity: 0.95 }}>
        Your Staking Positions
      </Typography>
      
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={{xs: 2, sm: 2.5, md: 3}}>
          {accounts.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account.account.id}>
              <motion.div variants={itemVariants} style={{height: '100%'}}>
                <StakingAccountCard
                  account={account}
                  onViewProfile={() => onViewProfile(account.account.id)}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  );
});

StakingAccountsList.displayName = 'StakingAccountsList';
export default StakingAccountsList;
