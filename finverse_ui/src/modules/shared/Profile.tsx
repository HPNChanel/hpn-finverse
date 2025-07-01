import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { profileService, ProfileUpdateData, PasswordUpdateData } from '@/services/profileService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Loader2, Camera, Save, Lock, Upload, RefreshCw, User as UserIcon } from 'lucide-react';
import { useApiError } from '@/utils/errorHandler.tsx';
import { useToast } from '@/hooks/use-toast';
import { logAvatarState, testAvatarEndpoint } from '@/utils/avatarDebug';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const { handleError } = useApiError();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [avatarTimestamp, setAvatarTimestamp] = useState<number>(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state - ensure controlled inputs with proper defaults
  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    name: '', // Initialize with empty string
  });

  // Password form state - ensure controlled inputs with proper defaults
  const [passwordData, setPasswordData] = useState<PasswordUpdateData>({
    old_password: '',
    new_password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update profileData and currentAvatarUrl when user data changes
  useEffect(() => {
    if (user) {
      logAvatarState('Profile component user effect');
      
      setProfileData({
        name: user.name || '',
      });
      
      // Only update avatar URL if it's different from current (prevent unnecessary re-renders)
      if (user.avatar_url !== currentAvatarUrl) {
        console.log(`🔄 Avatar URL updating: ${currentAvatarUrl} → ${user.avatar_url}`);
        setCurrentAvatarUrl(user.avatar_url || null);
        // Update timestamp to force cache refresh when avatar URL changes
        if (user.avatar_url) {
          setAvatarTimestamp(Date.now());
        }
      }
    }
  }, [user, currentAvatarUrl]);

  // Load user data on component mount (ensures avatar is loaded on page reload)
  useEffect(() => {
    const loadUserData = async () => {
      if (!user && !isLoading) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to load user data on mount:', error);
        }
      }
    };
    
    loadUserData();
  }, [user, isLoading, refreshUser]); // Include dependencies

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await profileService.updateProfile(profileData);
      await refreshUser();
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Update profile');
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);

    // Validate passwords match
    if (passwordData.new_password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match. Please try again.",
        variant: "destructive",
      });
      setIsPasswordLoading(false);
      return;
    }

    // Validate password length
    if (passwordData.new_password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsPasswordLoading(false);
      return;
    }

    try {
      await profileService.updatePassword(passwordData);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setPasswordData({ old_password: '', new_password: '' });
      setConfirmPassword('');
    } catch (err) {
      const errorMessage = handleError(err, 'Update password');
      toast({
        title: "Password Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 5MB. Please choose a smaller image.",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsAvatarLoading(true);

    try {
      // Upload avatar and get response with new avatar URL
      const response = await profileService.updateAvatar(file);
      
      console.log('Avatar upload response:', response); // Debug log
      
      // Update local state immediately with the new avatar URL
      if (response.avatar_url) {
        setCurrentAvatarUrl(response.avatar_url);
        setAvatarTimestamp(Date.now()); // Force cache bust
        console.log('Updated avatar URL:', response.avatar_url); // Debug log
      }
      
      // Clear preview since we now have the uploaded image
      setAvatarPreview(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh user context to sync everything (but don't await to prevent race conditions)
      refreshUser().catch(console.error);
      
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Update avatar');
      toast({
        title: "Avatar Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleCancelAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRefreshAvatar = async () => {
    setIsAvatarLoading(true);
    try {
      logAvatarState('Before refresh avatar');
      await refreshUser();
      setAvatarTimestamp(Date.now()); // Force cache bust
      logAvatarState('After refresh avatar');
      toast({
        title: "Avatar Refreshed",
        description: "Avatar has been refreshed from server.",
      });
    } catch {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleTestAvatarEndpoint = async () => {
    const userData = await testAvatarEndpoint();
    if (userData) {
      toast({
        title: "Endpoint Test Successful",
        description: `Avatar URL: ${userData.avatar_url || 'None'}`,
      });
    } else {
      toast({
        title: "Endpoint Test Failed",
        description: "Check console for details.",
        variant: "destructive",
      });
    }
  };

  const getAvatarSrc = () => {
    // Priority: 1. Preview (if selecting new image), 2. Current avatar URL with cache busting
    if (avatarPreview) {
      return avatarPreview;
    }
    
    if (currentAvatarUrl) {
      // Use the avatar URL as-is since Vite proxy will handle /uploads requests
      const fullAvatarUrl = currentAvatarUrl;
      
      // Add cache-busting timestamp to prevent caching issues
      const separator = fullAvatarUrl.includes('?') ? '&' : '?';
      return `${fullAvatarUrl}${separator}t=${avatarTimestamp}`;
    }
    
    return undefined;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDefaultAvatarContent = () => {
    if (user?.name) {
      return getUserInitials(user.name);
    }
    if (user?.email) {
      return getUserInitials(user.email);
    }
    return <UserIcon className="h-12 w-12" />;
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile</CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-start space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={getAvatarSrc()}
                    alt={user.name || user.email}
                    key={`avatar-${avatarTimestamp}`} // Force re-render when timestamp changes
                  />
                  <AvatarFallback className="text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {getDefaultAvatarContent()}
                  </AvatarFallback>
                </Avatar>
                {!avatarPreview && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAvatarLoading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                  aria-label="Select avatar image"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium break-words">{user.name || user.email}</h3>
                <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
                
                {/* Avatar Upload Controls */}
                {avatarPreview && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleAvatarUpload}
                      disabled={isAvatarLoading}
                    >
                      {isAvatarLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelAvatar}
                      disabled={isAvatarLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                {/* Avatar Refresh Controls - Only show if user has an avatar and no preview */}
                {!avatarPreview && currentAvatarUrl && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefreshAvatar}
                      disabled={isAvatarLoading}
                    >
                      {isAvatarLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Avatar
                        </>
                      )}
                    </Button>
                    {import.meta.env.DEV && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestAvatarEndpoint}
                      >
                        Test Endpoint
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Change Password</span>
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password">Current Password</Label>
                <Input
                  id="old_password"
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  placeholder="Enter current password"
                  disabled={isPasswordLoading}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Enter new password"
                    disabled={isPasswordLoading}
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isPasswordLoading}
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
