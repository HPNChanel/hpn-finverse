import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Box } from '@mui/material';

const Transactions: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the Transfer page which includes transaction history
    const timer = setTimeout(() => {
      navigate('/transfer');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Transactions
      </Typography>
      <Box display="flex" flexDirection="column" alignItems="center" my={8}>
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="body1">
          Redirecting to Transfer page...
        </Typography>
      </Box>
    </Container>
  );
};

export default Transactions; 