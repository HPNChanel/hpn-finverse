import React, { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks';

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  usePageTitle('Transactions');
  
  // Automatically redirect to the new transaction management pages
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/transactions/create');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Alert severity="info" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        You are being redirected to the new transaction management interface.
      </Alert>
      
      <CircularProgress sx={{ mb: 3 }} />
      
      <Typography variant="h5" component="h2" gutterBottom>
        Transaction Management
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        We've upgraded our transaction management system. Please wait while we redirect you...
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/transactions/create')}
        >
          Create Transaction
        </Button>
        
        <Button 
          variant="outlined"
          onClick={() => navigate('/transactions/history')}
        >
          View Transaction History
        </Button>
      </Box>
    </Box>
  );
};

export default Transactions;
