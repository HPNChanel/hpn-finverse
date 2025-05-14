import React from 'react';
import { Typography, Grid, Box } from '@mui/material';
import AccountCard from './AccountCard'; // Fixed the import path
import { CardSkeleton, EmptyState } from '../shared';
import type { Account } from '../../types';
import type { SxProps, Theme } from '@mui/material';

interface AccountGroupSectionProps {
  title: string;
  type: string;
  accounts: Account[];
  loading: boolean;
  onUpdateAccount: () => void;
  sx?: SxProps<Theme>;
}

const AccountGroupSection: React.FC<AccountGroupSectionProps> = ({
  title,
  type,
  accounts,
  loading,
  onUpdateAccount,
  sx
}) => {
  // Filter accounts by type
  const filteredAccounts = accounts.filter(account => account.type === type);
  
  if (loading) {
    return (
      <Box sx={{ mb: 5, ...sx }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <CardSkeleton count={3} />
      </Box>
    );
  }
  
  if (filteredAccounts.length === 0) {
    return (
      <Box sx={{ mb: 5, ...sx }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <EmptyState
          title={`No ${type} accounts found`}
          description={`Create a new ${type} account to get started`}
          sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}
        />
      </Box>
    );
  }
  
  return (
    <Box sx={{ mb: 5, ...sx }}>
      <Typography variant="h6" gutterBottom>
        {title} ({filteredAccounts.length})
      </Typography>
      <Grid container spacing={3}>
        {filteredAccounts.map((account) => (
          <Grid item xs={12} sm={6} md={4} key={account.id}>
            <AccountCard 
              account={account} 
              onUpdate={onUpdateAccount} 
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AccountGroupSection;
