import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, Calendar } from 'lucide-react';
import { Goal, goalService } from '@/services/goal.service';
import { useToast } from '@/hooks/use-toast';
import { useApiError } from '@/utils/errorHandler';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

const PRIORITY_LABELS = {
  1: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  2: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'High', color: 'bg-red-100 text-red-800' }
};

const STATUS_LABELS = {
  1: { label: 'Ongoing', color: 'bg-yellow-100 text-yellow-800' },
  2: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  3: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
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
  
  // Form state with proper defaults
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '0',
    current_amount: '0',
    target_date: '',
    priority: '1',
    status: '1'
  });

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

  const createGoal = async (goalData: {
    name: string;
    target_amount: number;
    current_amount?: number;
    start_date: string;
    target_date: string;
    description?: string;
    priority: number;
    icon?: string;
    color?: string;
  }) => {
    try {
      await goalService.createGoal(goalData);
      await fetchGoals();
      setIsCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: "Goal created successfully.",
      });
    } catch (err: any) {
      const errorMessage = handleError(err, 'Create goal');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateGoal = async (goalId: number, goalData: Partial<Goal>) => {
    try {
      await goalService.updateGoal(goalId, goalData);
      await fetchGoals();
      setIsEditModalOpen(false);
      setEditingGoal(null);
      
      toast({
        title: "Success",
        description: "Goal updated successfully.",
      });
    } catch (err: any) {
      const errorMessage = handleError(err, 'Update goal');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
        onSubmit={createGoal}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
        onUpdate={updateGoal}
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
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{goal.name}</h3>
            <div className="flex gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_LABELS[goal.priority as keyof typeof PRIORITY_LABELS].color}`}>
                {PRIORITY_LABELS[goal.priority as keyof typeof PRIORITY_LABELS].label}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[goal.status as keyof typeof STATUS_LABELS].color}`}>
                {STATUS_LABELS[goal.status as keyof typeof STATUS_LABELS].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{goal.progress_percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Amount Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current</span>
          <span className="font-medium">{formatCurrency(goal.current_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target</span>
          <span className="font-medium">{formatCurrency(goal.target_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium">{formatCurrency(goal.target_amount - goal.current_amount)}</span>
        </div>
      </div>

      {/* Date Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(goal.target_date)}</span>
        </div>
        <div className={`font-medium ${isOverdue ? 'text-destructive' : isCompleted ? 'text-green-600' : ''}`}>
          {isCompleted ? 'Completed' : isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-muted-foreground mt-3 border-t border-border pt-3">
          {goal.description}
        </p>
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
  const isCompleted = goal.status === 2;

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{goal.name}</h3>
            <div className="flex gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_LABELS[goal.priority as keyof typeof PRIORITY_LABELS].color}`}>
                {PRIORITY_LABELS[goal.priority as keyof typeof PRIORITY_LABELS].label}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[goal.status as keyof typeof STATUS_LABELS].color}`}>
                {STATUS_LABELS[goal.status as keyof typeof STATUS_LABELS].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Large Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-2xl font-bold text-foreground">{goal.progress_percentage.toFixed(1)}%</span>
            <span className="text-muted-foreground ml-2">complete</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
            </div>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Target: {formatDate(goal.target_date)}</span>
          </div>
          <div className={`font-medium ${isOverdue ? 'text-destructive' : isCompleted ? 'text-green-600' : 'text-foreground'}`}>
            {isCompleted ? 'Completed' : isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
          </div>
        </div>
        <div className="text-muted-foreground">
          {formatCurrency(goal.target_amount - goal.current_amount)} remaining
        </div>
      </div>
    </div>
  );
}

// Create Goal Modal Component
function CreateGoalModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    target_amount: 0,
    current_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    target_date: '',
    description: '',
    priority: 2,
    icon: '🎯',
    color: '#1976d2'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      target_amount: 0,
      current_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      target_date: '',
      description: '',
      priority: 2,
      icon: '🎯',
      color: '#1976d2'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Date</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Goal Modal Component
function EditGoalModal({ 
  isOpen, 
  onClose, 
  goal, 
  onUpdate 
}: {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onUpdate: (goalId: number, data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    target_amount: 0,
    current_amount: 0,
    start_date: '',
    target_date: '',
    description: '',
    priority: 2
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        start_date: goal.start_date,
        target_date: goal.target_date,
        description: goal.description || '',
        priority: goal.priority
      });
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal) {
      onUpdate(goal.id, formData);
    }
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Date</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Update Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Dialog - Updated to use ShadCN Dialog
function DeleteConfirmDialog({ 
  goalName, 
  onConfirm, 
  onCancel 
}: {
  goalName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Goal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{goalName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
