import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  IconButton
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Person as PersonIcon, 
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useProfile } from '../../hooks/useProfile';
import { useSnackbar, usePageTitle } from '../../hooks';
import PageLayout from '../../components/layouts/PageLayout';
import { CustomSnackbar } from '../../components/shared';
import { formatDate } from '../../utils/formatters';
import profileService from '../../services/profileService';
import ChangePasswordDialog from '../../components/profile/ChangePasswordDialog';

const Profile: React.FC = () => {
  usePageTitle('My Profile');
  
  const { profile, loading, error, updateProfile } = useProfile();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  
  // Name edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password change state
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  
  // Open edit dialog
  const handleOpenEditDialog = () => {
    setNameValue(profile?.name || '');
    setEditDialogOpen(true);
  };
  
  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };
  
  // Open password change dialog
  const handleOpenChangePasswordDialog = () => {
    setOldPassword('');
    setNewPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setPasswordError(null);
    setChangePasswordDialogOpen(true);
  };
  
  // Close password change dialog
  const handleCloseChangePasswordDialog = () => {
    setChangePasswordDialogOpen(false);
    // Clear sensitive data
    setOldPassword('');
    setNewPassword('');
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    
    try {
      const success = await updateProfile({ name: nameValue });
      
      if (success) {
        showSnackbar('Profile updated successfully!', 'success');
        handleCloseEditDialog();
      } else {
        showSnackbar('Failed to update profile', 'error');
      }
    } catch (error) {
      console.error(error);
      showSnackbar('An unexpected error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    // Validate inputs
    if (!oldPassword || !newPassword) {
      setPasswordError('Both fields are required');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    try {
      setPasswordError(null);
      setSubmittingPassword(true);
      
      await profileService.changePassword(oldPassword, newPassword);
      
      // Close dialog and show success message
      handleCloseChangePasswordDialog();
      showSnackbar('Password changed successfully!', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.status === 400) {
        setPasswordError('Incorrect current password');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setSubmittingPassword(false);
    }
  };
  
  const handlePasswordChangeSuccess = () => {
    showSnackbar('Password changed successfully!', 'success');
  };

  if (loading) {
    return (
      <PageLayout title="My Profile">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }
  
  if (error) {
    return (
      <PageLayout title="My Profile">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout 
      title="My Profile" 
      action={
        <Button 
          variant="contained" 
          startIcon={<EditIcon />} 
          onClick={handleOpenEditDialog}
        >
          Edit Profile
        </Button>
      }
    >
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
              }
              title={
                <Typography variant="h5">
                  {profile?.name || profile?.username}
                </Typography>
              }
              subheader={`@${profile?.username}`}
            />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Username
                </Typography>
                <Typography variant="body1">
                  {profile?.username}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Display Name
                </Typography>
                <Typography variant="body1">
                  {profile?.name || <Typography color="text.secondary" component="span">Not set</Typography>}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {profile?.created_at ? formatDate(profile.created_at) : '-'}
                </Typography>
              </Box>
              
              {/* Password Change Button */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<LockIcon />} 
                  onClick={() => setChangePasswordDialogOpen(true)}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            type="text"
            fullWidth
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            disabled={isSubmitting}
            variant="outlined"
            helperText="This is the name displayed to other users"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateProfile} 
            color="primary" 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
      
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </PageLayout>
  );
};

export default Profile;
