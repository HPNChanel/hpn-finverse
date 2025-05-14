import React from 'react';
import { Snackbar, Alert, type SnackbarProps } from '@mui/material';
import type { SnackbarSeverity } from '../../hooks/useSnackbar';

interface CustomSnackbarProps extends Omit<SnackbarProps, 'onClose'> {
  message: string;
  severity: SnackbarSeverity;
  onClose: () => void;
}

const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  ...props
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      {...props}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        elevation={6}
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;
