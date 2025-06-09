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
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout to 30 seconds for development
});

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

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
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

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`📥 ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    // Add debug logging for auth endpoints
    if (response.config.url?.includes('/auth/')) {
      console.log('🔐 Auth response data:', response.data);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosError['config'] & { _retry?: boolean };

    // Enhanced error logging for different scenarios
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout:', {
        url: error.config?.url,
        timeout: error.config?.timeout,
        message: 'Server is taking too long to respond'
      });
    } else if (!error.response) {
      console.error('🔌 Network error:', {
        url: error.config?.url,
        message: 'Cannot reach the server',
        code: error.code
      });
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try refresh token from localStorage first
        const refreshToken = localStorage.getItem('refresh_token');
        let response;
        
        if (refreshToken) {
          // Use refresh token from localStorage
          response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
        } else {
          // Try refresh using httpOnly cookie
          response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            withCredentials: true  // Include cookies
          });
        }

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Only redirect if we're not already on the login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('Token refresh failed, redirecting to login');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Enhanced error logging for different scenarios
    if (error.response?.status === 500) {
      console.error('💥 Server Error:', error.response?.data || error.message);
    } else if (error.response?.status === 404) {
      console.warn('🔍 Endpoint Not Found:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: 'This endpoint might not be implemented yet in the backend',
        suggestion: 'Check if the API route exists or needs to be created'
      });
    } else if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized. Possible invalid/expired token.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout Error:', {
        url: error.config?.url,
        timeout: error.config?.timeout,
        message: 'Request timed out - server may be unreachable'
      });
    } else if (!error.response) {
      console.error('🔌 Connection Error:', {
        url: error.config?.url,
        code: error.code,
        message: 'Cannot connect to server'
      });
    } else {
      console.error('❌ API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
    }

    return Promise.reject(error);
  }
);

// Staking API endpoints
export const stakingApi = {
  // Record staking position after blockchain transaction
  recordStakingPosition: async (positionData: {
    walletAddress: string;
    poolId: string;
    amount: number;
    blockchainTxHash: string;
    lockPeriod?: number;
  }) => {
    const response = await api.post('/staking/record', {
      poolId: positionData.poolId,
      amount: positionData.amount,
      txHash: positionData.blockchainTxHash,
      lockPeriod: positionData.lockPeriod || 0,
      walletAddress: positionData.walletAddress
    });
    return response.data;
  },

  // Get user staking positions
  getUserStakes: async (activeOnly: boolean = false) => {
    const response = await api.get(`/staking/user-stakes?active_only=${activeOnly}`);
    return response.data;
  },

  // Get available staking pools using unified API
  getStakingPools: async () => {
    const response = await api.get('/staking/pools');
    return response.data;
  },

  // Get staking rewards using unified API
  getStakingRewards: async () => {
    const response = await api.get('/staking/rewards');
    return response.data;
  },

  // Stake tokens using unified model
  stakeTokens: async (stakeData: {
    poolId: string;
    amount: number;
    lockPeriod?: number;
  }) => {
    const response = await api.post('/staking/stake', {
      poolId: stakeData.poolId,
      amount: stakeData.amount,
      lockPeriod: stakeData.lockPeriod || 0
    });
    return response.data;
  },

  // Unstake tokens using unified model
  unstakeTokens: async (unstakeData: {
    poolId: string;
    amount: number;
  }) => {
    const response = await api.post('/staking/unstake', {
      poolId: unstakeData.poolId,
      amount: unstakeData.amount
    });
    return response.data;
  },

  // Get staking status using unified model
  getStakingStatus: async () => {
    const response = await api.get('/staking/status');
    return response.data;
  },

  // Update staking position using unified model
  updateStakingPosition: async (positionId: number, updateData: Record<string, unknown>) => {
    const response = await api.put(`/staking/positions/${positionId}`, updateData);
    return response.data;
  },

  // Claim rewards using unified model
  claimRewards: async () => {
    const response = await api.post('/staking/rewards/claim');
    return response.data;
  },

  // Claim rewards for specific stake
  claimStakeRewards: async (stakeId: string) => {
    const response = await api.post(`/staking/rewards/claim/${stakeId}`);
    return response.data;
  },

  // Get claimable rewards
  getClaimableRewards: async () => {
    const response = await api.get('/staking/rewards/claimable');
    return response.data;
  },

  // Get claimable rewards for specific stake
  getStakeClaimableRewards: async (stakeId: string) => {
    const response = await api.get(`/staking/rewards/claimable/${stakeId}`);
    return response.data;
  },

  // Sync staking event to backend database
  syncStakeEvent: async (eventData: {
    user_id: string;
    stake_id: number;
    amount: string;
    duration: number;
    tx_hash: string;
    pool_id?: string;
    timestamp?: string;
  }) => {
    const response = await api.post('/staking/sync', {
      user_id: eventData.user_id,
      stake_id: eventData.stake_id,
      amount: parseFloat(eventData.amount),
      duration: eventData.duration,
      tx_hash: eventData.tx_hash,
      pool_id: eventData.pool_id || 'default-pool',
      timestamp: eventData.timestamp || new Date().toISOString()
    });
    return response.data;
  },

  // Get staking logs for analytics and history
  getStakingLogs: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get(`/staking/logs?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Get staking analytics for charts and insights
  getStakingAnalytics: async (timeframe: string = '30d') => {
    const response = await api.get(`/staking/analytics?timeframe=${timeframe}`);
    return response.data;
  },

  // Get staking dashboard overview
  getStakingOverview: async () => {
    const response = await api.get('/staking/overview');
    return response.data;
  },

  // Get comprehensive staking dashboard data
  getStakingDashboard: async () => {
    const response = await api.get('/staking/dashboard');
    return response.data;
  }
};

