import React from 'react';
import { 
  Grid, 
  Box, 
  Skeleton, 
  Paper,
  Typography 
} from '@mui/material';

interface StakingSkeletonProps {
  type: 'overview' | 'accountList' | 'full';
}

export const StakingSkeleton: React.FC<StakingSkeletonProps> = ({ type }) => {
  switch (type) {
    case 'overview':
      return <OverviewSkeleton />;
    case 'accountList':
      return <AccountListSkeleton />;
    case 'full':
    default:
      return (
        <>
          <OverviewSkeleton />
          <AccountListSkeleton />
        </>
      );
  }
};

// Overview section skeleton
const OverviewSkeleton = () => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Skeleton variant="text" width={120} height={32} />
      <Skeleton variant="circular" width={24} height={24} />
    </Box>
    
    <Grid container spacing={3}>
      {[1, 2, 3].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={140} />
            </Box>
            <Skeleton variant="text" width="60%" height={60} />
            <Skeleton variant="text" width="80%" sx={{ mt: 2 }} />
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);

// Account list skeleton
const AccountListSkeleton = () => (
  <Box>
    <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
    
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Box display="flex">
                <Skeleton variant="rectangular" width={40} height={40} sx={{ mr: 2, borderRadius: 1 }} />
                <Box>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width={80} height={24} />
                </Box>
              </Box>
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
            
            <Skeleton variant="text" width="40%" sx={{ mt: 2 }} />
            <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1 }} />
            
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={6} sx={{ mt: 1, borderRadius: 1 }} />
              <Skeleton variant="text" width="30%" sx={{ mt: 1 }} />
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default StakingSkeleton;
