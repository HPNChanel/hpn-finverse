import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton,
  Menu,
  MenuItem,
  CardActionArea,
  CardActions,
  Stack,
  Divider 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RepeatIcon from '@mui/icons-material/Repeat';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import { formatFrequency, TransactionType } from '../../services/recurringTransactionService';
import type { RecurringTransaction } from '../../services/recurringTransactionService';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const AmountTypography = styled(Typography)<{ transactionType: number }>(
  ({ theme, transactionType }) => ({
    fontWeight: 600,
    color: transactionType === TransactionType.INCOME 
      ? theme.palette.success.main 
      : theme.palette.error.main,
  })
);

type RecurringTransactionCardProps = {
  transaction: RecurringTransaction;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (transactionId: number) => void;
  onProcess: (transaction: RecurringTransaction) => void;
};

const RecurringTransactionCard: React.FC<RecurringTransactionCardProps> = ({ 
  transaction, 
  onEdit, 
  onDelete,
  onProcess
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleEdit = () => {
    handleMenuClose();
    onEdit(transaction);
  };
  
  const handleDelete = () => {
    handleMenuClose();
    onDelete(transaction.id);
  };
  
  const handleProcess = () => {
    handleMenuClose();
    onProcess(transaction);
  };
  
  const handleCardClick = () => {
    onEdit(transaction);
  };
  
  // Format the next occurrence date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Determine status chip color and label
  const getStatusChip = () => {
    if (!transaction.is_active) {
      return <Chip size="small" label="Inactive" color="default" />;
    }
    
    const today = new Date();
    const nextDate = new Date(transaction.next_occurrence);
    
    if (nextDate <= today) {
      return <Chip size="small" label="Due Now" color="error" />;
    } else {
      // Calculate days until next occurrence
      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) {
        return <Chip size="small" label="Due Soon" color="warning" />;
      } else {
        return <Chip size="small" label="Upcoming" color="info" />;
      }
    }
  };
  
  return (
    <StyledCard>
      <CardActionArea onClick={handleCardClick}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {transaction.description || `Recurring ${transaction.transaction_type === TransactionType.INCOME ? 'Income' : 'Expense'}`}
            </Typography>
            <Box>
              {getStatusChip()}
            </Box>
          </Box>
          
          <Stack spacing={1} mb={2}>
            <Box display="flex" alignItems="center">
              <AttachMoneyIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
              <AmountTypography variant="body1" transactionType={transaction.transaction_type}>
                ${transaction.amount.toFixed(2)}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {transaction.transaction_type === TransactionType.INCOME ? 'Income' : 'Expense'}
                </Typography>
              </AmountTypography>
            </Box>
            
            <Box display="flex" alignItems="center">
              <RepeatIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
              <Typography variant="body2">
                {formatFrequency(transaction.frequency_type, transaction.frequency_value)}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center">
              <CalendarTodayIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
              <Typography variant="body2">
                Next occurrence: {formatDate(transaction.next_occurrence)}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center">
              <AccountBalanceWalletIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
              <Typography variant="body2">
                Account ID: {transaction.wallet_id}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center">
              <CategoryIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
              <Typography variant="body2">
                Category ID: {transaction.category_id}
              </Typography>
            </Box>
          </Stack>
          
          {transaction.end_date && (
            <Typography variant="caption" color="text.secondary">
              Ends on: {formatDate(transaction.end_date)}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton 
          aria-label="Transaction Options" 
          onClick={handleMenuClick}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>Edit</MenuItem>
          <MenuItem onClick={handleProcess}>Process Now</MenuItem>
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
        </Menu>
      </CardActions>
    </StyledCard>
  );
};

export default RecurringTransactionCard; 