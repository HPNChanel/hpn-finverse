import { useState, useEffect, useCallback } from 'react';
import budgetService from '../services/budgetService';
import type { BudgetPlan } from '../types';
import type { CreateBudgetData, UpdateBudgetSpendingData } from '../services/budgetService';

interface UseBudgetsReturn {
  budgets: BudgetPlan[];
  loading: boolean;
  error: string | null;
  fetchBudgets: (accountId: number) => Promise<void>;
  createBudget: (data: CreateBudgetData) => Promise<boolean>;
  updateSpending: (budgetId: number, data: UpdateBudgetSpendingData) => Promise<boolean>;
  activeBudgets: BudgetPlan[];
  exceededBudgets: BudgetPlan[];
}

export const useBudgets = (initialAccountId?: number): UseBudgetsReturn => {
  const [budgets, setBudgets] = useState<BudgetPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async (accountId: number) => {
    if (!accountId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.getBudgets(accountId);
      setBudgets(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load budgets. Please try again later.';
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBudget = useCallback(async (data: CreateBudgetData): Promise<boolean> => {
    try {
      setError(null);
      await budgetService.createBudget(data);
      await fetchBudgets(data.account_id);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create budget';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, [fetchBudgets]);

  const updateSpending = useCallback(async (
    budgetId: number, 
    data: UpdateBudgetSpendingData
  ): Promise<boolean> => {
    try {
      setError(null);
      const updatedBudget = await budgetService.updateSpending(budgetId, data);
      
      // Update the budget in the local state
      setBudgets(prevBudgets => 
        prevBudgets.map(budget => 
          budget.id === budgetId ? updatedBudget : budget
        )
      );
      
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update budget spending';
      setError(errorMessage);
      console.error(error);
      return false;
    }
  }, []);

  // Initialize with the provided account ID if available
  useEffect(() => {
    if (initialAccountId) {
      fetchBudgets(initialAccountId);
    }
  }, [initialAccountId, fetchBudgets]);

  // Filter budgets by status
  const activeBudgets = budgets.filter(budget => budget.status === 'active');
  const exceededBudgets = budgets.filter(budget => budget.status === 'exceeded');

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateSpending,
    activeBudgets,
    exceededBudgets
  };
};
