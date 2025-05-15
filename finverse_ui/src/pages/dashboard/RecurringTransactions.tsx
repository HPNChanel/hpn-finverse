import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HomeIcon from '@mui/icons-material/Home';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import { useRecurringTransactions } from '../../hooks/useRecurringTransactions';
import RecurringTransactionForm from '../../components/shared/RecurringTransactionForm';
import { formatFrequency, TransactionType } from '../../services/recurringTransactionService';
import type { 
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate 
} from '../../services/recurringTransactionService';

// Helper function to get the appropriate icon for a category
const getCategoryIcon = (categoryId: number) => {
  const icons = {
    1: <ShoppingCartIcon />,
    2: <DirectionsCarIcon />,
    3: <HomeIcon />,
    4: <RestaurantIcon />,
    5: <AttachMoneyIcon />,
    6: <LocalHospitalIcon />,
    7: <SchoolIcon />,
    8: <MiscellaneousServicesIcon />
  };
  
  return icons[categoryId as keyof typeof icons] || <CategoryIcon />;
};

// Helper function to format a date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const RecurringTransactionsPage = () => {
  const theme = useTheme();
  
  // State for transaction form and help dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom hook for recurring transactions
  const { 
    recurringTransactions, 
    loading, 
    error,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction
  } = useRecurringTransactions();
  
  // Open form for creating new transaction
  const handleCreateTransaction = () => {
    setSelectedTransaction(undefined);
    setIsFormOpen(true);
  };
  
  // Open form for editing transaction
  const handleEditTransaction = (transaction: RecurringTransaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };
  
  // Handle form submission
  const handleFormSubmit = async (data: RecurringTransactionCreate | RecurringTransactionUpdate) => {
    try {
      // Set local loading state
      setIsSubmitting(true);
      
      if (selectedTransaction) {
        await updateRecurringTransaction(selectedTransaction.id, data as RecurringTransactionUpdate);
        setIsFormOpen(false);
        setSnackbarMessage('Recurring transaction updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        await createRecurringTransaction(data as RecurringTransactionCreate);
        setIsFormOpen(false);
        setSnackbarMessage('Recurring transaction created successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      
      // Show error message to user
      if (err instanceof Error) {
        setSnackbarMessage(err.message);
      } else {
        setSnackbarMessage('An error occurred while saving the transaction');
      }
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // Keep form open on error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };
  
  // Cancel deletion
  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };
  
  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (deleteConfirmId !== null) {
      try {
        await deleteRecurringTransaction(deleteConfirmId);
        setDeleteConfirmId(null);
      } catch (err) {
        console.error('Error deleting transaction:', err);
      }
    }
  };
  
  // Toggle help dialog
  const handleToggleHelpDialog = () => {
    setIsHelpDialogOpen(!isHelpDialogOpen);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom sx={{ mr: 2 }}>
            Recurring Transactions
          </Typography>
          <Tooltip title="Learn more about recurring transactions">
            <IconButton color="primary" onClick={handleToggleHelpDialog} size="small">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateTransaction}
        >
          New Transaction
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : recurringTransactions.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No recurring transactions found
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Create your first recurring transaction to automatically manage your regular payments and income.
          </Typography>
          <Button 
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTransaction}
          >
            Create Transaction
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="recurring transactions table">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Next Occurrence</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recurringTransactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Box color={transaction.transaction_type === TransactionType.EXPENSE ? 
                        theme.palette.error.main : 
                        theme.palette.success.main
                      }>
                        {getCategoryIcon(transaction.category_id)}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {transaction.description || 
                      `Recurring ${transaction.transaction_type === TransactionType.INCOME ? 'Income' : 'Expense'}`
                    }
                  </TableCell>
                  <TableCell align="right" sx={{
                    color: transaction.transaction_type === TransactionType.EXPENSE ? 
                      theme.palette.error.main : 
                      theme.palette.success.main,
                    fontWeight: 'bold'
                  }}>
                    {transaction.transaction_type === TransactionType.EXPENSE ? '-' : '+'}
                    ${transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {formatFrequency(transaction.frequency_type, transaction.frequency_value)}
                  </TableCell>
                  <TableCell>{formatDate(transaction.next_occurrence)}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={transaction.is_active ? "Active" : "Inactive"} 
                      color={transaction.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditTransaction(transaction)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteClick(transaction.id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Transaction form dialog */}
      <RecurringTransactionForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        transaction={selectedTransaction}
        title={selectedTransaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
      />
      
      {/* Help dialog */}
      <Dialog open={isHelpDialogOpen} onClose={handleToggleHelpDialog}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <InfoIcon sx={{ mr: 1 }} color="primary" />
            About Recurring Transactions
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography paragraph>
              <strong>Recurring transactions</strong> allow you to automatically schedule regular payments or income.
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              How It Works:
            </Typography>
            
            <Typography component="div" variant="body2">
              <ul>
                <li><strong>Frequency:</strong> Set how often the transaction occurs (daily, weekly, monthly, yearly)</li>
                <li><strong>Specific day:</strong> Choose which day of the week, month, or year</li>
                <li><strong>Active/Inactive:</strong> Toggle to temporarily pause recurring transactions</li>
                <li><strong>End date:</strong> Optionally set when the recurring transaction should stop</li>
              </ul>
            </Typography>
            
            <Typography paragraph variant="body2">
              The system will automatically generate transactions according to your schedule, helping you maintain consistent records of your regular financial activities.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleToggleHelpDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmId !== null} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this recurring transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for success/error messages */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RecurringTransactionsPage;