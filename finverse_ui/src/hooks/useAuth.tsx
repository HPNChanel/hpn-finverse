import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authService, User } from '@/services/authService';
import { ErrorHandler } from '@/utils/errorHandler';
import { useToast } from '@/hooks/use-toast';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    // Simple base64 decode of JWT payload (second part)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch {
    return true; // If we can't decode, assume expired
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        // If no token, user is not authenticated
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log('Access token expired, attempting refresh...');
          
          try {
            // Try to refresh the token
            const newToken = await authService.refreshToken();
            console.log('Token refreshed successfully');
            
            // Now get user data with the new token
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (refreshError) {
            console.log('Token refresh failed, clearing auth state');
            // Refresh failed, clear everything and let user login again
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setError(null); // Don't show error for expired sessions
          }
        } else {
          // Token seems valid, try to get user data
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (userError: any) {
            console.log('Failed to get user data, clearing auth state');
            // If we can't get user data, the token is likely invalid
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            
            // Only show error if it's not a 401 (which is expected for invalid tokens)
            if (userError?.response?.status !== 401) {
              setError('Session expired. Please log in again.');
              toast({
                title: "Session Expired",
                description: "Please log in again to continue.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        // Clear any stored tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Don't set error state for initialization failures
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [toast]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await authService.login(credentials);
      
      // Add null checks for the response structure
      if (!authResponse) {
        throw new Error('No response received from login service');
      }
      
      if (!authResponse.user) {
        throw new Error('Invalid login response: user data not found');
      }
      
      // Set user immediately from login response
      setUser(authResponse.user);
      toast({
        title: "Welcome back!",
        description: `Hello ${authResponse.user.name || authResponse.user.email || 'User'}`,
      });
    } catch (error: any) {
      const errorMessage = ErrorHandler.extractErrorMessage(error);
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(credentials);
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully.",
      });
    } catch (error: any) {
      const errorMessage = ErrorHandler.extractErrorMessage(error);
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'Logout');
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (authService.isAuthenticated()) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error: any) {
        ErrorHandler.logError(error as Error, 'Refresh User');
        
        // If refresh fails due to invalid token, logout
        if (error?.response?.status === 401) {
          await logout();
        } else {
          setError('Failed to refresh user data. Please try again.');
          toast({
            title: "Error",
            description: "Failed to refresh user data. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  const isAuthenticated = !!user && authService.isAuthenticated();

  const authContextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
