import axios, { AxiosError, AxiosResponse } from 'axios';

// Environment validation and logging
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  const fallbackUrl = 'http://localhost:8000/api/v1';
  
  if (!envUrl) {
    console.warn('⚠️ VITE_API_BASE_URL not defined, using fallback:', fallbackUrl);
    return fallbackUrl;
  }
  
  // Ensure the URL includes /api/v1 if not already present
  const baseUrl = envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`;
  console.log('🔗 API Base URL:', baseUrl);
  return baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with improved configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Support for httpOnly cookies
  timeout: 30000, // Increased timeout to 30 seconds for development
  // Add retry configuration
  retry: 3,
  retryDelay: (retryCount) => {
    return Math.pow(2, retryCount) * 1000; // Exponential backoff
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Enhanced retry logic for specific error types
const shouldRetry = (error: AxiosError): boolean => {
  // Don't retry on authentication errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return false;
  }
  
  // Retry on network errors, timeouts, and 5xx errors
  return (
    !error.response || // Network error
    error.code === 'ECONNABORTED' || // Timeout
    error.code === 'NETWORK_ERROR' ||
    (error.response.status >= 500 && error.response.status < 600) // Server errors
  );
};

// Custom retry interceptor
const retryRequest = async (error: AxiosError): Promise<any> => {
  const config = error.config as any;
  
  if (!config || !shouldRetry(error)) {
    return Promise.reject(error);
  }
  
  config.__retryCount = config.__retryCount || 0;
  
  if (config.__retryCount >= (config.retry || 3)) {
    console.error('❌ Max retries exceeded for:', config.url);
    return Promise.reject(error);
  }
  
  config.__retryCount += 1;
  
  const delay = config.retryDelay 
    ? config.retryDelay(config.__retryCount)
    : config.__retryCount * 1000;
  
  console.log(`🔄 Retrying request ${config.__retryCount}/${config.retry || 3} after ${delay}ms: ${config.url}`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  return apiClient(config);
};

// Request interceptor for auth token and logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      timeout: config.timeout,
    });
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`📥 ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    // Try retry first
    try {
      return await retryRequest(error);
    } catch (retryError) {
      // If retry fails, proceed with original error handling
      const originalRequest = retryError.config as any;

      // Enhanced error logging
      if (retryError.code === 'ECONNABORTED') {
        console.error('⏱️ Request timeout:', {
          url: retryError.config?.url,
          timeout: retryError.config?.timeout,
          message: 'Server is taking too long to respond'
        });
      } else if (!retryError.response) {
        console.error('🔌 Network error:', {
          url: retryError.config?.url,
          message: 'Cannot reach the server',
          code: retryError.code
        });
      }

      // Handle 401 errors with token refresh
      if (retryError.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          let response;
          
          if (refreshToken) {
            response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });
          } else {
            response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
              withCredentials: true
            });
          }

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          processQueue(null, access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            console.log('Token refresh failed, redirecting to login');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(retryError);
    }
  }
);

// Re-export the standardized API instance
export { default as api, apiClient } from '@/lib/api';
export { default } from '@/lib/api';
