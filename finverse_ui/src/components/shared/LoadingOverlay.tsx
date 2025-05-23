import React from 'react';
import { Backdrop, CircularProgress, Typography, Box, useTheme, alpha } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  opacity?: number;
  withBackdrop?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'absolute' | 'fixed';
  zIndex?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message,
  opacity = 0.7,
  withBackdrop = true,
  size = 'medium',
  position = 'absolute',
  zIndex = 1300,
}) => {
  const theme = useTheme();
  
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56
  };
  
  const progressSize = sizeMap[size];

  if (!open) return null;

  return (
    <Backdrop
      open={open}
      sx={{
        position,
        zIndex,
        bgcolor: withBackdrop ? alpha(theme.palette.background.paper, opacity) : 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress
        size={progressSize}
        thickness={4}
        color="primary"
        sx={{ mb: message ? 2 : 0 }}
      />
      
      {message && (
        <Box
          sx={{
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            borderRadius: theme.shape.borderRadius,
            p: 2,
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.primary">
            {message}
          </Typography>
        </Box>
      )}
    </Backdrop>
  );
};

export default LoadingOverlay;
