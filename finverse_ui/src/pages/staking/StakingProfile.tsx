import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { usePageTitle } from '../../hooks';

const StakingProfile: React.FC = () => {
  const { validatorId } = useParams<{ validatorId: string }>();
  usePageTitle(validatorId ? `Staking Profile: ${validatorId}` : 'Staking Profile');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Staking Profile {validatorId && `for ${validatorId}`}
      </Typography>
      <Typography variant="body1">
        The staking profile interface for validator ID: {validatorId ? validatorId : 'N/A'} is under construction.
      </Typography>
    </Box>
  );
};

export default StakingProfile;
