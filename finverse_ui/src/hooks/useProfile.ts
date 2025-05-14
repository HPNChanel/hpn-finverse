import { useState, useEffect, useCallback } from 'react';
import profileService from '../services/profileService';
import type { ProfileResponse, ProfileUpdateRequest } from '../services/profileService';
import { handleErrorResponse } from '../utils/importFixes';

interface UseProfileReturn {
  profile: ProfileResponse | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdateRequest) => Promise<boolean>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(handleErrorResponse(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: ProfileUpdateRequest): Promise<boolean> => {
    try {
      setError(null);
      const updatedProfile = await profileService.updateProfile(data);
      setProfile(updatedProfile);
      return true;
    } catch (err) {
      setError(handleErrorResponse(err));
      console.error(err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile
  };
};
