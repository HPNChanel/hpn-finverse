import api from './api';
import axios from 'axios';
import { handleErrorResponse } from '../utils/importFixes';
import type { User } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  message: string;
}

const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await api.post<RegisterResponse>('/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('Registration API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Registration request timed out. Please try again.');
        }
        if (error.response?.status === 422) {
          const validationErrors = error.response.data?.detail || 'Invalid registration data';
          throw new Error(`Validation error: ${validationErrors}`);
        }
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.detail || 'Bad request';
          throw new Error(errorMessage);
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Log in a user
   */
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);
      
      const response = await api.post<TokenResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Login request timed out. Please try again.');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid username or password. Please try again.');
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/users/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      
      // Handle specific error cases
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token is expired or invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common['Authorization'];
          throw new Error('Authentication expired. Please log in again.');
        }
        if (error.response?.status === 404) {
          throw new Error('User profile not found.');
        }
        if (!error.response) {
          throw new Error('Network error. Please check your connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (): Promise<TokenResponse> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post<TokenResponse>('/auth/refresh', {
        refresh_token: refreshToken
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
        }
      }

      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Log out the current user
   */
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('token');
  }
};

export default authService;