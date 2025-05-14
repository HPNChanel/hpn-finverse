import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import type { BudgetPlan, Account } from '../../types';
import { useFormatters } from '../../hooks';
import budgetService from '../../services/budgetService';
import { getErrorMessage } from '../../utils/importFixes';

interface BudgetCardProps {
  budget: BudgetPlan;
  accounts: Account[];
  onBudgetUpdated: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, accounts, onBudgetUpdated }) => {
  const { formatCurrency, formatDate } = useFormatters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [spentAmount, setSpentAmount] = useState<number>(budget.spent_amount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate progress percentage
  const progressPercentage = (budget.spent_amount / budget.limit_amount) * 100;

  // Get account name
  const getAccountName = (accountId: number): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : `Account #${accountId}`;
  };

  // Get color based on status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'exceeded':
        return '#f44336'; // Red
      case 'active':
        return '#4caf50'; // Green
      case 'completed':
        return '#2196f3'; // Blue
      default:
        return '#9e9e9e'; // Grey
    }
  };

  // Handle dialog open
  const handleOpenDialog = () => {
    setSpentAmount(budget.spent_amount);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setError(null);
  };

  // Handle spending update
  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await budgetService.updateSpending(budget.id, { spent_amount: spentAmount });
      
      onBudgetUpdated();
      handleCloseDialog();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="div">
              {budget.category}
            </Typography>
            <Chip 
              label={budget.status} 
              size="small"
              sx={{ 
                backgroundColor: getStatusColor(budget.status),
                color: 'white'
              }}
            />
          </Box>
          
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Account: {getAccountName(budget.account_id)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created on {formatDate(budget.created_at)}
            </Typography>
          </Box>
          
          <Box mb={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" fontWeight="bold">
                Spent: {formatCurrency(budget.spent_amount)}
              </Typography>
              <Typography variant="body2">
                Limit: {formatCurrency(budget.limit_amount)}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(progressPercentage, 100)} 
              color={progressPercentage >= 100 ? "error" : "primary"}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={handleOpenDialog}
            >
              Update Spending
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Update Spending Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Update Spending for {budget.category}</DialogTitle>
        <DialogContent>
          <Box my={2}>
            <Typography variant="body2" gutterBottom>
              Current Budget: {formatCurrency(budget.limit_amount)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Current Spending: {formatCurrency(budget.spent_amount)}
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="New Spent Amount"
            type="number"
            fullWidth
            value={spentAmount}
            onChange={(e) => setSpentAmount(Number(e.target.value))}
            inputProps={{ min: 0, step: 0.01 }}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            color="primary" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BudgetCard;
