import React, { useState, useEffect } from 'react';
import { Plus, Target, Edit2, Trash2 } from 'lucide-react';
import { Goal, goalService } from '@/services/goal.service';
import { useApiError } from '@/utils/errorHandler.tsx';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { CreateGoalModal } from '../components/CreateGoalModal';
import { EditGoalModal } from '../components/EditGoalModal';

interface DeleteConfirmDialog {
  goalName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog = ({ goalName, onConfirm, onCancel }: DeleteConfirmDialog) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Delete Goal</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete "{goalName}"? This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export function Goals() {
  // Initialize all state with proper defaults
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'progress'>('cards');
  


  const { toast } = useToast();
  const { handleError } = useApiError();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the goal service with better error handling
      const goalsData = await goalService.getGoals();
      
      // Ensure we always have an array with additional validation
      if (Array.isArray(goalsData)) {
        // Validate each goal object has required properties
        const validGoals = goalsData.filter(goal => 
          goal && 
          typeof goal === 'object' && 
          typeof goal.id === 'number' &&
          typeof goal.name === 'string'
        );
        setGoals(validGoals);
      } else {
        console.warn('Goals service returned non-array:', goalsData);
        setGoals([]);
      }
      
    } catch (err) {
      console.error('Error fetching goals:', err);
      const errorMessage = handleError(err, 'Fetch goals');
      setError(errorMessage);
      setGoals([]); // Ensure goals is always an array
      
      toast({
        title: "Error",
        description: "Failed to fetch goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const deleteGoal = async (goalId: number) => {
    try {
      await goalService.deleteGoal(goalId);
      setGoals(goals.filter(goal => goal.id !== goalId));
      setDeleteConfirm(null);
      
      toast({
        title: "Success",
        description: "Goal deleted successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Delete goal');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Add error boundary wrapper for render
  const renderGoals = () => {
    if (!Array.isArray(goals)) {
      console.error('Goals is not an array:', goals);
      return (
        <div className="text-center py-12">
          <div className="text-destructive mb-4">
            <h3 className="text-lg font-medium mb-2">Data Error</h3>
            <p>Unable to display goals due to data format issue.</p>
          </div>
          <button
            onClick={fetchGoals}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (goals.length === 0) {
      return (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No goals yet</h3>
          <p className="text-muted-foreground mb-4">Start by creating your first financial goal</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Goal
          </button>
        </div>
      );
    }

    if (viewMode === 'cards') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(goal) => {
                setEditingGoal(goal);
                setIsEditModalOpen(true);
              }}
              onDelete={(goalId) => setDeleteConfirm(goalId)}
              formatCurrency={(amount) => formatCurrency(amount, 'USD')}
              formatDate={formatDate}
              getDaysRemaining={getDaysRemaining}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {goals.map((goal) => (
          <ProgressCard
            key={goal.id}
            goal={goal}
            onEdit={(goal) => {
              setEditingGoal(goal);
              setIsEditModalOpen(true);
            }}
            onDelete={(goalId) => setDeleteConfirm(goalId)}
            formatCurrency={(amount) => formatCurrency(amount, 'USD')}
            formatDate={formatDate}
            getDaysRemaining={getDaysRemaining}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="text-muted-foreground">Track and manage your financial objectives</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('progress')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'progress' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Progress
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-destructive">{error}</span>
            <button
              onClick={fetchGoals}
              className="text-sm text-destructive hover:text-destructive/80 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {renderGoals()}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchGoals}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
        onSuccess={fetchGoals}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          goalName={goals.find(goal => goal.id === deleteConfirm)?.name || ''}
          onConfirm={() => deleteGoal(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// Goal Card Component
function GoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  formatCurrency, 
  formatDate, 
  getDaysRemaining 
}: {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: number) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getDaysRemaining: (date: string) => number;
}) {
  const daysRemaining = getDaysRemaining(goal.target_date);
  const isOverdue = daysRemaining < 0;
  const isCompleted = goal.status === 2;

  return (
    <div className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{goal.name}</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(goal)} className="p-1 hover:bg-muted rounded" title="Edit goal" aria-label="Edit goal">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1 hover:bg-muted rounded" title="Delete goal" aria-label="Delete goal">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-primary"
            style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Current:</span>
          <span>{formatCurrency(goal.current_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Target:</span>
          <span>{formatCurrency(goal.target_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Target Date:</span>
          <span>{formatDate(goal.target_date)}</span>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-muted-foreground mt-3">{goal.description}</p>
      )}
    </div>
  );
}

// Progress Card Component
function ProgressCard({ 
  goal, 
  onEdit, 
  onDelete, 
  formatCurrency, 
  formatDate, 
  getDaysRemaining 
}: {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: number) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getDaysRemaining: (date: string) => number;
}) {
  const daysRemaining = getDaysRemaining(goal.target_date);
  const isOverdue = daysRemaining < 0;

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{goal.name}</h3>
        <div className="flex gap-1">
          <button onClick={() => onEdit(goal)} className="p-1 hover:bg-muted rounded" title="Edit goal" aria-label="Edit goal">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1 hover:bg-muted rounded" title="Delete goal" aria-label="Delete goal">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
