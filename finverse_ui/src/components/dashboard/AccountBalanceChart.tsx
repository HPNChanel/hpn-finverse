import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import type { Account } from '../../utils/importFixes';
import { useFormatters } from '../../hooks';

interface AccountBalanceChartProps {
  accounts: Account[];
  maxItems?: number;
}

const AccountBalanceChart: React.FC<AccountBalanceChartProps> = ({ accounts, maxItems = 6 }) => {
  const theme = useTheme();
  const { formatCurrency } = useFormatters();
  
  // Get the most significant accounts up to maxItems
  const significantAccounts = [...accounts]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, maxItems);
  
  // Calculate other accounts' balances if there are more accounts than maxItems
  const otherAccountsBalance = accounts.length > maxItems 
    ? accounts
      .sort((a, b) => b.balance - a.balance)
      .slice(maxItems)
      .reduce((sum, account) => sum + account.balance, 0)
    : 0;
    
  // Prepare chart data
  const chartData = {
    labels: [
      ...significantAccounts.map(account => account.name),
      ...(otherAccountsBalance > 0 ? ['Other Accounts'] : [])
    ],
    datasets: [{
      data: [
        ...significantAccounts.map(account => account.balance),
        ...(otherAccountsBalance > 0 ? [otherAccountsBalance] : [])
      ],
      backgroundColor: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.error.main,
        theme.palette.grey[500], // For "Other Accounts"
      ],
      borderWidth: 1,
      borderColor: theme.palette.background.paper,
    }]
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
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
          boxWidth: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    cutout: '65%',
  };
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  if (accounts.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Typography variant="subtitle1" color="text.secondary">
          No accounts available
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ position: 'relative', height: 300 }}>
      <Doughnut data={chartData} options={chartOptions} />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '100%',
          maxWidth: '100px',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Total
        </Typography>
        <Typography variant="h6" fontWeight="bold">
          {formatCurrency(totalBalance)}
        </Typography>
      </Box>
    </Box>
  );
};

export default AccountBalanceChart;
