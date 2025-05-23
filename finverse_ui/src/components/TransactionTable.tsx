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
  TablePagination,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
  Skeleton,
  Tooltip
} from '@mui/material';
import {
  ArrowForward,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { InternalTransaction, Account } from '../types';
import { motion } from 'framer-motion';
import { useFormatters } from '../hooks';

interface TransactionTableProps {
  transactions: InternalTransaction[];
  accounts: Account[];
  loading?: boolean;
  title?: string;
}

interface MobileTransactionRowProps {
  transaction: InternalTransaction;
  accounts: Account[];
  getAccountName: (id: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: string) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Single Row for Mobile View (Card-like)
const MobileTransactionRow: React.FC<MobileTransactionRowProps> = ({
  transaction,
  accounts,
  getAccountName,
  formatCurrency,
  formatDate,
  isExpanded,
  onToggleExpand,
}) => {
  const theme = useTheme();
  const fromAccount = accounts.find((acc: Account) => acc.id === transaction.from_account_id);
  const currency = fromAccount?.currency || 'USD';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: theme.shape.borderRadius * 1.5,
          border: '1px solid',
          borderColor: theme.palette.divider,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          '&:last-child': { mb: 0 },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" onClick={onToggleExpand} sx={{ cursor: 'pointer' }}>
          <Box>
            <Typography variant="body2" fontWeight="500" noWrap>
              {transaction.note || 'Transaction'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(transaction.timestamp)}
            </Typography>
          </Box>
          <Box textAlign="right" sx={{ml:1}}>
            <Typography
              variant="body1"
              fontWeight="bold"
              color={transaction.amount > 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(transaction.amount, currency)}
            </Typography>
            <IconButton size="small" sx={{ p:0, ml: 0.5 }}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ pt: 1.5, mt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
            <Typography variant="body2" gutterBottom>
              <strong>From:</strong> {getAccountName(transaction.from_account_id)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>To:</strong> {getAccountName(transaction.to_account_id)}
            </Typography>
            {transaction.note && (
              <Typography variant="caption" color="text.secondary">
                Note: {transaction.note}
              </Typography>
            )}
          </Box>
        </Collapse>
      </Paper>
    </motion.div>
  );
};

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, accounts, loading, title = "Transaction History" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { formatCurrency, formatDate } = useFormatters();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [expandedRow, setExpandedRow] = React.useState<number | null>(null);

  const handleToggleExpand = (transactionId: number) => {
    setExpandedRow(expandedRow === transactionId ? null : transactionId);
  };

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
    return account ? account.name : `Account #${accountId.toString().slice(0,4)}...`;
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const currentTransactions = transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          borderRadius: theme.shape.borderRadius * 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.65)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(10px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.5)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(200, 200, 200, 0.2)',
          boxShadow: theme.palette.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.3)' : '0 6px 20px rgba(100,100,100,0.12)',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0, opacity: 0.7 }}>
          {title}
        </Typography>
        <Box sx={{ p: {xs: 0, sm: 1} }}>
          {[...Array(rowsPerPage)].map((_, i) => (
            isMobile ? (
              <Skeleton key={i} variant="rectangular" height={70} sx={{ mb: 1.5, borderRadius: theme.shape.borderRadius * 1.5 }} />
            ) : (
              <Skeleton key={i} variant="rectangular" height={53} sx={{ mb: '1px' }}/>
            )
          ))}
        </Box>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rowsPerPage}
          rowsPerPage={rowsPerPage}
          page={0}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
          sx={{ opacity: 0.5 }}
        />
      </Paper>
    );
  }

  // Display empty state if no transactions
  if (transactions.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
          borderRadius: theme.shape.borderRadius * 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.65)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(10px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.5)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(200, 200, 200, 0.2)',
          boxShadow: theme.palette.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.3)' : '0 6px 20px rgba(100,100,100,0.12)',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ opacity: 0.8 }}>
          {title}
        </Typography>
        <Box py={4}>
          <Typography variant="body1" color="text.secondary">
            No transactions found.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: theme.shape.borderRadius * 2,
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.65)' : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(10px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.5)',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(200, 200, 200, 0.2)',
        boxShadow: theme.palette.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.3)' : '0 6px 20px rgba(100,100,100,0.12)',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ p: {xs: 1.5, sm:2, md:2.5}, pb: {xs:1, sm:1.5}, opacity: 0.9 }}>
        {title}
      </Typography>

      {isMobile ? (
        <Box sx={{ p: { xs: 1.5, sm: 2}, pt: 0 }}>
          {currentTransactions.map((transaction) => (
            <MobileTransactionRow
              key={transaction.id}
              transaction={transaction}
              accounts={accounts}
              getAccountName={getAccountName}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              isExpanded={expandedRow === transaction.id}
              onToggleExpand={() => handleToggleExpand(transaction.id)}
            />
          ))}
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size={isTablet ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Date & Time</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>From</TableCell>
                {!isTablet && <TableCell />}
                <TableCell sx={{ whiteSpace: 'nowrap' }}>To</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Amount</TableCell>
                {!isTablet && <TableCell>Note</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentTransactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={index}
                  style={{ display: 'table-row' }}
                >
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title={new Date(transaction.timestamp).toLocaleString()}>
                      <span>{formatDate(transaction.timestamp)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{getAccountName(transaction.from_account_id)}</TableCell>
                  {!isTablet && (
                    <TableCell sx={{p:0.5}}>
                      <ArrowForward color="action" fontSize="small" sx={{ opacity: 0.7 }}/>
                    </TableCell>
                  )}
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{getAccountName(transaction.to_account_id)}</TableCell>
                  <TableCell 
                    align="right" 
                    sx={{
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold',
                      color: transaction.amount > 0 ? theme.palette.success.main : theme.palette.error.main
                    }}
                  >
                    {formatCurrency(transaction.amount, accounts.find(acc => acc.id === transaction.from_account_id)?.currency || 'USD')}
                  </TableCell>
                  {!isTablet && (
                    <TableCell sx={{maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {transaction.note ? (
                        <Tooltip title={transaction.note} placement="top-start">
                           <Typography variant="body2" color="text.secondary" sx={{cursor: 'default'}}>
                            {transaction.note}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          No note
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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