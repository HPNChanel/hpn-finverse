import { useState, useEffect, useCallback } from 'react';
import goalService from '../services/goalService';
import type { FinancialGoal, CreateGoalRequest, UpdateGoalRequest } from '../types'; // Fix import paths

interface UseGoalsReturn {
  goals: FinancialGoal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (goalData: CreateGoalRequest) => Promise<FinancialGoal>;
  updateGoal: (goalId: number, goalData: UpdateGoalRequest) => Promise<FinancialGoal>;
  deleteGoal: (goalId: number) => Promise<boolean>;
  getGoalById: (goalId: number) => FinancialGoal | undefined;
}

export const useGoals = (): UseGoalsReturn => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('useGoals: Fetching goals...');
      const fetchedGoals = await goalService.getGoals();
      console.log('useGoals: Fetched goals:', fetchedGoals);
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('useGoals: Error fetching goals:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (goalData: CreateGoalRequest): Promise<FinancialGoal> => {
    try {
      console.log('useGoals: Creating goal with data:', goalData);
      const newGoal = await goalService.createGoal(goalData);
      console.log('useGoals: Created goal:', newGoal);
      setGoals(prevGoals => [...prevGoals, newGoal]);
      return newGoal;
    } catch (error) {
      console.error('useGoals: Error creating goal:', error);
      setError(error instanceof Error ? error.message : 'Failed to create goal');
      throw error;
    }
  };

  const updateGoal = async (goalId: number, goalData: UpdateGoalRequest): Promise<FinancialGoal> => {
    try {
      const updatedGoal = await goalService.updateGoal(goalId, goalData);
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId ? updatedGoal : goal
        )
      );
      return updatedGoal;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update goal');
      throw error;
    }
  };

  const deleteGoal = async (goalId: number): Promise<boolean> => {
    try {
      const success = await goalService.deleteGoal(goalId);
      if (success) {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      }
      return success;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete goal');
      throw error;
    }
  };

  const getGoalById = (goalId: number): FinancialGoal | undefined => {
    return goals.find(goal => goal.id === goalId);
  };

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalById
  };
};

export default useGoals;