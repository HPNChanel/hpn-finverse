import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Ensure baseURL is correctly defined
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create an Axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Check if path is unauthenticated (doesn't require token)
const isUnauthenticatedPath = (url: string | undefined): boolean => {
  if (!url) return false;
  
  // Define routes that don't need authentication
  const unauthenticatedRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/validate',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];
  
  return unauthenticatedRoutes.some(route => url.includes(route));
};

// Request interceptor to add authorization headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Check if this is an authenticated route and token is missing
    if (!token && !isUnauthenticatedPath(config.url)) {
      // For non-auth routes without a token, cancel the request
      // This prevents unnecessary 401s when user isn't logged in
      return Promise.reject(new Error('Authentication required - request canceled'));
    }
    
    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's an authentication error
    if (error?.response?.status === 401) {
      // Could handle token refresh or redirect to login
      console.error('Authentication error:', error);
    }
    return Promise.reject(error);
  }
);

export default api;