// ETH Transfer API endpoints
export const ethTransferApi = {
  // Log ETH transfer to backend database
  logEthTransfer: async (transferData: {
    from_address: string;
    to_address: string;
    amount_eth: number;
    tx_hash: string;
    timestamp?: string;
    gas_used?: string;
    gas_price?: string;
    notes?: string;
  }) => {
    const response = await api.post('/eth-transfer/log', {
      from_address: transferData.from_address,
      to_address: transferData.to_address,
      amount_eth: transferData.amount_eth,
      tx_hash: transferData.tx_hash,
      timestamp: transferData.timestamp || new Date().toISOString(),
      gas_used: transferData.gas_used,
      gas_price: transferData.gas_price,
      notes: transferData.notes || 'ETH transfer via FinVerse'
    });
    return response.data;
  },

  // Get ETH transfer history for specific address
  getEthTransferHistory: async (address?: string, limit: number = 50, offset: number = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (address) {
      params.append('address', address);
    }
    
    const response = await api.get(`/eth-transfer/history?${params.toString()}`);
    return response.data;
  }
};

// Wallet API endpoints
export const walletApi = {
  // Log ETH transfer using wallet endpoint (matches requirements)
  logEthTransfer: async (transferData: {
    from_address: string;
    to_address: string;
    amount_eth: number;
    tx_hash: string;
    timestamp?: string;
    gas_used?: string;
    gas_price?: string;
    notes?: string;
  }) => {
    const response = await api.post('/wallet/eth-transfer', {
      from_address: transferData.from_address,
      to_address: transferData.to_address,
      amount_eth: transferData.amount_eth,
      tx_hash: transferData.tx_hash,
      timestamp: transferData.timestamp || new Date().toISOString(),
      gas_used: transferData.gas_used,
      gas_price: transferData.gas_price,
      notes: transferData.notes || 'ETH transfer via FinVerse'
    });
    return response.data;
  },

  // Get ETH transfer history using wallet endpoint (matches requirements)
  getEthHistory: async (
    address?: string, 
    limit: number = 50, 
    offset: number = 0,
    filters?: {
      status?: string;
      direction?: string;
      fromDate?: string;
      toDate?: string;
    }
  ) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (address) {
      params.append('address', address);
    }
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    
    if (filters?.direction) {
      params.append('direction', filters.direction);
    }
    
    if (filters?.fromDate) {
      params.append('from_date', filters.fromDate);
    }
    
    if (filters?.toDate) {
      params.append('to_date', filters.toDate);
    }
    
    const response = await api.get(`/wallet/eth-history?${params.toString()}`);
    return response.data;
  },

  // Log ETH transfer (legacy endpoint)
  logTransfer: async (transferData: {
    from_address: string;
    to_address: string;
    amount_eth: number;
    tx_hash: string;
    timestamp?: string;
    gas_used?: string;
    gas_price?: string;
    status?: 'success' | 'failed';
    notes?: string;
  }) => {
    const response = await api.post('/wallet/transfer-log', {
      from_address: transferData.from_address,
      to_address: transferData.to_address,
      amount_eth: transferData.amount_eth,
      tx_hash: transferData.tx_hash,
      timestamp: transferData.timestamp || new Date().toISOString(),
      gas_used: transferData.gas_used,
      gas_price: transferData.gas_price,
      status: transferData.status || 'success',
      notes: transferData.notes || 'ETH transfer via FinVerse'
    });
    return response.data;
  },

  // Get transfer history (legacy endpoint)
  getTransferHistory: async (address?: string, limit: number = 50, offset: number = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (address) {
      params.append('address', address);
    }
    
    const response = await api.get(`/wallet/transfer-history?${params.toString()}`);
    return response.data;
  }
};

// Also export as stakingService for backward compatibility
export const stakingService = stakingApi;

// Export for convenience
export default api;
