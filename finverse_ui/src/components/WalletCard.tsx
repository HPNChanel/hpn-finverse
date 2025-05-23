import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material';
import {
  ContentCopy as CopyIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as BalanceIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useFormatters } from '../hooks';

// Helper to truncate wallet address
const truncateAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

interface WalletCardProps {
  walletAddress?: string;
  balance?: number;
  currency?: string;
  walletName?: string;
}

const WalletCard: React.FC<WalletCardProps> = ({
  walletAddress,
  balance = 0,
  currency = 'FVT',
  walletName = 'My Wallet',
}) => {
  const theme = useTheme<Theme>();
  const { formatCurrency } = useFormatters();
  const [copied, setCopied] = React.useState(false);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card
        sx={{
          borderRadius: theme.shape.borderRadius * 2,
          p: 0,
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 40, 0.65)'
            : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(12px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.8)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(200, 200, 200, 0.2)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            : '0 8px 32px 0 rgba(31, 38, 135, 0.17)',
          transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow', 'transform'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px 0 rgba(0, 0, 0, 0.45)'
              : '0 12px 40px 0 rgba(31, 38, 135, 0.22)',
          }
        }}
      >
        <CardContent sx={{ 
          p: { xs: 2, sm: 2.5, md: 3 },
          position: 'relative',
        }}>
          <Grid container spacing={{xs: 1.5, md: 2}} alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 2, md: 2.5} }}>
            <Grid item xs>
              <Box display="flex" alignItems="center">
                <WalletIcon sx={{ 
                  color: 'primary.main', 
                  mr: 1.5, 
                  fontSize: { xs: '1.8rem', md: '2rem' } 
                }} />
                <Typography variant="h6" component="div" fontWeight={600} noWrap>
                  {walletName}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Tooltip title={copied ? 'Copied!' : 'Copy Address'} placement="top">
                <span>
                  <IconButton
                    onClick={handleCopyAddress}
                    size="small"
                    disabled={!walletAddress}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>

          {walletAddress && (
            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 500 }}>
                Wallet Address
              </Typography>
              <Chip
                label={truncateAddress(walletAddress)}
                variant="outlined"
                size="small"
                onClick={handleCopyAddress}
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.18)',
                  color: 'text.secondary',
                  cursor: 'pointer',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  }
                }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mt: walletAddress ? 0 : { xs: 1, md: 2} }}>
            <BalanceIcon sx={{ 
              color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.main,
              mr: 1.5, 
              fontSize: { xs: '2.2rem', md: '2.5rem' }
            }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" lineHeight={1.2} sx={{ fontWeight: 500 }}>
                Total Balance
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                fontWeight="bold" 
                sx={{ 
                  color: 'text.primary',
                  lineHeight: 1.3,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
                }}
              >
                {formatCurrency(balance, currency)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WalletCard; 