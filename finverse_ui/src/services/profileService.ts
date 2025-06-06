// Update to use user.service.ts with email-based authentication
export * from './user.service';
export { userService as profileService } from './user.service';

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
  avatar_url?: string;
}

// Keep backward compatible interfaces but update for email
export interface ProfileUpdate {
  name: string;
}

export interface PasswordChange {
  old_password: string;
  new_password: string;
}
