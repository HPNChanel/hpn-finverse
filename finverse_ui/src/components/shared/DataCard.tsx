import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Divider,
  Skeleton,
  useTheme,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface DataCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  elevation?: number;
  minHeight?: number | string;
  sx?: Record<string, any>;
  headerSx?: Record<string, any>;
  contentSx?: Record<string, any>;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  action,
  content,
  footer,
  isLoading = false,
  elevation = 1,
  minHeight,
  sx = {},
  headerSx = {},
  contentSx = {},
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={elevation}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: minHeight,
        ...sx,
      }}
    >
      <CardHeader
        title={
          isLoading ? (
            <Skeleton variant="text" width="60%" height={24} />
          ) : (
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          )
        }
        subheader={
          subtitle && (
            isLoading ? (
              <Skeleton variant="text" width="40%" height={20} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )
          )
        }
        action={
          action || (
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          )
        }
        sx={{
          p: 2,
          pb: 1,
          ...headerSx,
        }}
      />
      
      <Divider />

      <CardContent
        sx={{
          flexGrow: 1,
          p: 2,
          pt: 2,
          ...contentSx,
        }}
      >
        {isLoading ? (
          <Box sx={{ width: '100%', height: '100%', minHeight: 120 }}>
            <Skeleton variant="rectangular" width="100%" height={120} />
            <Box sx={{ pt: 2 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="70%" />
            </Box>
          </Box>
        ) : (
          content
        )}
      </CardContent>

      {footer && (
        <>
          <Divider />
          <CardActions
            sx={{
              p: 2,
              pt: 1,
              justifyContent: 'space-between',
            }}
          >
            {footer}
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default DataCard;
