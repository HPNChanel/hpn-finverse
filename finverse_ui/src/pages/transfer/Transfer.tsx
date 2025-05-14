import React from 'react';
import { Alert, Box, Button, Typography, Divider } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import TransferForm from '../../components/TransferForm';
import TransactionTable from '../../components/TransactionTable';
import { useAccounts, useTransfers, useSnackbar, usePageTitle } from '../../hooks';
import { LoadingOverlay, CustomSnackbar } from '../../components/shared';
import PageLayout from '../../components/layouts/PageLayout';

const Transfer: React.FC = () => {
  usePageTitle('Transfer Funds');
  
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
  const { transactions, loading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransfers();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const loading = accountsLoading || transactionsLoading;
  const error = accountsError || transactionsError;

  // Display only 5 most recent transactions
  const recentTransactions = transactions.slice(0, 5);

  // Handle transfer completion
  const handleTransferComplete = async () => {
    // Refresh both accounts and transactions data
    await Promise.all([fetchAccounts(), fetchTransactions()]);
    showSnackbar('Transfer completed successfully!', 'success');
  };

  return (
    <PageLayout title="Transfer Funds">
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <LoadingOverlay />
      ) : accounts.length < 2 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          You need at least two accounts to make a transfer.
        </Alert>
      ) : (
        <>
          {/* Transfer Form */}
          <TransferForm 
            accounts={accounts} 
            onTransferComplete={handleTransferComplete} 
          />
          
          {/* Recent Transactions Section */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Transactions</Typography>
              <Button 
                component={RouterLink} 
                to="/transactions"
                endIcon={<ArrowForwardIcon />}
              >
                View All Transactions
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TransactionTable transactions={recentTransactions} accounts={accounts} />
          </Box>
        </>
      )}

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </PageLayout>
  );
};

export default Transfer;
