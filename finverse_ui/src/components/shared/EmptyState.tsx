import React from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InboxIcon from '@mui/icons-material/Inbox';

type EmptyStateVariant = 'noData' | 'noResults' | 'error' | 'noActivity';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  variant?: EmptyStateVariant;
  compact?: boolean;
  elevation?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  variant = 'noData',
  compact = false,
  elevation = 0
}) => {
  const theme = useTheme();

  // Set default props based on variant
  const getDefaultProps = () => {
    switch (variant) {
      case 'noResults':
        return {
          title: title || 'No Results Found',
          message: message || 'Try adjusting your search or filters to find what you\'re looking for.',
          icon: icon || <SearchOffIcon sx={{ fontSize: compact ? 40 : 64, opacity: 0.7 }} />,
        };
      case 'error':
        return {
          title: title || 'Something Went Wrong',
          message: message || 'An error occurred while loading data. Please try again later.',
          icon: icon || <ErrorOutlineIcon sx={{ fontSize: compact ? 40 : 64, opacity: 0.7 }} />,
          actionLabel: actionLabel || 'Retry',
        };
      case 'noActivity':
        return {
          title: title || 'No Recent Activity',
          message: message || 'There hasn\'t been any activity here yet.',
          icon: icon || <InboxIcon sx={{ fontSize: compact ? 40 : 64, opacity: 0.7 }} />,
        };
      case 'noData':
      default:
        return {
          title: title || 'No Data Available',
          message: message || 'Get started by creating your first entry.',
          icon: icon || <AddCircleOutlineIcon sx={{ fontSize: compact ? 40 : 64, opacity: 0.7 }} />,
          actionLabel: actionLabel || 'Create New',
        };
    }
  };

  const { title: defaultTitle, message: defaultMessage, icon: defaultIcon, actionLabel: defaultActionLabel } = getDefaultProps();

  return (
    <Paper 
      elevation={elevation}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: compact ? 3 : 5,
        width: '100%',
        bgcolor: theme.palette.background.default,
        borderRadius: 2,
        color: theme.palette.text.secondary,
      }}
    >
      {defaultIcon && <Box color="text.secondary" mb={compact ? 1 : 2}>{defaultIcon}</Box>}
      
      <Typography 
        variant={compact ? "subtitle1" : "h6"} 
        component="h3"
        color="text.primary"
        fontWeight={500}
        gutterBottom
      >
        {defaultTitle}
      </Typography>
      
      <Typography 
        variant="body2" 
        component="p" 
        color="text.secondary"
        sx={{ 
          maxWidth: compact ? 300 : 450,
          mb: (defaultActionLabel && onAction) ? 2 : 0 
        }}
      >
        {defaultMessage}
      </Typography>
      
      {defaultActionLabel && onAction && (
        <Button
          variant="contained"
          color="primary"
          size={compact ? "small" : "medium"}
          onClick={onAction}
          startIcon={variant === 'noData' ? <AddCircleOutlineIcon /> : undefined}
          sx={{ mt: compact ? 1 : 2 }}
        >
          {defaultActionLabel}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;
