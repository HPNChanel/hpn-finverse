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
  Tabs,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingDown as ExpenseIcon,
  ArrowUpward as IncomeIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';

import { useAccounts, useTransfers, useFormatters, useCurrency } from '../../hooks';
import { useCurrentMonthStats } from '../../hooks/useCurrentMonthStats';
import { useAuth } from '../../contexts/AuthContext';
import TransactionTable from '../../components/TransactionTable';
import MonthlyIncomeExpenseChart from '../../components/dashboard/MonthlyIncomeExpenseChart';
import type { Account } from '../../utils/importFixes';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { accounts, loading: accountsLoading, error: accountsError, fetchAccounts } = useAccounts();
  const { transactions, loading: transactionsLoading, error: transactionsError, fetchTransactions } = useTransfers();
  const { data: currentMonthStats, loading: statsLoading, refetch: refetchStats } = useCurrentMonthStats();
  const { formatCurrency } = useFormatters();
  const { currency, convertAmount } = useCurrency();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loading = accountsLoading || transactionsLoading || statsLoading;
  const error = accountsError || transactionsError;

  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('Refreshing dashboard data...');
      await Promise.all([
        fetchAccounts(), 
        fetchTransactions(),
        refetchStats()
      ]);
      console.log('Dashboard data refreshed successfully');
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAccounts, fetchTransactions, refetchStats]);

  useEffect(() => {
    refreshData();
  }, [refreshData, currency]);
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Use real data from current month stats instead of calculating from transactions
  const totalIncome = currentMonthStats?.income || 0;
  const totalExpense = currentMonthStats?.expenses || 0;

  console.log('Dashboard render - currentMonthStats:', currentMonthStats);
  console.log('Dashboard render - totalIncome:', totalIncome, 'totalExpense:', totalExpense);

  // Group accounts by type safely
  const accountsByType = accounts.reduce((acc: Record<string, Account[]>, account) => {
    const type = account.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {});

  // Calculate total balance by account type
  const accountTypeBalances = Object.entries(accountsByType).map(([type, accounts]) => ({
    type,
    balance: accounts.reduce((sum, account) => sum + (account.balance || 0), 0),
    count: accounts.length
  })).filter(item => item.balance > 0); // Only show types with balance

  // Helper function to get color for account type
  const getAccountTypeColor = (type: string) => {
    const colors = {
      wallet: theme.palette.primary.main,
      saving: theme.palette.success.main,
      investment: theme.palette.secondary.main,
      goal: theme.palette.warning.main,
      other: theme.palette.info.main
    };
    return colors[type.toLowerCase() as keyof typeof colors] || theme.palette.info.main;
  };

  // Prepare data for account distribution chart
  const distributionData = accountTypeBalances.length > 0 ? {
    labels: accountTypeBalances.map(item => `${item.type} (${item.count})`),
    datasets: [
      {
        data: accountTypeBalances.map(item => item.balance),
        backgroundColor: accountTypeBalances.map(item => getAccountTypeColor(item.type)),
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  } : null;

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
          boxWidth: 12,
          usePointStyle: true,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          }
        }
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const value = context.raw || 0;
            return `${context.label}: ${formatCurrency(convertAmount(value))}`;
          }
        }
      }
    },
    cutout: '60%',
  };

  const handleRefresh = () => {
    refreshData();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Loading skeleton component
  const DashboardSkeleton = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </Box>
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} md={index < 3 ? 4 : 6} key={index}>
            <Skeleton variant="rounded" height={index < 3 ? 180 : 300} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading && accounts.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert 
              severity="error" 
              icon={<ErrorIcon />}
              sx={{ 
                mb: 3, 
                borderRadius: '8px',
                border: `1px solid ${theme.palette.error.main}20`
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRefresh}
                  startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                  disabled={refreshing}
                >
                  {refreshing ? 'Retrying...' : 'Retry'}
                </Button>
              }
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={600}>
            Welcome back, {user?.full_name || user?.name || 'User'}!
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />} 
            onClick={handleRefresh}
            size="small"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[{
            title: 'Total Balance',
            value: formatCurrency(convertAmount(totalBalance)),
            subtitle: `Across ${accounts.length} accounts`,
            icon: <WalletIcon />,
            color: 'primary.main',
            action: () => navigate('/accounts')
          },
          {
            title: 'Monthly Income',
            value: formatCurrency(convertAmount(totalIncome)),
            subtitle: `Current month (${currentMonthStats?.transaction_count || 0} transactions)`,
            icon: <IncomeIcon />,
            color: 'success.main'
          },
          {
            title: 'Monthly Expenses',
            value: formatCurrency(convertAmount(totalExpense)),
            subtitle: 'Current month',
            icon: <ExpenseIcon />,
            color: 'error.main'
          }
        ].map((card, index) => (
            <Grid item xs={12} md={4} key={card.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: '12px', 
                    border: '1px solid', 
                    borderColor: 'divider',
                    height: '100%',
                    cursor: card.action ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    '&:hover': card.action ? {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    } : {}
                  }}
                  onClick={card.action}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box sx={{ color: card.color, mr: 1 }}>
                      {card.icon}
                    </Box>
                    <Typography variant="h6">{card.title}</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {card.subtitle}
                  </Typography>
                  {card.action && (
                    <Button 
                      endIcon={<ArrowForwardIcon />} 
                      sx={{ mt: 2 }}
                      size="small"
                    >
                      View Details
                    </Button>
                  )}
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <Paper elevation={0} sx={{ 
                p: 2, 
                borderRadius: '12px', 
                border: '1px solid', 
                borderColor: 'divider',
                height: 400
              }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Account Distribution</Typography>
                <Box sx={{ height: 300 }}>
                  {distributionData ? (
                    <Pie data={distributionData} options={distributionOptions} />
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Typography variant="h6" color="text.secondary">
                        💳
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        No accounts with balance
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              key={`chart-${currentMonthStats?.year}-${currentMonthStats?.month}`} // Force re-render when data changes
            >
              <MonthlyIncomeExpenseChart />
            </motion.div>
          </Grid>
        </Grid>

        {/* Account Summary Section */}
        {Object.keys(accountsByType).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
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
                    <Fade in={selectedTab === index}>
                      <Grid container spacing={2}>
                        {accountsByType[type].map(account => (
                          <Grid item xs={12} sm={6} md={4} key={account.id}>
                            <Card sx={{ 
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[2]
                              }
                            }}>
                              <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                  {account.name}
                                </Typography>
                                <Typography variant="h6" component="div" fontWeight="bold">
                                  {formatCurrency(convertAmount(account.balance || 0))}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Fade>
                  )}
                </div>
              ))}
            </Paper>
          </motion.div>
        )}

        {/* Recent Transactions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
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
              loading={transactionsLoading}
            />
          </Paper>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Dashboard;
