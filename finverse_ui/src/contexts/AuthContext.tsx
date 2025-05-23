import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface UserInfo {
  id: number;
  username: string;
  name?: string;
  created_at: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  user: UserInfo | null;
  walletAddress?: string;
  isLoading: boolean; // Add loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check if current path is public (non-authenticated)
const isPublicPath = (): boolean => {
  const path = window.location.pathname;
  return path === '/' || // landing page
         path === '/login' || 
         path === '/register' ||
         path.startsWith('/password-reset') ||
         path.startsWith('/verify-email');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  
  // Function to validate token without causing logout on failure
  const validateToken = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Make a lightweight API call to test token validity
      await api.get('/auth/validate');
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      // Don't logout or remove token here - this is just validation
      return false;
    }
  }, []);

  // Fetch user data from the API
  const fetchUserData = useCallback(async (): Promise<void> => {
    if (!localStorage.getItem('token')) {
      setIsLoading(false);
      return;
    }
    
    // Skip API call on public pages
    if (isPublicPath()) {
      console.log('Skipping auth check on public page');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await api.get<UserInfo>('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Only logout if it's specifically an authentication error
      if ((error as {isAuthError?: boolean})?.isAuthError) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to refresh user data (used when changes are made)
  const refreshUserData = useCallback(async (): Promise<void> => {
    // Skip refresh on public pages
    if (isPublicPath()) {
      setIsLoading(false);
      return;
    }
    
    await fetchUserData();
  }, [fetchUserData]);

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      setIsAuthenticated(true);
      
      // Only fetch user data if not on public page
      if (!isPublicPath()) {
        fetchUserData();
      } else {
        setIsLoading(false);
      }
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [fetchUserData]);

  // Also listen to path changes to handle navigation to/from landing page
  useEffect(() => {
    const handleLocationChange = () => {
      const token = localStorage.getItem('token');
      if (token && !isPublicPath()) {
        fetchUserData();
      } else {
        setIsLoading(false);
      }
    };

    // Listen to navigation events
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [fetchUserData]);

  // Store token in localStorage and set authenticated state
  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    fetchUserData();
  }, [fetchUserData]);

  // Remove token from localStorage and set authenticated state to false
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setWalletAddress(undefined);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        user, 
        walletAddress,
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
  if( context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};