import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Skeleton,
  useTheme,
  Tooltip,
  IconButton,
  Stack,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  isLoading?: boolean;
  isCurrency?: boolean;
  tooltipText?: string;
  onClick?: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading = false,
  isCurrency = false,
  tooltipText,
  onClick,
  color = 'primary',
}) => {
  const theme = useTheme();

  const formatValue = (): string => {
    if (typeof value === 'string') return value;
    
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    return value.toLocaleString();
  };

  const renderTrendIcon = () => {
    if (trend === undefined) return null;
    
    const iconProps = { fontSize: 'small' as const };
    
    if (trend > 0) {
      return <TrendingUpIcon {...iconProps} sx={{ color: 'success.main' }} />;
    } else if (trend < 0) {
      return <TrendingDownIcon {...iconProps} sx={{ color: 'error.main' }} />;
    } else {
      return <TrendingFlatIcon {...iconProps} sx={{ color: 'text.secondary' }} />;
    }
  };

  const trendText = trend !== undefined 
    ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` 
    : '';

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: `${color}.main`,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  fontWeight={500}
                >
                  {title}
                </Typography>
                {tooltipText && (
                  <Tooltip title={tooltipText} arrow placement="top">
                    <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Box>
            
            {icon && (
              <Box 
                sx={{ 
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${color}.light`,
                  color: `${color}.main`,
                }}
              >
                {icon}
              </Box>
            )}
          </Box>
          
          {/* Value */}
          {isLoading ? (
            <Skeleton variant="text" width="60%" height={40} />
          ) : (
            <Typography 
              variant="h4" 
              component="div" 
              fontWeight={700}
              color="text.primary"
            >
              {formatValue()}
            </Typography>
          )}
          
          {/* Trend and subtitle */}
          {(subtitle || trend !== undefined) && (
            <Stack direction="row" alignItems="center" spacing={1}>
              {renderTrendIcon()}
              
              {isLoading ? (
                <Skeleton variant="text" width={80} />
              ) : (
                <Typography 
                  variant="body2" 
                  color={
                    trend !== undefined
                      ? trend > 0 
                        ? 'success.main' 
                        : trend < 0 
                          ? 'error.main' 
                          : 'text.secondary'
                      : 'text.secondary'
                  }
                  fontWeight={500}
                >
                  {subtitle || trendText}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StatCard;
