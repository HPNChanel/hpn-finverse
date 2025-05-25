import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import authService from '../services/authService';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check if current path is public (non-authenticated)
const isPublicPath = (): boolean => {
  const path = window.location.pathname;
  return path === '/' || 
         path === '/login' || 
         path === '/register' ||
         path.startsWith('/password-reset') ||
         path.startsWith('/verify-email');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Function to validate token and fetch user data
  const validateToken = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    try {
      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch current user data
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      
      // Token is invalid, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      return false;
    }
  }, []);

  // Fetch user data with error handling
  const fetchUserData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // If user fetch fails, clear auth state
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to refresh user data
  const refreshUserData = useCallback(async (): Promise<void> => {
    if (isAuthenticated) {
      await fetchUserData();
    }
  }, [isAuthenticated, fetchUserData]);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // If we're on a public path and no token exists, stay unauthenticated
      const token = localStorage.getItem('token');
      if (!token) {
        if (isPublicPath()) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        } else {
          // Redirect to login if not on public path and no token
          window.location.href = '/login';
          return;
        }
      }
      
      // Validate token and fetch user data
      const isValid = await validateToken();
      setIsAuthenticated(isValid);
      
      if (!isValid && !isPublicPath()) {
        // Redirect to login if token is invalid and not on public path
        window.location.href = '/login';
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, [validateToken]);

  // Login function that stores token and fetches user data
  const login = useCallback(async (token: string, refreshToken?: string) => {
    try {
      setIsLoading(true);
      
      // Store tokens
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed to fetch user data:', error);
      // Even if user data fetch fails, consider login successful if token is stored
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        user, 
        refreshUserData,
        validateToken,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if(context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};