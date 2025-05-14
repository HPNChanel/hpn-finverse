import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TablePagination,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import transactionService from '../services/transactionService';
import type { Transaction, TransactionType } from '../services/transactionService';

const History: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await transactionService.getHistory();
        setTransactions(data);
      } catch (_) {
        setError('Failed to fetch transaction history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get transaction status chip
  const getTransactionChip = (type: TransactionType) => {
    switch (type) {
      case 'STAKE':
        return (
          <Chip
            icon={<TrendingUpIcon fontSize="small" />}
            label="Stake"
            color="primary"
            size="small"
          />
        );
      case 'UNSTAKE':
        return (
          <Chip
            icon={<TrendingDownIcon fontSize="small" />}
            label="Unstake"
            color="secondary"
            size="small"
          />
        );
      default:
        return <Chip label={type} size="small" />;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Empty state
  if (transactions.length === 0 && !error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transaction History
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No transactions found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Your transaction history will appear here once you start staking or unstaking tokens.
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  // Pagination
  const paginatedTransactions = transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Transaction History
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace' }}>
                    {transaction.id}
                  </TableCell>
                  <TableCell>{getTransactionChip(transaction.transaction_type)}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={transaction.transaction_type === 'STAKE' ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {transaction.transaction_type === 'STAKE' ? '+' : '-'}
                      {transaction.amount.toFixed(4)} FVT
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={transactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default History; 