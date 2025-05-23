import React, { useState, useMemo } from 'react';
import { Paper, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Alert, Chip, Tooltip, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { useTransactionHistory, usePageTitle } from '../../hooks';
import type { Transaction } from '../../services/transactionService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { LoadingOverlay } from '../../components/shared';

const StakingHistoryPage: React.FC = () => {
  usePageTitle('Staking Transaction History');
  const { transactions, loading, error } = useTransactionHistory();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [transactions, page, rowsPerPage]);

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return <Alert severity="error" sx={{m: 2}}>{String(error)}</Alert>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <>
        <Box textAlign="center" sx={{ py: 5 }}>
          <Typography variant="h6">No Staking Transactions Found</Typography>
          <Typography color="text.secondary">
            There are no staking-related transactions recorded yet.
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Staking Transaction Log
        </Typography>
        <TableContainer>
          <Table stickyHeader aria-label="staking transaction history table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount (FVT)</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((tx: Transaction) => (
                <TableRow hover key={tx.id}>
                  <TableCell>{formatDate(tx.timestamp)}</TableCell>
                  <TableCell>
                    <Chip 
                        label={tx.transaction_type}
                        size="small"
                        color={tx.transaction_type === 'STAKE' ? 'success' : tx.transaction_type === 'UNSTAKE' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{tx.description || 'N/A'}</TableCell>
                  <TableCell align="right">{formatCurrency(tx.amount, 'FVT')}</TableCell>
                  <TableCell align="center">
                    <Chip 
                        label={'Completed'} 
                        size="small"
                        color={'success'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton component={RouterLink} to={`/transactions/${tx.id}`} size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={transactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </>
  );
};

export default StakingHistoryPage;
