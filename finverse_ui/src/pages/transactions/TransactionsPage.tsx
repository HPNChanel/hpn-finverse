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
  Grid
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { PageContainer } from '../../components/layouts';
import TransactionTable from '../../components/TransactionTable';
import { useTransfers } from '../../hooks';
import { useAccounts } from '../../hooks';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TransactionsPage: React.FC = () => {
  const { transactions, loading, error, fetchTransactions } = useTransfers();
  const { accounts } = useAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState<number | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    const searchTermMatch = searchTerm === '' ||
      (transaction.note && transaction.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Account filter
    const accountMatch = filterAccount === '' || 
      transaction.from_account_id === filterAccount || 
      transaction.to_account_id === filterAccount;
    
    // Date range filter
    let dateMatch = true;
    const transactionDate = new Date(transaction.timestamp);
    
    if (filterDateFrom) {
      dateMatch = dateMatch && transactionDate >= filterDateFrom;
    }
    
    if (filterDateTo) {
      const toDateEnd = new Date(filterDateTo);
      toDateEnd.setHours(23, 59, 59, 999);
      dateMatch = dateMatch && transactionDate <= toDateEnd;
    }
    
    return searchTermMatch && accountMatch && dateMatch;
  });

  return (
    <PageContainer title="Transaction History">
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
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="account-filter-label">Filter by Account</InputLabel>
                <Select
                  labelId="account-filter-label"
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
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={filterDateFrom}
                  onChange={(date) => setFilterDateFrom(date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
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
        <TransactionTable 
          transactions={filteredTransactions} 
          accounts={accounts}
          title={`Transactions (${filteredTransactions.length})`}
        />
      )}
    </PageContainer>
  );
};

export default TransactionsPage;
