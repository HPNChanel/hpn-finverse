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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
    if (!localStorage.getItem('token')) return;
    
    try {
      const response = await api.get<UserInfo>('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Only logout if it's specifically an authentication error
      if ((error as {isAuthError?: boolean})?.isAuthError) {
        logout();
      }
    }
  }, []);

  // Function to refresh user data (used when changes are made)
  const refreshUserData = useCallback(async (): Promise<void> => {
    await fetchUserData();
  }, [fetchUserData]);

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchUserData();
    } else {
      setIsAuthenticated(false);
    }
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
        validateToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};