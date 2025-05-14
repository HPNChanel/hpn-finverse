import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  TablePagination
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import type { InternalTransaction, Account } from '../types';

interface TransactionTableProps {
  transactions: InternalTransaction[];
  accounts: Account[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, accounts }) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get account name by ID
  const getAccountName = (accountId: number): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : `Account #${accountId}`;
  };

  // Display empty state if no transactions
  if (transactions.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Transaction History
        </Typography>
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            No transactions found
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
        Transaction History
      </Typography>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date & Time</TableCell>
              <TableCell>From</TableCell>
              <TableCell></TableCell>
              <TableCell>To</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    {formatDate(transaction.timestamp)}
                  </TableCell>
                  <TableCell>{getAccountName(transaction.from_account_id)}</TableCell>
                  <TableCell>
                    <ArrowForward color="action" fontSize="small" />
                  </TableCell>
                  <TableCell>{getAccountName(transaction.to_account_id)}</TableCell>
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
  );
};

export default TransactionTable; 