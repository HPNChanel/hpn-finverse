import api from './api';

export interface ProfileResponse {
  id: number;
  username: string;
  name?: string;
  created_at: string;
}

export interface ProfileUpdateRequest {
  name?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

const profileService = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: ProfileUpdateRequest): Promise<ProfileResponse> => {
    const response = await api.patch<ProfileResponse>('/profile/update', data);
    return response.data;
  },

  /**
   * Change user password
   */
  changePassword: async (old_password: string, new_password: string): Promise<void> => {
    await api.patch('/profile/change-password', {
      old_password,
      new_password
    });
  }
};

export default profileService;
