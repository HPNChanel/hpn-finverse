import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/utils/errorHandler';

interface StakingUser {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
}

interface UseStakingAuthReturn {
  user: StakingUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const STAKING_TOKEN_KEY = 'staking_access_token';
const STAKING_USER_KEY = 'staking_user';

export const useStakingAuth = (): UseStakingAuthReturn => {
  const [user, setUser] = useState<StakingUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get stored token and user
  const getStoredToken = useCallback(() => {
    return localStorage.getItem(STAKING_TOKEN_KEY);
  }, []);

  const getStoredUser = useCallback(() => {
    const userData = localStorage.getItem(STAKING_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }, []);

  // Store token and user
  const storeAuth = useCallback((token: string, userData: StakingUser) => {
    localStorage.setItem(STAKING_TOKEN_KEY, token);
    localStorage.setItem(STAKING_USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Clear auth data
  const clearAuth = useCallback(() => {
    localStorage.removeItem(STAKING_TOKEN_KEY);
    localStorage.removeItem(STAKING_USER_KEY);
    setUser(null);
  }, []);

  // Validate current session
  const validateSession = useCallback(async (): Promise<boolean> => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      clearAuth();
      return false;
    }

    try {
      // Set token for this request
      const originalAuth = api.defaults.headers.common['Authorization'];
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Validate token with backend
      const response = await api.get('/auth/validate');
      
      if (response.status === 200) {
        setUser(storedUser);
        return true;
      }
      
      // Restore original auth
      if (originalAuth) {
        api.defaults.headers.common['Authorization'] = originalAuth;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
      
      clearAuth();
      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      
      // Restore original auth
      const originalAuth = localStorage.getItem('access_token');
      if (originalAuth) {
        api.defaults.headers.common['Authorization'] = `Bearer ${originalAuth}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
      
      clearAuth();
      return false;
    }
  }, [getStoredToken, getStoredUser, clearAuth]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { access_token, user } = response.data;

      // Store staking-specific auth
      storeAuth(access_token, user);

      // Restore original auth for main app
      const originalAuth = localStorage.getItem('access_token');
      if (originalAuth) {
        api.defaults.headers.common['Authorization'] = `Bearer ${originalAuth}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }

      toast({
        title: "Login Successful",
        description: "Welcome to FVT Staking Platform",
      });

      return true;
    } catch (error: any) {
      console.error('Staking login failed:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeAuth, toast]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const token = getStoredToken();
      
      if (token) {
        // Set staking token for logout request
        const originalAuth = api.defaults.headers.common['Authorization'];
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout request failed:', error);
        }
        
        // Restore original auth
        if (originalAuth) {
          api.defaults.headers.common['Authorization'] = originalAuth;
        } else {
          delete api.defaults.headers.common['Authorization'];
        }
      }
      
      clearAuth();
      
      toast({
        title: "Logged Out",
        description: "You have been logged out of the staking platform",
      });
      
      navigate('/staking/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      ErrorHandler.logError(error, 'Staking logout');
    }
  }, [getStoredToken, clearAuth, toast, navigate]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const isValid = await validateSession();
      
      if (!isValid && !location.pathname.includes('/staking/login')) {
        navigate('/staking/login', { 
          replace: true,
          state: { from: location.pathname }
        });
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, [validateSession, navigate, location.pathname]);

  // Set up API interceptor for staking routes
  useEffect(() => {
    if (location.pathname.startsWith('/staking') && !location.pathname.includes('/staking/login')) {
      const token = getStoredToken();
      if (token && user) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return () => {
      // Cleanup: restore main app token when leaving staking routes
      if (!location.pathname.startsWith('/staking')) {
        const mainToken = localStorage.getItem('access_token');
        if (mainToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${mainToken}`;
        } else {
          delete api.defaults.headers.common['Authorization'];
        }
      }
    };
  }, [location.pathname, getStoredToken, user]);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    validateSession,
    isAuthenticated: !!user
  };
};
