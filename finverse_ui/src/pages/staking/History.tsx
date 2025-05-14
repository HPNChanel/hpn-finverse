import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  TablePagination,
  Button,
  Typography
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { LoadingOverlay, EmptyState } from '../../components/shared';
import transactionService from '../../services/transactionService';
import type { Transaction, TransactionType } from '../../services/transactionService';
import { usePageTitle } from '../../hooks';
import PageLayout from '../../components/layouts/PageLayout';
import { getErrorMessage } from '../../utils/importFixes';

const History: React.FC = () => {
  // Set page title
  usePageTitle('Transaction History');

  const [transactions, setTransactions] = useState<Transaction[] | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionService.getHistory();
      setTransactions(data);
    } catch (err) {
      setError('Failed to fetch transaction history. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
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
      <PageLayout title="Transaction History">
        <LoadingOverlay />
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout title="Transaction History">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained"
          onClick={() => fetchTransactions()}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </PageLayout>
    );
  }
  
  // Empty state
  if (!transactions || transactions.length === 0) {
    return (
      <PageLayout title="Transaction History">
        <EmptyState
          title="No transactions found"
          description="Your transaction history will appear here once you start staking or unstaking tokens."
          sx={{ p: 4, textAlign: 'center' }}
        />
      </PageLayout>
    );
  }
  
  // Pagination
  const paginatedTransactions = transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <PageLayout title="Transaction History">
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
    </PageLayout>
  );
};

export default History;
