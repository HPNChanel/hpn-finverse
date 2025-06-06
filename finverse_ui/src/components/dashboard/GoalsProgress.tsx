import React from 'react';
import { Target, TrendingUp, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorHandler } from '@/utils/errorHandler';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  progress_percentage: number;
  status: number;
}

interface ActiveGoal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  progress: number;
  target_date?: string;
  icon?: string;
  color?: string;
  priority?: number;
}

interface GoalsProgressProps {
  goals: Goal[];
  activeGoal?: ActiveGoal | null;
}

export function GoalsProgress({ goals, activeGoal }: GoalsProgressProps) {
  const navigate = useNavigate();

  // Safe data processing with comprehensive error handling
  const safeGoals = React.useMemo(() => {
    try {
      if (!goals) return [];
      if (!Array.isArray(goals)) {
        console.warn('GoalsProgress: goals prop is not an array:', goals);
        return [];
      }
      
      // Filter out invalid goal objects
      return goals.filter(goal => {
        if (!goal || typeof goal !== 'object') return false;
        if (typeof goal.id !== 'number') return false;
        if (typeof goal.name !== 'string') return false;
        if (typeof goal.target_amount !== 'number') return false;
        if (typeof goal.current_amount !== 'number') return false;
        return true;
      });
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || 'Error processing goals data';
      ErrorHandler.logError(new Error(errorMessage), 'GoalsProgress: Processing goals');
      return [];
    }
  }, [goals]);

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      ErrorHandler.logError(error, 'Format Currency');
      return `$${amount || 0}`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      ErrorHandler.logError(error, 'Format Date');
      return 'Invalid Date';
    }
  };

  const getDaysRemaining = (targetDate: string) => {
    try {
      const target = new Date(targetDate);
      const today = new Date();
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      ErrorHandler.logError(error, 'Calculate Days Remaining');
      return 0;
    }
  };

  const activeGoals = safeGoals.filter(goal => goal?.status === 1).slice(0, 3);
  const totalGoalValue = safeGoals.reduce((sum, goal) => sum + (goal?.target_amount || 0), 0);
  const totalProgress = safeGoals.reduce((sum, goal) => sum + (goal?.current_amount || 0), 0);
  const overallProgress = totalGoalValue > 0 ? (totalProgress / totalGoalValue) * 100 : 0;

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Goals Progress
        </h3>
        <button
          onClick={() => navigate('/goals')}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          View All
        </button>
      </div>

      {!activeGoal && activeGoals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">No active goals yet</p>
          <button
            onClick={() => navigate('/goals')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Goal Highlight */}
          {activeGoal && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  {activeGoal.icon && <span>{activeGoal.icon}</span>}
                  <span>Priority Goal: {activeGoal.title}</span>
                </h4>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {activeGoal.progress.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(activeGoal.current_amount)} / {formatCurrency(activeGoal.target_amount)}
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(activeGoal.progress, 100)}%`,
                    backgroundColor: activeGoal.color || '#1976d2'
                  }}
                />
              </div>
              
              {activeGoal.target_date && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Target: {formatDate(activeGoal.target_date)}</span>
                </div>
              )}
            </div>
          )}

          {/* Overall Progress - only show if there are other goals besides the active one */}
          {safeGoals.length > 1 && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {overallProgress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(totalProgress)} saved</span>
                <span>{formatCurrency(totalGoalValue)} target</span>
              </div>
            </div>
          )}

          {/* Individual Goals - exclude the active goal if it's already shown */}
          <div className="space-y-4">
            {activeGoals
              .filter(goal => !activeGoal || goal.id !== activeGoal.id)
              .map((goal) => {
                const daysRemaining = getDaysRemaining(goal.target_date);
                const isOverdue = daysRemaining < 0;
                
                return (
                  <div key={`goal-progress-${goal.id}`} className="p-4 border border-border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">{goal.name}</h4>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {goal.progress_percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(goal.target_date)}</span>
                      </div>
                      <div className={`font-medium ${
                        isOverdue ? 'text-red-600' : 
                        daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {isOverdue ? 
                          `${Math.abs(daysRemaining)} days overdue` : 
                          `${daysRemaining} days left`
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {goals.length > 3 && (
            <button
              onClick={() => navigate('/goals')}
              className="w-full py-2 text-sm text-primary hover:text-primary/80 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              View {goals.length - 3} more goals
            </button>
          )}
        </div>
      )}
    </div>
  );
}
