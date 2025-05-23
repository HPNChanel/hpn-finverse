import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardActionArea, 
  Typography, 
  LinearProgress, 
  Icon, 
  useTheme 
} from '@mui/material';
import type { Account } from '../../utils/importFixes';
import { useFormatters } from '../../hooks';

interface AccountSummaryCardProps {
  account: Account;
  onClick?: (accountId: number) => void;
  maxBalance?: number;
}

const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({ 
  account, 
  onClick,
  maxBalance
}) => {
  const theme = useTheme();
  const { formatCurrency } = useFormatters();

  // Calculate percentage for the progress bar if maxBalance is provided
  const percentage = maxBalance ? Math.min((account.balance / maxBalance) * 100, 100) : null;
  
  // Get color based on account type
  const getAccountColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'wallet':
        return theme.palette.primary.main;
      case 'saving':
        return theme.palette.success.main;
      case 'investment':
        return theme.palette.secondary.main;
      case 'goal':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };
  
  // Get icon based on account type
  const getAccountIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'wallet':
        return 'account_balance_wallet';
      case 'saving':
        return 'savings';
      case 'investment':
        return 'trending_up';
      case 'goal':
        return 'emoji_events';
      default:
        return 'payment';
    }
  };
  
  // Handle card click
  const handleClick = () => {
    if (onClick) {
      onClick(account.id);
    }
  };
  
  const accountColor = account.color || getAccountColor(account.type);
  const accountIcon = account.icon || getAccountIcon(account.type);
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? { 
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
          borderColor: 'transparent'
        } : {}
      }}
    >
      <CardActionArea 
        onClick={handleClick} 
        disabled={!onClick}
        sx={{ p: 0.75 }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={1.5}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${accountColor}22`, // Add transparency
                color: accountColor,
                mr: 1.5
              }}
            >
              <Icon>{accountIcon}</Icon>
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography 
                variant="subtitle1" 
                fontWeight="medium" 
                sx={{ lineHeight: 1.2 }}
                noWrap
              >
                {account.name}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ textTransform: 'capitalize' }}
              >
                {account.type}
              </Typography>
            </Box>
          </Box>
          
          <Typography 
            variant="h5" 
            fontWeight="bold" 
            sx={{ mb: 1 }}
          >
            {formatCurrency(account.balance)}
          </Typography>
          
          {percentage !== null && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={percentage} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.12)' 
                    : 'rgba(0,0,0,0.08)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: accountColor
                  }
                }} 
              />
            </Box>
          )}
          
          {account.note && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                mt: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {account.note}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AccountSummaryCard;
