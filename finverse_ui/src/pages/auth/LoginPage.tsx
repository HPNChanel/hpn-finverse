import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Avatar,
  Link,
  Alert,
  Snackbar,
} from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import authService from '../../services/authService';
import axios from 'axios';
import type { AxiosError } from '../../utils/importFixes';
import { useAuth } from '../../contexts/AuthContext';

// Define error response interface
interface ErrorResponse {
  detail?: string;
  message?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  // Form validation
  const isFormValid = (): boolean => {
    if (!username || !password) {
      setError('Username and password are required');
      return false;
    }
    return true;
  };
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.login({ username, password });
      
      // Use the context login method which handles token storage and state
      login(response.access_token, response.refresh_token);
      
      setOpenSnackbar(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Login error:', err);
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponse>;
        
        if (axiosError.code === 'ECONNABORTED') {
          setError('Request timed out. The server is taking too long to respond.');
        } else if (axiosError.response?.status === 401) {
          setError('Invalid username or password. Please try again.');
        } else if (axiosError.response?.status === 422) {
          const detail = axiosError.response.data?.detail || 'Invalid input data';
          setError(`Validation error: ${detail}`);
        } else if (!axiosError.response) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          // Access data safely
          const errorDetail = axiosError.response?.data?.detail || 
                             axiosError.response?.data?.message ||
                             axiosError.message;
          setError(errorDetail || 'Login failed. Please check your credentials.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Login successful! Redirecting to dashboard...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LoginPage;