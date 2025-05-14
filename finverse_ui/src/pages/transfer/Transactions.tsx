import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  TablePagination, 
  TableSortLabel,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAccounts, useTransfers, usePageTitle } from '../../hooks';
import { LoadingOverlay } from '../../components/shared';
import PageLayout from '../../components/layouts/PageLayout';
import { formatDate, formatCurrency } from '../../utils/formatters';

type SortDirection = 'asc' | 'desc';
type SortField = 'timestamp' | 'amount' | 'from_account_id' | 'to_account_id';

const Transactions: React.FC = () => {
  usePageTitle('Transaction History');
  
  // Hooks
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransfers();
  
  // State for table sorting
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState<number | 'all'>('all');
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Loading and error states
  const loading = accountsLoading || transactionsLoading;
  const error = accountsError || transactionsError;

  // Handle sort request
  const handleRequestSort = (property: SortField) => {
    const isAsc = sortField === property && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(property);
  };

  // Filter transactions based on search and account filter
  const filteredTransactions = transactions.filter(transaction => {
    // Account filter check
    const matchesAccount = 
      accountFilter === 'all' || 
      transaction.from_account_id === accountFilter || 
      transaction.to_account_id === accountFilter;
    
    // Search term check (search in note)
    const matchesSearch = transaction.note 
      ? transaction.note.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    
    // If there's no search term, only apply account filter
    return matchesAccount && (searchTerm ? matchesSearch : true);
  });
  
  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // Determine direction multiplier
    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
    
    // Sort by selected field
    switch(sortField) {
      case 'timestamp':
        return directionMultiplier * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case 'amount':
        return directionMultiplier * (a.amount - b.amount);
      case 'from_account_id':
      case 'to_account_id':
        const aName = getAccountName(a[sortField]);
        const bName = getAccountName(b[sortField]);
        return directionMultiplier * aName.localeCompare(bName);
      default:
        return 0;
    }
  });
  
  // Paginate transactions
  const paginatedTransactions = sortedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Get account name by ID
  const getAccountName = (accountId: number): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : `Account #${accountId}`;
  };
  
  // Get account type color
  const getAccountTypeColor = (accountId: number): string => {
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) return 'default';
    
    switch (account.type) {
      case 'wallet':
        return 'primary';
      case 'saving':
        return 'success';
      case 'investment':
        return 'secondary';
      case 'goal':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setAccountFilter('all');
    setPage(0);
  };
  
  // Render account filters
  const renderAccountFilters = () => {
    return (
      <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="account-filter-label">Account Filter</InputLabel>
        <Select
          labelId="account-filter-label"
          value={accountFilter}
          onChange={(e) => {
            setAccountFilter(e.target.value as number | 'all');
            setPage(0);
          }}
          label="Account Filter"
        >
          <MenuItem value="all">All Accounts</MenuItem>
          {accounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name} ({account.type})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };
  
  return (
    <PageLayout title="Transaction History">
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <LoadingOverlay />
      ) : (
        <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Filter Bar */}
          <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search in notes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, maxWidth: 300 }}
            />
            
            {renderAccountFilters()}
            
            {(searchTerm || accountFilter !== 'all') && (
              <Chip 
                icon={<FilterIcon />} 
                label="Clear Filters" 
                variant="outlined" 
                onClick={handleClearFilters} 
              />
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Typography variant="body2" color="text.secondary">
              {filteredTransactions.length} transactions found
            </Typography>
          </Box>
          
          <Divider />
          
          {/* Transaction Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortField === 'timestamp' ? sortDirection : false}>
                    <TableSortLabel
                      active={sortField === 'timestamp'}
                      direction={sortField === 'timestamp' ? sortDirection : 'asc'}
                      onClick={() => handleRequestSort('timestamp')}
                    >
                      Date & Time
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortField === 'from_account_id' ? sortDirection : false}>
                    <TableSortLabel
                      active={sortField === 'from_account_id'}
                      direction={sortField === 'from_account_id' ? sortDirection : 'asc'}
                      onClick={() => handleRequestSort('from_account_id')}
                    >
                      From
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>To</TableCell>
                  <TableCell 
                    sortDirection={sortField === 'amount' ? sortDirection : false}
                    align="right"
                  >
                    <TableSortLabel
                      active={sortField === 'amount'}
                      direction={sortField === 'amount' ? sortDirection : 'asc'}
                      onClick={() => handleRequestSort('amount')}
                    >
                      Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        {formatDate(transaction.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            label={getAccountName(transaction.from_account_id)} 
                            size="small"
                            color={getAccountTypeColor(transaction.from_account_id) as any}
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            label={getAccountName(transaction.to_account_id)} 
                            size="small"
                            color={getAccountTypeColor(transaction.to_account_id) as any}
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color="success.main"
                        >
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {transaction.note ? (
                          <Typography variant="body2" color="text.secondary">
                            {transaction.note}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontStyle="italic">
                            No note
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        No transactions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTransactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </PageLayout>
  );
};

export default Transactions;
