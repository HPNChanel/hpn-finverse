import api from '@/lib/api';

// Export types that are used in Profile.tsx
export interface ProfileUpdateData {
  name: string;
}

export interface PasswordUpdateData {
  old_password: string;
  new_password: string;
}

// Standardized email-based user interface
export interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProfileUpdateRequest {
  name?: string;
}

// Keep backward compatible interfaces but update for email
export interface ProfileUpdate {
  name: string;
}

export interface PasswordChange {
  old_password: string;
  new_password: string;
}

class ProfileService {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/users/me');
    return response.data;
  }

  async updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    const response = await api.put('/users/me', { name: data.name });
    return response.data;
  }

  async updatePassword(data: PasswordUpdateData): Promise<void> {
    await api.post('/profile/change-password', {
      old_password: data.old_password,
      new_password: data.new_password,
    });
  }

  async updateAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.put('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const profileService = new ProfileService();

// For backward compatibility
export { profileService as userService };
