import React, { useEffect, useCallback, useState } from 'react';
import {
  Box,
  Alert,
  Typography,
  Grid,
  Paper,
  Button,
  useTheme,
  Skeleton,
  Card,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingDown as ExpenseIcon,
  ArrowUpward as IncomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

import { useAccounts, useTransfers, useFormatters, useCurrency } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import TransactionTable from '../../components/TransactionTable';


// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
  const { transactions, loading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransfers();
  const { formatCurrency } = useFormatters();
  const { currency, convertAmount } = useCurrency();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  const loading = accountsLoading || transactionsLoading;
  const error = accountsError || transactionsError;

  const refreshData = useCallback(async () => {
    try {
      await Promise.all([fetchAccounts(), fetchTransactions()]);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
      // Error will be handled by individual hooks
    }
  }, [fetchAccounts, fetchTransactions]);

  useEffect(() => {
    refreshData();
  }, [refreshData, currency]);
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Calculate income/expense statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Add a check for transactions existing before using them
  const thisMonthTransactions = transactions ? transactions.filter(t => {
    if (!t.timestamp) return false;
    const date = new Date(t.timestamp);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }) : [];
  
  const totalIncome = thisMonthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = thisMonthTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Group accounts by type
  const accountsByType = accounts.reduce((acc: Record<string, Account[]>, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  // Calculate total balance by account type
  const accountTypeBalances = Object.entries(accountsByType).map(([type, accounts]) => ({
    type,
    balance: accounts.reduce((sum, account) => sum + account.balance, 0),
    count: accounts.length
  }));

  // Helper function to get color for account type
  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wallet': return theme.palette.primary.main;
      case 'saving': return theme.palette.success.main;
      case 'investment': return theme.palette.secondary.main;
      case 'goal': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };

  // Prepare data for account distribution chart
  const distributionData = {
    labels: accountTypeBalances.map(item => `${item.type} (${item.count})`),
    datasets: [
      {
        data: accountTypeBalances.map(item => item.balance),
        backgroundColor: accountTypeBalances.map(item => getAccountTypeColor(item.type)),
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for monthly spending chart (example data, you would replace with real data)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const spendingData = {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: months.map(() => Math.random() * 5000),
        backgroundColor: theme.palette.success.main,
      },
      {
        label: 'Expenses',
        data: months.map(() => Math.random() * 3000),
        backgroundColor: theme.palette.error.main,
      },
    ],
  };

  const handleRefresh = () => {
    refreshData();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (loading && accounts.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} md={index < 3 ? 4 : 6} key={index}>
              <Skeleton variant="rounded" height={index < 3 ? 180 : 300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: '8px' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Dashboard
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: '12px', 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%'
          }}>
            <Box display="flex" alignItems="center" mb={1}>
              <WalletIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Total Balance</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
              {formatCurrency(convertAmount(totalBalance))}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Across {accounts.length} accounts
            </Typography>
            <Button 
              endIcon={<ArrowForwardIcon />} 
              onClick={() => navigate('/accounts')} 
              sx={{ mt: 2 }}
              size="small"
            >
              View Accounts
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: '12px', 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%'
          }}>
            <Box display="flex" alignItems="center" mb={1}>
              <IncomeIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h6">Monthly Income</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 2 }}>
              {formatCurrency(convertAmount(totalIncome))}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Current month
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: '12px', 
            border: '1px solid', 
            borderColor: 'divider',
            height: '100%'
          }}>
            <Box display="flex" alignItems="center" mb={1}>
              <ExpenseIcon sx={{ color: 'error.main', mr: 1 }} />
              <Typography variant="h6">Monthly Expenses</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ mt: 2 }}>
              {formatCurrency(convertAmount(totalExpense))}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Current month
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: '12px', 
            border: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Account Distribution</Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={distributionData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: '12px', 
            border: '1px solid', 
            borderColor: 'divider' 
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Monthly Income & Expenses</Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={spendingData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Account Summary Section */}
      <Paper elevation={0} sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: '12px', 
        border: '1px solid', 
        borderColor: 'divider' 
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            aria-label="account tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {Object.keys(accountsByType).map((type, index) => (
              <Tab 
                key={type} 
                label={`${type.charAt(0).toUpperCase() + type.slice(1)} (${accountsByType[type].length})`} 
                id={`account-tab-${index}`}
                aria-controls={`account-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {Object.keys(accountsByType).map((type, index) => (
          <div
            key={type}
            role="tabpanel"
            hidden={selectedTab !== index}
            id={`account-tabpanel-${index}`}
            aria-labelledby={`account-tab-${index}`}
          >
            {selectedTab === index && (
              <Grid container spacing={2}>
                {accountsByType[type].map(account => (
                  <Grid item xs={12} sm={6} md={4} key={account.id}>
                    <Card sx={{ 
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          {account.name}
                        </Typography>
                        <Typography variant="h6" component="div" fontWeight="bold">
                          {formatCurrency(convertAmount(account.balance))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </div>
        ))}
      </Paper>

      {/* Recent Transactions Section */}
      <Paper elevation={0} sx={{ 
        p: 2, 
        borderRadius: '12px', 
        border: '1px solid', 
        borderColor: 'divider' 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Transactions</Typography>
          <Button 
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/transactions/history')}
            disabled={loading}
          >
            View All
          </Button>
        </Box>
        
        {transactionsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {transactionsError}
            <Button 
              size="small" 
              color="inherit" 
              sx={{ ml: 2 }} 
              onClick={() => fetchTransactions()}
            >
              Retry
            </Button>
          </Alert>
        )}
        
        <TransactionTable 
          transactions={transactions.slice(0, 5)} 
          accounts={accounts}
          loading={loading}
        />
      </Paper>
    </Box>
  );
};

export default Dashboard;
