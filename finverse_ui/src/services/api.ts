import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

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
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];
  
  return unauthenticatedRoutes.some(route => url.includes(route));
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - remove authentication requirements
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage if it exists (but don't require it)
    const token = localStorage.getItem('token');
    
    // Add token to headers if available, but don't cancel requests without it
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

// Response interceptor - remove automatic redirects to login
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // Just pass through errors without authentication handling
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;