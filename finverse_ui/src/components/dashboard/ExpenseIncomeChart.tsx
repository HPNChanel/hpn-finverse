import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  CircularProgress, 
  ToggleButtonGroup, 
  ToggleButton,
  Paper,
  useMediaQuery
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
  Legend
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { useFormatters } from '../../hooks';
import { useCurrency } from '../../contexts/CurrencyContext';
import transactionService from '../../services/transactionService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

type TimeFrame = 'week' | 'month' | 'year';

interface ExpenseIncomeChartProps {
  title?: string;
}

const ExpenseIncomeChart: React.FC<ExpenseIncomeChartProps> = ({ 
  title = 'Income vs Expenses' 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { formatCurrency } = useFormatters();
  const { currency } = useCurrency();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [selectedYear] = useState<number>(new Date().getFullYear()); // Add selectedYear state

  const handleTimeFrameChange = (
    _: React.MouseEvent<HTMLElement>,
    newTimeFrame: TimeFrame | null,
  ) => {
    if (newTimeFrame !== null) {
      setTimeFrame(newTimeFrame);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const stats = await transactionService.getMonthlyStats(selectedYear);
        
        // Process and group transactions based on timeFrame
        let groupedData: MonthlyData[] = [];
        
        if (stats && stats.monthly_data && stats.monthly_data.length > 0) {
          // Convert backend monthly data to chart format
          if (timeFrame === 'year') {
            // Use monthly data directly for year view
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            groupedData = stats.monthly_data.map((monthData, index) => ({
              month: monthNames[index] || `Month ${monthData.month}`,
              income: monthData.income,
              expense: monthData.expense
            }));
          } else {
            // For week/month views, get transactions and process as before
            const transactions = await transactionService.getTransactions();
            
            if (transactions && transactions.length > 0) {
              // Filter transactions by time period
              const now = new Date();
              const filteredTransactions = transactions.filter(tx => {
                const txDate = new Date(tx.transaction_date || tx.created_at);
                if (timeFrame === 'week') {
                  // Last 7 days
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(now.getDate() - 7);
                  return txDate >= oneWeekAgo;
                } else if (timeFrame === 'month') {
                  // Current month
                  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  return txDate >= startOfMonth;
                }
                return false;
              });
              
              // Create a map to aggregate data
              const aggregateMap = new Map<string, { income: number, expense: number }>();
              
              // Process each transaction
              filteredTransactions.forEach(tx => {
                const txDate = new Date(tx.transaction_date || tx.created_at);
                let periodKey: string;
                
                if (timeFrame === 'week') {
                  // Group by day of week
                  const day = txDate.toLocaleDateString('en-US', { weekday: 'short' });
                  periodKey = day;
                } else if (timeFrame === 'month') {
                  // Group by day of month
                  const day = txDate.getDate().toString();
                  periodKey = day;
                }
                
                // Initialize if not exists
                if (!aggregateMap.has(periodKey)) {
                  aggregateMap.set(periodKey, { income: 0, expense: 0 });
                }
                
                const current = aggregateMap.get(periodKey)!;
                
                // Update income or expense based on transaction type
                if (tx.transaction_type === 1 || tx.transaction_type === 'INCOME') {
                  current.income += tx.amount;
                } else if (tx.transaction_type === 0 || tx.transaction_type === 'EXPENSE') {
                  current.expense += tx.amount;
                }
              });
              
              // Convert map to array and sort it
              groupedData = Array.from(aggregateMap.entries()).map(([period, values]) => ({
                month: period,
                income: values.income,
                expense: values.expense
              }));
              
              // Sort based on time period
              if (timeFrame === 'week') {
                const daysOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                groupedData.sort((a, b) => daysOrder.indexOf(a.month) - daysOrder.indexOf(b.month));
              } else if (timeFrame === 'month') {
                groupedData.sort((a, b) => parseInt(a.month) - parseInt(b.month));
              }
            }
          }
        }
        
        setData(groupedData);
      } catch (err) {
        console.error('Failed to fetch transaction data:', err);
        setError('Failed to load transaction data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    // Listen for transaction changes
    const handleTransactionChange = () => {
      fetchData();
    };

    window.addEventListener('transactionCreated', handleTransactionChange);
    window.addEventListener('transactionUpdated', handleTransactionChange);
    window.addEventListener('transactionDeleted', handleTransactionChange);

    return () => {
      window.removeEventListener('transactionCreated', handleTransactionChange);
      window.removeEventListener('transactionUpdated', handleTransactionChange);
      window.removeEventListener('transactionDeleted', handleTransactionChange);
    };
  }, [timeFrame, currency, selectedYear]); // Include selectedYear in dependencies
  
  // Format data for chart
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: data.map(item => item.income),
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.main + '20',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: theme.palette.success.main,
        fill: true,
      },
      {
        label: 'Expenses',
        data: data.map(item => Math.abs(item.expense)),
        borderColor: theme.palette.error.main,
        backgroundColor: theme.palette.error.main + '20',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: theme.palette.error.main,
        fill: true,
      }
    ],
  };
  
  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => formatCurrency(value as number),
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
        }
      },
      tooltip: {
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
  
  return (
    <Paper 
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        display: 'flex', 
        flexDirection: 'column'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        mb: 2
      }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
        
        <ToggleButtonGroup
          value={timeFrame}
          exclusive
          onChange={handleTimeFrameChange}
          aria-label="time frame"
          size="small"
          sx={{ 
            mt: isMobile ? 1 : 0,
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 2
            }
          }}
        >
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
          <ToggleButton value="year">This Year</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ flexGrow: 1, minHeight: 300, position: 'relative' }}>
        {loading ? (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <Typography variant="subtitle1" color="text.secondary">
              {error}
            </Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <Typography variant="subtitle1" color="text.secondary">
              No transaction data available
            </Typography>
          </Box>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </Box>
    </Paper>
  );
};

export default ExpenseIncomeChart;
