import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Savings as SavingsIcon,
  EmojiEvents as GoalIcon,
  TrendingUp as InvestmentIcon
} from '@mui/icons-material';
import { useFormatters } from '../../hooks';
import type { AccountSummary } from '../../types';

// Chart.js components - you'll need to run: npm install react-chartjs-2 chart.js
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

interface TotalSummaryCardProps {
  summary: AccountSummary | null;
  loading: boolean;
}

const TotalSummaryCard: React.FC<TotalSummaryCardProps> = ({ summary, loading }) => {
  const { formatCurrency } = useFormatters();
  const theme = useTheme();

  // If loading, show skeleton
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Skeleton variant="text" width="50%" height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  // If no summary data, return null
  if (!summary) {
    return null;
  }

  // Chart data
  const chartData = {
    labels: ['Wallet', 'Saving', 'Investment', 'Goal'],
    datasets: [
      {
        data: [summary.wallet, summary.saving, summary.investment, summary.goal],
        backgroundColor: [
          '#1976d2', // Blue for wallet
          '#2e7d32', // Green for saving
          '#9c27b0', // Purple for investment
          '#ff9800', // Orange for goal
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
        },
      },
    },
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="medium">
        Account Summary
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left side - Chart */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 250 }}>
            <Pie data={chartData} options={chartOptions} />
          </Box>
        </Grid>
        
        {/* Right side - Summary info */}
        <Grid item xs={12} md={6}>
          <Box mb={2}>
            <Typography variant="subtitle1" color="text.secondary">
              Total Balance
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(summary.total)}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <WalletIcon sx={{ color: '#1976d2', mr: 1 }} />
                <Typography variant="subtitle2">Wallet</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(summary.wallet)}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <SavingsIcon sx={{ color: '#2e7d32', mr: 1 }} />
                <Typography variant="subtitle2">Saving</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(summary.saving)}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <InvestmentIcon sx={{ color: '#9c27b0', mr: 1 }} />
                <Typography variant="subtitle2">Investment</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(summary.investment)}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <GoalIcon sx={{ color: '#ff9800', mr: 1 }} />
                <Typography variant="subtitle2">Goal</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(summary.goal)}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TotalSummaryCard;
