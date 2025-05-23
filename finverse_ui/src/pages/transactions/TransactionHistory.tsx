import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Button,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { useSnackbar } from '../../hooks';
import { useAccounts } from '../../hooks';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layouts';
import { CustomSnackbar } from '../../components/shared';
import UnifiedTransactionTable from '../../components/transactions/UnifiedTransactionTable';
import type { TransactionFilters } from '../../services/transactionService';
import { format } from 'date-fns';

const TransactionHistory: React.FC = () => {
  const { transactions, loading, error, fetchHistory, deleteTransaction } = useTransactionHistory();
  const { accounts } = useAccounts();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Apply filters to the API call
  useEffect(() => {
    const fetchWithFilters = async () => {
      const filters: TransactionFilters = {};
      
      if (filterType) {
        filters.transaction_type = filterType;
      }
      
      if (filterAccount) {
        filters.account_id = filterAccount;
      }
      
      if (filterDateFrom) {
        filters.date_from = format(filterDateFrom, 'yyyy-MM-dd');
      }
      
      if (filterDateTo) {
        filters.date_to = format(filterDateTo, 'yyyy-MM-dd');
      }
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      await fetchHistory(filters);
    };
    
    fetchWithFilters();
  }, [fetchHistory, filterType, filterAccount, filterDateFrom, filterDateTo, searchTerm]);

  // Filter transactions locally for additional filtering not handled by the API
  const filteredTransactions = transactions.filter(() => {
    // Additional client-side filtering if needed
    return true;
  });

  // Pagination
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleCreateNewTransaction = () => {
    navigate('/transactions/create');
  };

  const handleDeleteClick = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId === null) return;
    
    setIsDeleting(true);
    try {
      await deleteTransaction(confirmDeleteId);
      showSnackbar('Transaction deleted successfully', 'success');
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to delete transaction',
        'error'
      );
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <PageContainer 
      title="Transaction History" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Transaction History', path: '/transactions/history' }
      ]}
    >
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h1">Transaction History</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateNewTransaction}
          >
            Create New Transaction
          </Button>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: '12px',
            border: '1px solid',
            borderColor: theme => theme.palette.divider
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              placeholder="Search transactions..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: '300px' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton 
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              color={isFilterExpanded ? "primary" : "default"}
            >
              <FilterIcon />
            </IconButton>
          </Box>

          {isFilterExpanded && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="account-filter-label">Filter by Account</InputLabel>
                  <Select
                    labelId="account-filter-label"
                    id="account-filter"
                    value={filterAccount}
                    label="Filter by Account"
                    onChange={(e) => setFilterAccount(e.target.value as number | '')}
                  >
                    <MenuItem value="">All Accounts</MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="type-filter-label">Transaction Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    id="type-filter"
                    value={filterType}
                    label="Transaction Type"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="INCOME">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowUpwardIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                        Income
                      </Box>
                    </MenuItem>
                    <MenuItem value="EXPENSE">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowDownwardIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                        Expense
                      </Box>
                    </MenuItem>
                    <MenuItem value="TRANSFER">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SwapHorizIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                        Transfer
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={filterDateFrom}
                    onChange={(date) => setFilterDateFrom(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To Date"
                    value={filterDateTo}
                    onChange={(date) => setFilterDateTo(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <UnifiedTransactionTable 
            transactions={paginatedTransactions}
            accounts={accounts}
            loading={loading}
            title={`Transactions (${filteredTransactions.length})`}
            onDelete={handleDeleteClick}
          />
        )}

        {filteredTransactions.length > rowsPerPage && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTransactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onClose={handleCancelDelete}
        aria-labelledby="delete-transaction-dialog"
      >
        <DialogTitle id="delete-transaction-dialog">
          Confirm Delete Transaction
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelDelete} 
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            disabled={isDeleting}
            startIcon={isDeleting && <CircularProgress size={16} />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </PageContainer>
  );
};

export default TransactionHistory;