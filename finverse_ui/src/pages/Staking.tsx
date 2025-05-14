import React from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';

const Staking: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Staking
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        Staking functionality is coming soon. Stay tuned!
      </Alert>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1">
          With staking, you'll be able to:
        </Typography>
        <Box component="ul" sx={{ mt: 2 }}>
          <li>Earn rewards by staking your tokens</li>
          <li>Support the network's security and operations</li>
          <li>Participate in governance decisions</li>
        </Box>
      </Box>
    </Container>
  );
};

export default Staking; 