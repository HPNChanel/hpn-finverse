import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardHeader,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Helper to truncate wallet address
const truncateAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

interface WalletCardProps {
  balance?: number;
}

const WalletCard: React.FC<WalletCardProps> = ({ balance = 0 }) => {
  const { walletAddress } = useAuth();
  const [copied, setCopied] = React.useState(false);

  // Copy wallet address to clipboard
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader
        avatar={<WalletIcon color="primary" />}
        title="Wallet"
        subheader="Your Wallet Details"
        action={
          <Tooltip title={copied ? 'Copied!' : 'Copy Address'}>
            <IconButton onClick={handleCopyAddress} size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Address
          </Typography>
          <Chip
            label={truncateAddress(walletAddress)}
            variant="outlined"
            size="small"
            sx={{ fontFamily: 'monospace' }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Balance
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {balance.toFixed(4)} FVT
          </Typography>
          <Typography variant="caption" color="text.secondary">
            FinVerse Tokens
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WalletCard; 