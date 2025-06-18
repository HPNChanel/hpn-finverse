/**
 * Avatar Debug Utility
 * Helps debug avatar persistence issues
 */

interface AvatarDebugInfo {
  userContextAvatar: string | null;
  localStorageToken: string | null;
  currentTimestamp: number;
  userFullData: unknown;
}

export const debugAvatarState = (): AvatarDebugInfo => {
  // Get user data from context if available
  const userDataStr = localStorage.getItem('user_data');
  let userData = null;
  try {
    userData = userDataStr ? JSON.parse(userDataStr) : null;
  } catch {
    userData = null;
  }

  return {
    userContextAvatar: userData?.avatar_url || null,
    localStorageToken: localStorage.getItem('access_token'),
    currentTimestamp: Date.now(),
    userFullData: userData
  };
};

export const logAvatarState = (context: string) => {
  console.group(`🔍 Avatar Debug - ${context}`);
  const debug = debugAvatarState();
  console.log('User Avatar URL:', debug.userContextAvatar);
  console.log('Has Token:', !!debug.localStorageToken);
  console.log('Timestamp:', debug.currentTimestamp);
  console.log('Full User Data:', debug.userFullData);
  console.groupEnd();
};

export const testAvatarEndpoint = async () => {
  try {
    const response = await fetch('/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ Avatar endpoint test successful:', userData);
      return userData;
    } else {
      console.error('❌ Avatar endpoint test failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Avatar endpoint test error:', error);
    return null;
  }
};

// Auto-log avatar state changes in development
if (import.meta.env.DEV) {
  // Set up periodic avatar state logging
  let lastAvatarUrl: string | null = null;
  
  setInterval(() => {
    const debug = debugAvatarState();
    if (debug.userContextAvatar !== lastAvatarUrl) {
      console.log(`🔄 Avatar URL changed: ${lastAvatarUrl} → ${debug.userContextAvatar}`);
      lastAvatarUrl = debug.userContextAvatar;
    }
  }, 5000); // Check every 5 seconds
} 