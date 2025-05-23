import React, { useCallback } from 'react';
import {
  Button,
  Alert,
  Fab,
  Box,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAccounts, useFormDialog, useSnackbar, useAccountSummary, useAccountTypes } from '../../hooks';
import { EmptyState, CustomSnackbar } from '../../components/shared';
import TotalSummaryCard from '../../components/account/TotalSummaryCard';
import AccountGroupSection from '../../components/account/AccountGroupSection';
import NewAccountDialog from '../../components/account/NewAccountDialog';
import type { CreateAccountFormData } from '../../components/account/NewAccountDialog';

const Accounts: React.FC = () => {
  // Hooks
  const { accounts, loading: accountsLoading, error: accountsError, createAccount, fetchAccounts } = useAccounts();
  const { summary, loading: summaryLoading, error: summaryError, fetchSummary } = useAccountSummary();
  const { isOpen, formError, isSubmitting, openDialog, closeDialog, setFormError, startSubmitting, stopSubmitting } = useFormDialog();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  const { accountTypes, loading: accountTypesLoading } = useAccountTypes();
  
  // Loading and error states
  const loading = accountsLoading || summaryLoading;
  const error = accountsError || summaryError;

  // Refresh handler to update both accounts and summary
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchAccounts(), fetchSummary()]);
  }, [fetchAccounts, fetchSummary]);
  
  // Handle account creation
  const handleCreateAccount = async (accountData: CreateAccountFormData) => {
    try {
      startSubmitting();
      const success = await createAccount(
        accountData.name,
        accountData.type,
        accountData.initialBalance,
        accountData.note,
        accountData.icon,
        accountData.color,
        accountData.currency
      );
      
      if (success) {
        closeDialog();
        showSnackbar('Account created successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to create account. Please try again.');
    } finally {
      stopSubmitting();
    }
  };

  const actionButton = (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={openDialog}
    >
      Create Account
    </Button>
  );

  // If there are no accounts and we're not loading, show empty state
  if (!loading && (!accounts || accounts.length === 0)) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState
          title="No accounts found"
          description="Create your first account to start managing your finances"
          actionLabel="Create Account"
          onAction={openDialog}
        />
        
        <NewAccountDialog
          isOpen={isOpen}
          closeDialog={closeDialog}
          formError={formError}
          isSubmitting={isSubmitting}
          accountTypes={accountTypes}
          accountTypesLoading={accountTypesLoading}
          handleCreateAccount={handleCreateAccount}
        />
        
        <CustomSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={hideSnackbar}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {actionButton}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Account Summary Section */}
      <TotalSummaryCard 
        summary={summary} 
        loading={summaryLoading} 
      />
      
      {/* Account Groups by Type */}
      <AccountGroupSection 
        title="💳 Wallet Accounts" 
        type="wallet" 
        accounts={accounts} 
        loading={accountsLoading} 
        onUpdateAccount={handleRefresh} 
      />
      
      <AccountGroupSection 
        title="💰 Savings Accounts" 
        type="saving" 
        accounts={accounts} 
        loading={accountsLoading} 
        onUpdateAccount={handleRefresh} 
      />
      
      <AccountGroupSection 
        title="📈 Investment Accounts" 
        type="investment" 
        accounts={accounts} 
        loading={accountsLoading} 
        onUpdateAccount={handleRefresh} 
      />
      
      <AccountGroupSection 
        title="🏆 Goal Funds" 
        type="goal" 
        accounts={accounts} 
        loading={accountsLoading} 
        onUpdateAccount={handleRefresh} 
      />

      {/* Floating Add Button on mobile */}
      <Box sx={{ display: { sm: 'none' }, position: 'fixed', bottom: 16, right: 16 }}>
        <Fab color="primary" aria-label="add" onClick={openDialog}>
          <AddIcon />
        </Fab>
      </Box>

      {/* Create Account Dialog */}
      <NewAccountDialog
        isOpen={isOpen}
        closeDialog={closeDialog}
        formError={formError}
        isSubmitting={isSubmitting}
        accountTypes={accountTypes}
        accountTypesLoading={accountTypesLoading}
        handleCreateAccount={handleCreateAccount}
      />

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </Box>
  );
};

export default Accounts;
