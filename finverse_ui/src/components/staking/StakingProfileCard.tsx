import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  Avatar,
  Tooltip,
  Button
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { formatWalletAddress } from '../../utils/stakingUtils';
import { useFormatters } from '../../hooks';

interface StakingProfileCardProps {
  stakingAccount: {
    id: number;
    name: string;
    address: string;
    balance: number;
    created_at: string;
  };
}

const StakingProfileCard: React.FC<StakingProfileCardProps> = ({ stakingAccount }) => {
  const { formatCurrency, formatDate } = useFormatters();
  const [copied, setCopied] = React.useState(false);
  
  // Handle copy wallet address
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(stakingAccount.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <WalletIcon />
          </Avatar>
        }
        title={stakingAccount.name}
        subheader="Staking Account"
        action={
          <Tooltip title={copied ? "Copied!" : "Copy Address"}>
            <Button 
              size="small" 
              startIcon={<CopyIcon />} 
              onClick={handleCopyAddress}
            >
              Copy
            </Button>
          </Tooltip>
        }
      />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Wallet Address
          </Typography>
          <Chip
            label={formatWalletAddress(stakingAccount.address)}
            variant="outlined"
            size="small"
            sx={{ fontFamily: 'monospace', mb: 1 }}
          />
          <Typography variant="caption" display="block" color="text.secondary">
            Created on {formatDate(stakingAccount.created_at)}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Available Balance
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold" color="primary.main">
            {formatCurrency(stakingAccount.balance)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Available for staking
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StakingProfileCard;
