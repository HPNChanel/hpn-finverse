import React, { useState } from 'react';
import {
  Typography,
  Box,
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
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Person as PersonIcon, 
  Lock as LockIcon,
} from '@mui/icons-material';
import { useProfile } from '../../hooks/useProfile';
import { useSnackbar } from '../../hooks';
import { CustomSnackbar } from '../../components/shared';
import { formatDate } from '../../utils/formatters';
import ChangePasswordDialog from '../../components/profile/ChangePasswordDialog';

const Profile: React.FC = () => {
  const { profile, loading, error, updateProfile } = useProfile();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  
  const handleOpenEditDialog = () => {
    setNameValue(profile?.name || '');
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };
  
  const handleCloseChangePasswordDialog = () => {
    setChangePasswordDialogOpen(false);
  };
  
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
  
  const handlePasswordChangeSuccess = () => {
    showSnackbar('Password changed successfully!', 'success');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p:3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<EditIcon />} 
          onClick={handleOpenEditDialog}
        >
          Edit Profile
        </Button>
      </Box>
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
            error={!nameValue}
            helperText={!nameValue ? "Name cannot be empty" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateProfile} disabled={isSubmitting || !nameValue}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={handleCloseChangePasswordDialog}
        onSuccess={handlePasswordChangeSuccess}
      />
      
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </Box>
  );
};

export default Profile;
