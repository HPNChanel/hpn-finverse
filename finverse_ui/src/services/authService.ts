import api from './api';
import axios from 'axios';
import { handleErrorResponse } from '../utils/importFixes';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Updated to match backend expectations
export interface RegisterRequest {
  username: string;  // Changed back to username to match backend
  password: string;
  name: string; // Changed from full_name to name to match backend
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
      
      // Enhanced error handling for specific error types
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
      // Create form data for OAuth2 compatibility using URLSearchParams
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);
      
      const response = await api.post<TokenResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Store the token in localStorage (the auth context will handle the UI state)
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
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
   * Log out the current user
   */
  logout: (): void => {
    localStorage.removeItem('token');
    // Redirect to login page
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