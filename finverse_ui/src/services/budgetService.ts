import api from './api';
import type { BudgetPlan, BudgetPlanListResponse } from '../types';
import { handleErrorResponse } from '../utils/importFixes';

export interface CreateBudgetData {
  account_id: number;
  category: string;
  limit_amount: number;  // Ensure this field name matches the backend
  name?: string;  // Optional name field
}

export interface UpdateBudgetSpendingData {
  spent_amount: number;
}

const budgetService = {
  /**
   * Get all budget plans for an account
   */
  getBudgets: async (accountId: number): Promise<BudgetPlan[]> => {
    try {
      const response = await api.get<BudgetPlanListResponse>(`/budget/list/${accountId}`);
      return response.data.budget_plans;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Create a new budget plan
   */
  createBudget: async (data: CreateBudgetData): Promise<BudgetPlan> => {
    try {
      // Log the payload for debugging
      console.log('Creating budget with payload:', JSON.stringify(data, null, 2));
      const response = await api.post<BudgetPlan>('/budget/create', data);
      return response.data;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Update spending amount for a budget plan
   */
  updateSpending: async (budgetId: number, data: UpdateBudgetSpendingData): Promise<BudgetPlan> => {
    try {
      const response = await api.patch<BudgetPlan>(`/budget/update_spending/${budgetId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating budget spending:', error);
      throw new Error(handleErrorResponse(error));
    }
  },
};

export default budgetService;