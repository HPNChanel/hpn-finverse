import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Fab,
  Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import BudgetCard from '../../components/budget/BudgetCard';
import { useAccounts, useBudgets, useFormDialog, useSnackbar, usePageTitle } from '../../hooks';
import { EmptyState, CardSkeleton, CustomSnackbar, LoadingOverlay } from '../../components/shared';
import PageLayout from '../../components/layouts/PageLayout';
import type { CreateBudgetData } from '../../services/budgetService';
import type { SxProps, Theme } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  sx?: SxProps<Theme>;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, sx, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`budget-tabpanel-${index}`}
      aria-labelledby={`budget-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Budgets: React.FC = () => {
  usePageTitle('Budget Planning');
  
  // Hooks
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { isOpen, formError, isSubmitting, openDialog, closeDialog, setFormError, startSubmitting, stopSubmitting } = useFormDialog();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  
  // Initialize the budget hook with the selected account
  const { 
    budgets, 
    loading: budgetsLoading, 
    error: budgetsError, 
    fetchBudgets, 
    createBudget, 
    activeBudgets,
    exceededBudgets 
  } = useBudgets(selectedAccount || undefined);
  
  // New budget form state
  const [formAccount, setFormAccount] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState<number | ''>('');

  // Set first account as selected if accounts exist
  useEffect(() => {
    if (accounts.length > 0 && selectedAccount === null) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (accounts.length > newValue) {
      setTabValue(newValue);
      setSelectedAccount(accounts[newValue].id);
    }
  };

  // Handle dialog open
  const handleOpenDialog = () => {
    setFormAccount(selectedAccount || '');
    setCategory('');
    setLimitAmount('');
    openDialog();
  };

  // Handle budget creation
  const handleCreateBudget = async () => {
    // Validate form
    if (!formAccount) {
      setFormError('Account is required');
      return;
    }
    if (!category.trim()) {
      setFormError('Category is required');
      return;
    }
    if (!limitAmount || limitAmount <= 0) {
      setFormError('Limit amount must be greater than zero');
      return;
    }

    try {
      startSubmitting();
      const budgetData: CreateBudgetData = {
        account_id: formAccount as number,
        category: category.trim(),
        limit_amount: limitAmount as number
      };
      
      const success = await createBudget(budgetData);
      
      if (success) {
        closeDialog();
        showSnackbar('Budget created successfully!', 'success');
      }
    } catch (error) {
      console.error(error);
    } finally {
      stopSubmitting();
    }
  };

  // Handle budget update
  const handleBudgetUpdated = () => {
    if (selectedAccount !== null) {
      fetchBudgets(selectedAccount);
      showSnackbar('Budget updated successfully!', 'success');
    }
  };

  const error = accountsError || budgetsError;

  const actionButton = accounts.length > 0 ? (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleOpenDialog}
    >
      Create Budget
    </Button>
  ) : undefined;

  return (
    <PageLayout title="Budget Planning" action={actionButton}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {accountsLoading ? (
        <LoadingOverlay message="Loading accounts..." />
      ) : accounts.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          You need to create at least one account before creating budgets.
        </Alert>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {accounts.map((account, index) => (
                <Tab key={account.id} label={account.name} id={`budget-tab-${index}`} />
              ))}
            </Tabs>
          </Box>

          {accounts.map((account, index) => (
            <TabPanel key={account.id} value={tabValue} index={index}>
              {budgetsLoading ? (
                <CardSkeleton count={3} />
              ) : budgets.length === 0 ? (
                <EmptyState
                  title="No budgets found for this account"
                  description="Create your first budget to start tracking your spending"
                  actionLabel="Create Budget"
                  onAction={handleOpenDialog}
                />
              ) : (
                <>
                  {activeBudgets.length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                        Active Budgets
                      </Typography>
                      <Grid container spacing={3}>
                        {activeBudgets.map((budget) => (
                          <Grid item xs={12} sm={6} md={4} key={budget.id}>
                            <BudgetCard 
                              budget={budget} 
                              accounts={accounts} 
                              onBudgetUpdated={handleBudgetUpdated} 
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                  
                  {exceededBudgets.length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                        Exceeded Budgets
                      </Typography>
                      <Grid container spacing={3}>
                        {exceededBudgets.map((budget) => (
                          <Grid item xs={12} sm={6} md={4} key={budget.id}>
                            <BudgetCard 
                              budget={budget} 
                              accounts={accounts} 
                              onBudgetUpdated={handleBudgetUpdated} 
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </>
              )}
            </TabPanel>
          ))}
        </>
      )}

      {/* Floating Add Button on mobile */}
      {accounts.length > 0 && (
        <Box sx={{ display: { sm: 'none' }, position: 'fixed', bottom: 16, right: 16 }}>
          <Fab color="primary" aria-label="add" onClick={handleOpenDialog}>
            <AddIcon />
          </Fab>
        </Box>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={isOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Budget</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          
          <TextField
            select
            margin="dense"
            label="Account"
            fullWidth
            value={formAccount}
            onChange={(e) => setFormAccount(Number(e.target.value))}
            disabled={isSubmitting}
            variant="outlined"
            sx={{ mb: 2, mt: 1 }}
          >
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name} ({account.type})
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            margin="dense"
            label="Category"
            type="text"
            fullWidth
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            variant="outlined"
            sx={{ mb: 2 }}
            placeholder="e.g., Groceries, Entertainment, Bills"
          />
          
          <TextField
            margin="dense"
            label="Monthly Limit"
            type="number"
            fullWidth
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={isSubmitting}
            variant="outlined"
            inputProps={{ min: 0.01, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBudget} 
            color="primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={hideSnackbar}
      />
    </PageLayout>
  );
};

export default Budgets;
