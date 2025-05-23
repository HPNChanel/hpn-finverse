import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar, 
  Divider, 
  Skeleton,
  useTheme,
  Chip
} from '@mui/material';
import { 
  ArrowForward as ArrowForwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Account, Transaction } from '../../utils/importFixes';
import { useFormatters } from '../../hooks';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  accounts: Account[];
  loading?: boolean;
  maxItems?: number;
}

const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({ 
  transactions, 
  accounts, 
  loading = false,
  maxItems = 5
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { formatCurrency, formatDate } = useFormatters();
  
  // Helper to find account by ID
  const findAccount = (id: number): Account | undefined => {
    return accounts.find(account => account.id === id);
  };
  
  // Limit number of transactions to display
  const limitedTransactions = transactions.slice(0, maxItems);
  
  // Handle view all transactions
  const handleViewAll = () => {
    navigate('/transactions');
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <ArrowUpwardIcon fontSize="small" />;
      case 'EXPENSE':
        return <ArrowDownwardIcon fontSize="small" />;
      case 'TRANSFER':
        return <SwapHorizIcon fontSize="small" />;
      default:
        return null;
    }
  };

  // Get transaction color based on type
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return theme.palette.success.main;
      case 'EXPENSE':
        return theme.palette.error.main;
      case 'TRANSFER':
        return theme.palette.info.main;
      default:
        return theme.palette.text.primary;
    }
  };
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardHeader
        title="Recent Transactions"
        action={
          <Button 
            endIcon={<ArrowForwardIcon />}
            onClick={handleViewAll}
            size="small"
          >
            View All
          </Button>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1, pb: 1, flexGrow: 1 }}>
        {loading ? (
          // Show skeleton when loading
          <List disablePadding>
            {[...Array(maxItems)].map((_, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ py: 1.5 }}>
                  <Skeleton variant="circular" width={36} height={36} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                  <Skeleton variant="text" width={80} height={24} sx={{ ml: 2 }} />
                </ListItem>
                {index < maxItems - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : transactions.length === 0 ? (
          // Show message when no transactions
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            minHeight: 150
          }}>
            <Typography variant="subtitle1" color="text.secondary">
              No recent transactions
            </Typography>
          </Box>
        ) : (
          // Show transactions list
          <List disablePadding>
            {limitedTransactions.map((transaction, index) => {
              const isTransfer = transaction.from_account_id && transaction.to_account_id;
              const fromAccount = isTransfer ? findAccount(transaction.from_account_id!) : undefined;
              const toAccount = isTransfer ? findAccount(transaction.to_account_id!) : undefined;
              const account = !isTransfer ? findAccount(transaction.account_id!) : undefined;
              
              // Get color based on transaction type
              const transactionColor = getTransactionColor(transaction.transaction_type);
              
              // Get display text based on transaction type
              let displayText = '';
              let accountAvatar = '';
              
              if (isTransfer && fromAccount && toAccount) {
                // Transfer transaction
                displayText = `${fromAccount.name} → ${toAccount.name}`;
                accountAvatar = fromAccount.name.charAt(0).toUpperCase();
              } else if (account) {
                // Income or expense transaction
                displayText = `${account.name} - ${transaction.category || transaction.transaction_type}`;
                accountAvatar = account.name.charAt(0).toUpperCase();
              } else {
                // Fallback if account not found
                displayText = transaction.description || transaction.transaction_type;
                accountAvatar = '#';
              }
              
              return (
                <React.Fragment key={transaction.id}>
                  <ListItem sx={{ py: 1.5, px: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        mr: 2,
                        bgcolor: transactionColor,
                        color: theme.palette.getContrastText(transactionColor),
                        fontSize: '0.875rem',
                      }}
                    >
                      {getTransactionIcon(transaction.transaction_type) || accountAvatar}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {displayText}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {formatDate(transaction.timestamp || transaction.created_at)}
                          {transaction.description && ` · ${transaction.description}`}
                        </Typography>
                      }
                      sx={{ my: 0 }}
                    />
                    <Box sx={{ ml: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        color={
                          transaction.transaction_type === 'EXPENSE' 
                            ? theme.palette.error.main 
                            : transaction.transaction_type === 'INCOME'
                              ? theme.palette.success.main
                              : theme.palette.text.primary
                        }
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {transaction.transaction_type === 'EXPENSE' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                      <Chip 
                        label={transaction.transaction_type} 
                        size="small"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.625rem',
                          mt: 0.5,
                          backgroundColor: `${transactionColor}20`,
                          color: transactionColor,
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </Box>
                  </ListItem>
                  {index < limitedTransactions.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactionsCard;
