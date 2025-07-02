import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { goalService } from '@/services/goal.service';

interface Goal {
  id: number;
  name: string;
  progress: number;
  target: number;
  current: number;
  target_date?: string;
  status: number;
  icon?: string;
  color?: string;
  priority?: number;
}

interface GoalsProgressData {
  goals: Goal[];
  active_count: number;
  total_target: number;
  total_current: number;
  completion_rate: number;
  urgent_goals: Goal[];
}

interface UseGoalsProgressReturn {
  data: GoalsProgressData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useGoalsProgress = (): UseGoalsProgressReturn => {
  const [data, setData] = useState<GoalsProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchGoalsProgress = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching goals progress...');
      
      const goals = await goalService.getGoals();
      
      // Transform goals data
      const transformedGoals: Goal[] = goals.map((goal: {
        id: number;
        name: string;
        progress_percentage?: number;
        target_amount?: number;
        current_amount?: number;
        target_date?: string;
        status?: number;
        icon?: string;
        color?: string;
        priority?: number;
      }) => ({
        id: goal.id,
        name: goal.name,
        progress: goal.progress_percentage || 0,
        target: goal.target_amount || 0,
        current: goal.current_amount || 0,
        target_date: goal.target_date,
        status: goal.status || 1,
        icon: goal.icon || '🎯',
        color: goal.color || '#1976d2',
        priority: goal.priority || 2,
      }));

      // Filter active goals (status = 1)
      const activeGoals = transformedGoals.filter(goal => goal.status === 1);
      
      // Calculate metrics
      const total_target = activeGoals.reduce((sum, goal) => sum + goal.target, 0);
      const total_current = activeGoals.reduce((sum, goal) => sum + goal.current, 0);
      const completion_rate = total_target > 0 ? (total_current / total_target) * 100 : 0;
      
      // Find urgent goals (target date within 30 days or low progress)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const urgent_goals = activeGoals.filter(goal => {
        if (goal.target_date) {
          const targetDate = new Date(goal.target_date);
          return targetDate <= thirtyDaysFromNow && goal.progress < 80;
        }
        return goal.progress < 50; // Low progress goals
      }).sort((a, b) => {
        // Sort by urgency: priority first, then progress
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.progress - b.progress;
      });

      const goalsProgressData: GoalsProgressData = {
        goals: transformedGoals,
        active_count: activeGoals.length,
        total_target,
        total_current,
        completion_rate,
        urgent_goals: urgent_goals.slice(0, 3), // Top 3 urgent goals
      };

      setData(goalsProgressData);
      setLastUpdated(new Date());
      console.log(`✅ Loaded ${transformedGoals.length} goals (${activeGoals.length} active)`);
      
    } catch (err: unknown) {
      console.error('❌ Failed to fetch goals progress:', err);
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load goals progress';
      setError(errorMessage);
      
      toast({
        title: "Error Loading Goals",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, toast]);

  // Fetch data on mount and when auth status changes
  useEffect(() => {
    fetchGoalsProgress();
  }, [fetchGoalsProgress]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchGoalsProgress,
    lastUpdated,
  };
}; 