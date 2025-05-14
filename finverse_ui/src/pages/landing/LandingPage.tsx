import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Define feature items
const features = [
  {
    title: 'Financial Planning',
    description: 'Set up budgets and track your spending habits across multiple accounts',
    icon: <AssessmentIcon fontSize="large" sx={{ color: '#1976d2' }} />,
  },
  {
    title: 'Investment Tracking',
    description: 'Monitor your investments and see your wealth grow over time',
    icon: <TrendingUpIcon fontSize="large" sx={{ color: '#2e7d32' }} />,
  },
  {
    title: 'Virtual Accounts',
    description: 'Create and manage virtual accounts to organize your finances',
    icon: <CreditCardIcon fontSize="large" sx={{ color: '#9c27b0' }} />,
  },
  {
    title: 'Secure & Private',
    description: 'Your financial data stays private and secure with our encryption',
    icon: <SecurityIcon fontSize="large" sx={{ color: '#ff9800' }} />,
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle "Go to App" button click
  const handleGoToApp = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  // Handle "Learn More" button click
  const handleLearnMore = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          pt: { xs: 8, md: 12 }, 
          pb: { xs: 10, md: 14 },
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, #1a237e 0%, #311b92 100%)' 
            : 'linear-gradient(45deg, #bbdefb 0%, #e3f2fd 100%)'
        }}
      >
        <Container maxWidth="lg">
          <Fade in={true} timeout={1000}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 2,
                    color: theme.palette.mode === 'dark' ? 'white' : 'primary.main',
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  FinVerse
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ 
                    mb: 4, 
                    color: theme.palette.mode === 'dark' ? 'grey.300' : 'text.primary',
                    fontWeight: 300
                  }}
                >
                  Your AI-powered personal finance assistant
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGoToApp}
                    sx={{ 
                      px: 4, 
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      boxShadow: 4
                    }}
                  >
                    Go to App
                    <ChevronRightIcon />
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleLearnMore}
                    sx={{ 
                      px: 4, 
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    }}
                  >
                    Learn More
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Slide direction="left" in={true} timeout={1000} mountOnEnter>
                  <Box
                    component="img"
                    src="/finance-illustration.svg" 
                    alt="Financial Dashboard Illustration"
                    sx={{
                      width: '100%',
                      maxWidth: 500,
                      height: 'auto',
                      display: 'block',
                      mx: 'auto'
                    }}
                  />
                </Slide>
              </Grid>
            </Grid>
          </Fade>
        </Container>
      </Box>

      {/* Features Section */}
      <Box 
        ref={featuresRef} 
        sx={{ 
          py: 8,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            sx={{ mb: 6, fontWeight: 700 }}
          >
            Features
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Fade in={true} timeout={500 + index * 300}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 8,
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                      <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGoToApp}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem'
              }}
            >
              Get Started Now
              <ChevronRightIcon />
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
