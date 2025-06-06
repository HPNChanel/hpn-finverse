import api from '@/lib/api';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

class UserService {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.put('/users/profile', data);
    return response.data;
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/users/profile');
  }
}

export const userService = new UserService();
