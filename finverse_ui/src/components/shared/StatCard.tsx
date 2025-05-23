import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Skeleton,
  useTheme,
  Tooltip,
  IconButton
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
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    
    return value.toLocaleString();
  };

  const renderTrendIcon = () => {
    if (trend === undefined) return null;
    
    if (trend > 0) {
      return <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
    } else if (trend < 0) {
      return <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.error.main }} />;
    } else {
      return <TrendingFlatIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />;
    }
  };

  const trendText = trend !== undefined 
    ? `${trend > 0 ? '+' : ''}${trend}% from previous period` 
    : '';

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        } : {},
        borderLeft: 4,
        borderColor: `${color}.main`,
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Box display="flex" alignItems="center">
              <Typography 
                variant="subtitle2" 
                color="textSecondary" 
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                {title}
              </Typography>
              
              {tooltipText && (
                <Tooltip title={tooltipText} arrow placement="top">
                  <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            {isLoading ? (
              <Skeleton variant="text" width={120} height={40} />
            ) : (
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  my: 0.5
                }}
              >
                {formatValue()}
              </Typography>
            )}
            
            {(subtitle || trend !== undefined) && (
              <Box display="flex" alignItems="center" mt={0.5}>
                {renderTrendIcon()}
                
                {isLoading ? (
                  <Skeleton variant="text" width={80} />
                ) : (
                  <Typography 
                    variant="body2" 
                    color={
                      trend > 0 
                        ? 'success.main' 
                        : trend < 0 
                          ? 'error.main' 
                          : 'textSecondary'
                    }
                    sx={{ ml: trend !== undefined ? 0.5 : 0 }}
                  >
                    {subtitle || trendText}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          
          {icon && (
            <Box 
              sx={{ 
                display: 'flex',
                p: 1,
                borderRadius: 1,
                bgcolor: `${color}.lighter`,
                color: `${color}.main`,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
