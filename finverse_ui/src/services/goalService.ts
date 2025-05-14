import api from './api';
import axios from 'axios';
import { handleErrorResponse } from '../utils/importFixes';
import type { FinancialGoal } from '../utils/importFixes';

// Types for API requests
export interface CreateGoalRequest {
  name: string;
  target_amount: number;
  current_amount?: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority: number; // 1=low, 2=medium, 3=high
  status?: number; // 1=ongoing, 2=completed, 3=cancelled
  icon?: string;
  color?: string;
}

export interface UpdateGoalRequest {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  start_date?: string;
  target_date?: string;
  description?: string;
  priority?: number;
  status?: number;
  icon?: string;
  color?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ detail: string }>;
}

interface GoalsResponse {
  goals: FinancialGoal[];
}

const goalService = {
  /**
   * Get all financial goals for the current user
   * @returns List of financial goals
   */
  getGoals: async (): Promise<FinancialGoal[]> => {
    try {
      const response = await api.get<ApiResponse<GoalsResponse>>('/goals');
      
      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.detail || 'Failed to fetch goals');
      }
      
      return response.data.data.goals || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Get a specific financial goal by ID
   * @param goalId ID of the goal to fetch
   * @returns Financial goal
   */
  getGoalById: async (goalId: number): Promise<FinancialGoal> => {
    try {
      const response = await api.get<ApiResponse<FinancialGoal>>(`/goals/${goalId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.detail || 'Failed to fetch goal');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching goal with ID ${goalId}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Goal not found');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Create a new financial goal
   * @param goalData Goal creation data
   * @returns Created goal
   */
  createGoal: async (goalData: CreateGoalRequest): Promise<FinancialGoal> => {
    try {
      const response = await api.post<ApiResponse<FinancialGoal>>('/goals', goalData);
      
      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.detail || 'Failed to create goal');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.errors?.[0]?.detail || 'Invalid goal data';
          throw new Error(errorDetail);
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Update an existing financial goal
   * @param goalId ID of the goal to update
   * @param goalData Updated goal data
   * @returns Updated goal
   */
  updateGoal: async (goalId: number, goalData: UpdateGoalRequest): Promise<FinancialGoal> => {
    try {
      const response = await api.put<ApiResponse<FinancialGoal>>(`/goals/${goalId}`, goalData);
      
      if (!response.data.success) {
        throw new Error(response.data.errors?.[0]?.detail || 'Failed to update goal');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error updating goal with ID ${goalId}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Goal not found');
        }
        if (error.response?.status === 400) {
          const errorDetail = error.response.data?.errors?.[0]?.detail || 'Invalid goal data';
          throw new Error(errorDetail);
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  },

  /**
   * Delete a financial goal
   * @param goalId ID of the goal to delete
   * @returns Success status
   */
  deleteGoal: async (goalId: number): Promise<boolean> => {
    try {
      const response = await api.delete<ApiResponse<null>>(`/goals/${goalId}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting goal with ID ${goalId}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Goal not found');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
      }
      
      throw new Error(handleErrorResponse(error));
    }
  }
};

export default goalService; 