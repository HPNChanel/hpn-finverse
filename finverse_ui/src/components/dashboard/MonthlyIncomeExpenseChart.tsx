import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  CircularProgress, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  Skeleton,
  Stack,
  Chip
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormatters } from '../../hooks';
import { useMonthlyStats } from '../../hooks/useMonthlyStats';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyIncomeExpenseChartProps {
  title?: string;
}

const MonthlyIncomeExpenseChart: React.FC<MonthlyIncomeExpenseChartProps> = ({ 
  title = 'Monthly Income & Expenses' 
}) => {
  const theme = useTheme();
  const { formatCurrency } = useFormatters();
  const { data, loading, error, selectedYear, changeYear, refetch } = useMonthlyStats();
  
  // Listen for transaction changes to refresh chart data
  useEffect(() => {
    const handleTransactionChange = () => {
      console.log('Transaction change detected in chart, refetching...');
      refetch();
    };

    // Add event listener for transaction changes
    window.addEventListener('transactionCreated', handleTransactionChange);
    window.addEventListener('transactionUpdated', handleTransactionChange);
    window.addEventListener('transactionDeleted', handleTransactionChange);

    return () => {
      window.removeEventListener('transactionCreated', handleTransactionChange);
      window.removeEventListener('transactionUpdated', handleTransactionChange);
      window.removeEventListener('transactionDeleted', handleTransactionChange);
    };
  }, [refetch]);

  // Generate year options (current year and 2 previous years)
  const yearOptions = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  
  // Month labels
  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Format data for chart with debugging
  const chartData = data ? {
    labels: monthLabels,
    datasets: [
      {
        label: 'Income',
        data: data.monthly_data.map((item) => {
          console.log(`Month ${item.month} income: ${item.income}`);
          return item.income;
        }),
        borderColor: theme.palette.success.main,
        backgroundColor: `${theme.palette.success.main}20`,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: theme.palette.success.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        fill: false,
      },
      {
        label: 'Expenses',
        data: data.monthly_data.map((item) => {
          console.log(`Month ${item.month} expense: ${item.expense}`);
          return item.expense;
        }),
        borderColor: theme.palette.error.main,
        backgroundColor: `${theme.palette.error.main}20`,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: theme.palette.error.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        fill: false,
      }
    ],
  } : null;
  
  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
          callback: (value) => formatCurrency(value as number),
          maxTicksLimit: 6,
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
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
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${formatCurrency(value as number)}`;
          }
        }
      }
    },
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 3 }}>
        {[1, 2, 3].map((i) => (
          <Box key={i}>
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton variant="text" width={100} height={24} />
          </Box>
        ))}
      </Box>
      <Skeleton variant="rectangular" width="100%" height={300} />
    </Box>
  );
  
  return (
    <Paper 
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingSkeleton />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ padding: 16 }}
          >
            <Alert 
              severity="error" 
              action={
                <button 
                  onClick={refetch}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'inherit', 
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              }
            >
              {error}
            </Alert>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6" fontWeight="medium">
                {title}
              </Typography>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => changeYear(Number(e.target.value))}
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Summary stats */}
            {data && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`Income: ${formatCurrency(data.total_income)}`}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                  <Chip 
                    label={`Expenses: ${formatCurrency(data.total_expense)}`}
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                  <Chip 
                    label={`Net: ${formatCurrency(data.net_income)}`}
                    color={data.net_income >= 0 ? "success" : "error"}
                    variant="filled"
                    size="small"
                  />
                </Stack>
              </motion.div>
            )}
            
            {/* Chart */}
            <Box sx={{ flexGrow: 1, minHeight: 300, position: 'relative' }}>
              {!data || data.monthly_data.length === 0 ? (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Typography variant="h6" color="text.secondary">
                    📊
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" textAlign="center">
                    No transaction data available for {selectedYear}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Start adding transactions to see your financial trends
                  </Typography>
                </Box>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  style={{ height: '100%' }}
                >
                  <Line data={chartData!} options={chartOptions} />
                </motion.div>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Paper>
  );
};

export default MonthlyIncomeExpenseChart;
