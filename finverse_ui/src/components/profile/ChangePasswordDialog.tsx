import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import profileService from '../../services/profileService';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ 
  open, 
  onClose, 
  onSuccess 
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle dialog close with cleanup
  const handleClose = () => {
    if (isSubmitting) return;
    
    // Clear sensitive data
    setOldPassword('');
    setNewPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setError(null);
    onClose();
  };

  // Handle password change
  const handleChangePassword = async () => {
    // Validate inputs
    if (!oldPassword || !newPassword) {
      setError('Both fields are required');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    
    try {
      setError(null);
      setIsSubmitting(true);
      
      await profileService.changePassword(oldPassword, newPassword);
      
      // Clear form
      setOldPassword('');
      setNewPassword('');
      
      // Notify parent and close
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.response?.status === 400) {
        setError('Incorrect current password');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ mt: 1 }}>
          <TextField
            margin="dense"
            label="Current Password"
            type={showOldPassword ? "text" : "password"}
            fullWidth
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            disabled={isSubmitting}
            variant="outlined"
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  edge="end"
                >
                  {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting}
            variant="outlined"
            helperText="Password must be at least 6 characters"
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleChangePassword} 
          color="primary" 
          disabled={isSubmitting || !oldPassword || !newPassword}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Changing...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
