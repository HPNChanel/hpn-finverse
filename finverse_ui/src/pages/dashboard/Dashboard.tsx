import React, { useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Alert, 
  Button, 
  Typography,
  Grid,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAccounts, useTransfers, useFormatters, usePageTitle } from '../../hooks';
import { DashboardSkeleton, EmptyState, LoadingOverlay } from '../../components/shared';
import PageLayout from '../../components/layouts/PageLayout';
import TransactionTable from '../../components/TransactionTable';

const Dashboard: React.FC = () => {
  // Set page title
  usePageTitle('Dashboard');
  
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
  const { transactions, loading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransfers();
  const { formatCurrency } = useFormatters();
  const navigate = useNavigate();

  const loading = accountsLoading || transactionsLoading;
  const error = accountsError || transactionsError;

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchAccounts(), fetchTransactions()]);
  }, [fetchAccounts, fetchTransactions]);

  // Auto-refresh data on a 30-second interval
  useEffect(() => {
    // Initial refresh
    refreshData();
    
    // Set up interval for periodic refreshes
    const refreshInterval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [refreshData]);

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) {
      acc[type] = { count: 0, balance: 0 };
    }
    acc[type].count += 1;
    acc[type].balance += account.balance;
    return acc;
  }, {} as Record<string, { count: number, balance: number }>);

  return (
    <PageLayout title="Financial Dashboard">
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="No accounts found"
          description="You don't have any accounts yet. Create your first account to get started."
          actionLabel="Create Account"
          onAction={() => navigate('/accounts')}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Top Summary Cards */}
          <Grid container spacing={3}>
            {/* Total Balance */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Total Balance
                </Typography>
                <Typography component="p" variant="h4">
                  {formatCurrency(totalBalance)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  across {accounts.length} accounts
                </Typography>
              </Paper>
            </Grid>

            {/* Number of Accounts */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Accounts
                </Typography>
                <Typography component="p" variant="h4">
                  {accounts.length}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button size="small" onClick={() => navigate('/accounts')}>
                    View All Accounts
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Quick Actions
                </Typography>
                <Box>
                  <Button 
                    variant="contained" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => navigate('/transfer')}
                  >
                    Transfer
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => navigate('/budgets')}
                  >
                    Budget
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ mb: 1 }}
                    onClick={() => navigate('/staking')}
                  >
                    Staking
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Account Type Breakdown */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Breakdown
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {Object.entries(accountsByType).map(([type, data]) => (
                <Grid item xs={6} sm={3} key={type}>
                  <Typography variant="subtitle1" color="text.secondary">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(data.balance)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {data.count} account{data.count !== 1 ? 's' : ''}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
          
          {/* Recent Transactions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {transactionsLoading ? (
              <LoadingOverlay height="200px" />
            ) : transactions.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                description="Your transaction history will appear here."
                actionLabel="Make a Transfer"
                onAction={() => navigate('/transfer')}
              />
            ) : (
              <TransactionTable 
                transactions={transactions.slice(0, 5)} 
                accounts={accounts} 
              />
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/transactions')}>
                View All Transactions
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </PageLayout>
  );
};

export default Dashboard;
