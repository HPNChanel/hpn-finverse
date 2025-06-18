import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Debug log to verify API base URL
console.log('🔗 API Base URL:', API_BASE_URL);

// Create Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for refresh token
});

// Request interceptor - Add authorization token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 [${config.method?.toUpperCase()}] ${config.url} - Auth token attached`);
    } else {
      console.warn(`⚠️ [${config.method?.toUpperCase()}] ${config.url} - No access token found`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor - Handle token refresh and errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`📥 [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    // Debug auth endpoints
    if (response.config.url?.includes('/auth/')) {
      console.log('🔐 Auth response received:', response.data);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue failed requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting token refresh...');
        
        // Try refresh token from localStorage first
        const refreshToken = localStorage.getItem('refresh_token');
        let response;
        
        if (refreshToken) {
          response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
        } else {
          // Fallback to httpOnly cookie
          response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            withCredentials: true
          });
        }

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        
        console.log('✅ Token refreshed successfully');
        
        // Process queued requests
        processQueue(null, access_token);
        
        // Retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear tokens and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Redirect to login (avoid infinite redirects)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('🔄 Redirecting to login page...');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Enhanced error logging
    if (error.response?.status === 404) {
      console.warn(`🔍 [404] Endpoint not found: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    } else if (error.response?.status === 422) {
      console.error(`🔧 [422] Validation Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('📋 Request Details:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      });
      console.error('📋 Response Details:', error.response?.data);
      
      // Check if it's actually an auth issue disguised as 422
      const responseData = error.response?.data as { detail?: string };
      if (responseData?.detail?.includes('token') || 
          responseData?.detail?.includes('credentials') ||
          responseData?.detail?.includes('authorization')) {
        console.warn('⚠️ 422 error appears to be authentication-related');
      }
    } else if (error.response?.status === 500) {
      console.error(`💥 [500] Server error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`⏱️ Request timeout: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    } else if (!error.response) {
      console.error(`🔌 Network error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.code);
    } else {
      console.error(`❌ [${error.response?.status}] API Error:`, {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced API methods with better TypeScript support
export const apiClient = {
  // GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.get<T>(url, config);
  },

  // POST request  
  post: <T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.post<T>(url, data, config);
  },

  // PUT request
  put: <T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.put<T>(url, data, config);
  },

  // PATCH request
  patch: <T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.patch<T>(url, data, config);
  },

  // DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.delete<T>(url, config);
  },

  // Direct instance access for advanced usage
  instance: axiosInstance,
};

export default apiClient;
