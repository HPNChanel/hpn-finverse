import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  Snackbar,
  Fab,
  Divider,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import GoalCard from '../../components/shared/GoalCard';
import GoalForm from '../../components/shared/GoalForm';
import { useGoals } from '../../hooks';
import type { FinancialGoal } from '../../utils/importFixes';
import type { CreateGoalRequest, UpdateGoalRequest } from '../../services/goalService';
import { EmptyState } from '../../components/shared';

const Goals: React.FC = () => {
  // States for managing UI
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [deleteConfirmGoalId, setDeleteConfirmGoalId] = useState<number | null>(null);

  // Get goals data and operations from custom hook
  const { goals, loading, error, createGoal, updateGoal, deleteGoal, getGoalById } = useGoals();

  // Handle creating/updating a goal
  const handleSubmitGoal = async (data: CreateGoalRequest | UpdateGoalRequest) => {
    setFormLoading(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, data as UpdateGoalRequest);
        setSnackbar({
          open: true,
          message: 'Goal updated successfully!',
          severity: 'success'
        });
      } else {
        await createGoal(data as CreateGoalRequest);
        setSnackbar({
          open: true,
          message: 'Goal created successfully!',
          severity: 'success'
        });
      }
      setFormOpen(false);
      setEditingGoal(undefined);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        severity: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle editing a goal
  const handleEditGoal = (goalId: number) => {
    const goal = getGoalById(goalId);
    if (goal) {
      setEditingGoal(goal);
      setFormOpen(true);
    }
  };

  // Handle deleting a goal
  const handleDeleteGoal = async (goalId: number) => {
    try {
      await deleteGoal(goalId);
      setSnackbar({
        open: true,
        message: 'Goal deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        severity: 'error'
      });
    } finally {
      setDeleteConfirmGoalId(null);
    }
  };

  // Group goals by status
  const ongoingGoals = goals.filter(goal => goal.status === 1);
  const completedGoals = goals.filter(goal => goal.status === 2);
  const cancelledGoals = goals.filter(goal => goal.status === 3);

  return (
    <Box sx={{ p: 3 }}>
      {/* Error alert if there's an issue fetching goals */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : goals.length === 0 ? (
        <EmptyState
          title="No financial goals found"
          description="You haven't set any financial goals yet. Create your first goal to track your financial progress."
          actionLabel="Create Goal"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <Box sx={{ mb: 8 }}>
          {/* Ongoing goals section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Ongoing Goals
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {ongoingGoals.length === 0 ? (
              <Typography color="text.secondary">No ongoing goals.</Typography>
            ) : (
              <Grid container spacing={3}>
                {ongoingGoals.map(goal => (
                  <Grid item xs={12} sm={6} md={4} key={goal.id}>
                    <GoalCard 
                      goal={goal} 
                      onEdit={handleEditGoal} 
                      onDelete={(goalId) => setDeleteConfirmGoalId(goalId)} 
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Completed goals section */}
          {completedGoals.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Completed Goals
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                {completedGoals.map(goal => (
                  <Grid item xs={12} sm={6} md={4} key={goal.id}>
                    <GoalCard 
                      goal={goal} 
                      onEdit={handleEditGoal} 
                      onDelete={(goalId) => setDeleteConfirmGoalId(goalId)} 
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Cancelled goals section */}
          {cancelledGoals.length > 0 && (
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Cancelled Goals
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                {cancelledGoals.map(goal => (
                  <Grid item xs={12} sm={6} md={4} key={goal.id}>
                    <GoalCard 
                      goal={goal} 
                      onEdit={handleEditGoal} 
                      onDelete={(goalId) => setDeleteConfirmGoalId(goalId)} 
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Floating Action Button for adding a new goal */}
      <Fab 
        color="primary" 
        aria-label="add goal" 
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          setEditingGoal(undefined);
          setFormOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      {/* Goal Form Dialog */}
      <GoalForm 
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingGoal(undefined);
        }}
        onSubmit={handleSubmitGoal}
        goal={editingGoal}
        isLoading={formLoading}
      />

      {/* Delete Confirmation Dialog - use your preferred confirmation dialog component */}
      {deleteConfirmGoalId && (
        <Snackbar
          open={!!deleteConfirmGoalId}
          autoHideDuration={null}
          onClose={() => setDeleteConfirmGoalId(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="warning"
            action={
              <>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setDeleteConfirmGoalId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  color="error" 
                  size="small" 
                  onClick={() => deleteConfirmGoalId && handleDeleteGoal(deleteConfirmGoalId)}
                  sx={{ ml: 1 }}
                >
                  Delete
                </Button>
              </>
            }
          >
            Are you sure you want to delete this goal?
          </Alert>
        </Snackbar>
      )}

      {/* Snackbar for general feedback */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Goals; 