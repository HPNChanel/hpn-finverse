import { useState, useEffect, useCallback } from 'react';

interface UseAvatarUrlOptions {
  avatarUrl?: string | null;
  enableCacheBusting?: boolean;
}

export function useAvatarUrl({ avatarUrl, enableCacheBusting = true }: UseAvatarUrlOptions) {
  const [timestamp, setTimestamp] = useState<number>(Date.now());

  // Update timestamp when avatar URL changes
  useEffect(() => {
    if (avatarUrl) {
      setTimestamp(Date.now());
    }
  }, [avatarUrl]);

  const refreshAvatar = useCallback(() => {
    setTimestamp(Date.now());
  }, []);

  const getAvatarSrc = useCallback(() => {
    if (!avatarUrl) return undefined;
    
    // Use the avatar URL as-is since Vite proxy will handle /uploads requests
    const fullAvatarUrl = avatarUrl;
    
    if (!enableCacheBusting) return fullAvatarUrl;
    
    const separator = fullAvatarUrl.includes('?') ? '&' : '?';
    return `${fullAvatarUrl}${separator}t=${timestamp}`;
  }, [avatarUrl, enableCacheBusting, timestamp]);

  return {
    getAvatarSrc,
    refreshAvatar,
    timestamp,
  };
} 