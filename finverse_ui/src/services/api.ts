import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Restore original baseURL to fix 404 errors
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create an Axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased from 10000ms to 15000ms (15 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
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
    // Handle global error cases here (e.g., unauthorized, server error)
    if (error.response) {
      // Log detailed API errors for debugging
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Server responded with a status code outside the 2xx range
      if (error.response.status === 401) {
        // Authentication error - just remove token
        // Don't automatically redirect to login to prevent disruption
        // during API operations
        localStorage.removeItem('token');
        
        // Add a flag to the error to indicate auth failure
        error.isAuthError = true;
      } else if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Permission denied');
      } else if (error.response.status === 500) {
        // Server error
        console.error('Server error occurred');
      }
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      console.error('Request timeout - server took too long to respond');
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error - No response received:', error.request);
    } else {
      // Something else triggered an error
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;