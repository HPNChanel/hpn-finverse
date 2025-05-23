import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  useTheme,
  Chip,
  Skeleton,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SwapHoriz as SwapHorizIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Transaction, Account } from '../../types';
import { useFormatters } from '../../hooks';
import { TransactionTypeEnum } from '../../types/transactionTypes';

interface UnifiedTransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  loading?: boolean;
  title?: string;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: number) => Promise<void> | void;
}

const UnifiedTransactionTable: React.FC<UnifiedTransactionTableProps> = ({
  transactions,
  accounts,
  loading = false,
  title = 'Transactions',
  onEdit,
  onDelete
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { formatCurrency, formatDate } = useFormatters();
  const navigate = useNavigate();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Get account name by id with improved error handling
  const getAccountName = (id?: number): string => {
    if (id === undefined || id === null) return 'N/A';
    const account = accounts.find(acc => acc.id === id);
    return account ? account.name : `Account #${id}`;
  };

  // Transaction type mapping helper
  const getTransactionTypeInfo = (type: string | number) => {
    // Handle numeric transaction types (from backend enum)
    if (typeof type === 'number' || !isNaN(Number(type))) {
      const numericType = Number(type);
      
      switch (numericType) {
        case TransactionTypeEnum.EXPENSE: // 0
          return { 
            icon: <ArrowDownwardIcon fontSize="small" />, 
            color: theme.palette.error.main,
            label: 'Expense'
          };
        case TransactionTypeEnum.INCOME: // 1
          return { 
            icon: <ArrowUpwardIcon fontSize="small" />, 
            color: theme.palette.success.main,
            label: 'Income'
          };
        default:
          break;
      }
    }
    
    // Handle string-based transaction types
    if (typeof type === 'string') {
      const upperType = type.toUpperCase();
      
      switch (upperType) {
        case 'INCOME':
          return { 
            icon: <ArrowUpwardIcon fontSize="small" />, 
            color: theme.palette.success.main,
            label: 'Income'
          };
        case 'EXPENSE':
          return { 
            icon: <ArrowDownwardIcon fontSize="small" />, 
            color: theme.palette.error.main,
            label: 'Expense'
          };
        case 'TRANSFER':
          return { 
            icon: <SwapHorizIcon fontSize="small" />, 
            color: theme.palette.info.main,
            label: 'Transfer'
          };
      }
    }
    
    // Default case for unknown types
    return { 
      icon: <ErrorOutlineIcon fontSize="small" />, 
      color: theme.palette.text.secondary,
      label: type !== undefined && type !== null ? String(type) : 'Unknown'
    };
  };

  // Handle edit click
  const handleEditClick = (transaction: Transaction) => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  // Handle delete click - open confirmation dialog
  const handleDeleteClick = (id: number) => {
    setSelectedTransactionId(id);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (selectedTransactionId !== null && onDelete) {
      setDeleteInProgress(true);
      try {
        await onDelete(selectedTransactionId);
      } finally {
        setDeleteInProgress(false);
        setDeleteDialogOpen(false);
        setSelectedTransactionId(null);
      }
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    if (!deleteInProgress) {
      setDeleteDialogOpen(false);
      setSelectedTransactionId(null);
    }
  };

  // If loading, show skeleton
  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: '12px',
          border: '1px solid',
          borderColor: theme => theme.palette.divider
        }}
      >
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                {!isMobile && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={150} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell align="right"><Skeleton width={80} /></TableCell>
                  {!isMobile && (
                    <TableCell align="right">
                      <Skeleton width={80} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  // If no transactions, show empty state
  if (transactions.length === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: theme => theme.palette.divider
        }}
      >
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box py={3}>
          <Typography variant="body1" color="text.secondary">
            No transactions found
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/transactions')}
          >
            Create Transaction
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: '12px',
        border: '1px solid',
        borderColor: theme => theme.palette.divider,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6">{title}</Typography>
      </Box>

      <TableContainer>
        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              {!isMobile && <TableCell>Description</TableCell>}
              <TableCell>Account</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => {
              // Get transaction type information with better handling
              const typeInfo = getTransactionTypeInfo(transaction.transaction_type);
              
              // Determine which account to show (wallet_id first, then account_id)
              let accountDisplay = '';
              if (transaction.wallet_id) {
                accountDisplay = getAccountName(transaction.wallet_id);
              } else if (transaction.account_id) {
                accountDisplay = getAccountName(transaction.account_id);
              } else if (transaction.from_account_id && transaction.to_account_id) {
                // Handle transfers specifically
                accountDisplay = `${getAccountName(transaction.from_account_id)} → ${getAccountName(transaction.to_account_id)}`;
              } else {
                accountDisplay = 'N/A';
              }
              
              // Determine description to display with fallbacks
              const description = transaction.description || transaction.category || '-';
              
              // Get transaction date with fallbacks
              const transactionDate = transaction.transaction_date || transaction.timestamp || transaction.created_at;
              
              // Determine if this is an expense (for amount display)
              const isExpense = transaction.transaction_type === 0 || transaction.transaction_type === 'EXPENSE';
              
              return (
                <TableRow 
                  key={transaction.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    {transactionDate ? formatDate(transactionDate) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={typeInfo.label}
                      sx={{
                        backgroundColor: `${typeInfo.color}20`,
                        color: typeInfo.color,
                        '& .MuiChip-label': { px: 1 }
                      }}
                      icon={React.cloneElement(typeInfo.icon as React.ReactElement, {
                        style: { color: typeInfo.color }
                      })}
                    />
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Tooltip title={transaction.description || ''}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {description}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell>
                    <Tooltip title={accountDisplay}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: isMobile ? 100 : 150, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {accountDisplay}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'medium',
                        color: isExpense 
                          ? theme.palette.error.main 
                          : theme.palette.success.main
                      }}
                    >
                      {isExpense ? '-' : ''}
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {onEdit && (
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditClick(transaction)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(transaction.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="delete-transaction-dialog-title"
      >
        <DialogTitle id="delete-transaction-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={deleteInProgress}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={deleteInProgress}
            startIcon={deleteInProgress ? <CircularProgress size={20} /> : null}
          >
            {deleteInProgress ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UnifiedTransactionTable;