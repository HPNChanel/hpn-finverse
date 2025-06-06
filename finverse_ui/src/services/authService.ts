import api from '@/lib/api';

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return {
        user: response.data.user,
        tokens: {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token
        }
      };
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<void> {
    try {
      await api.post('/auth/register', credentials);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await api.post('/auth/refresh');
      const newToken = response.data.access_token;
      localStorage.setItem('access_token', newToken);
      return newToken;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

export const authService = new AuthService();
export { User };
