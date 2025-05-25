import api from './api';
import axios from 'axios';
import { handleErrorResponse } from '../utils/importFixes';
import type { FinancialGoal, CreateGoalRequest, UpdateGoalRequest } from '../types';

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
      console.log('Fetching goals from API...');
      const response = await api.get<ApiResponse<GoalsResponse>>('/goals');
      
      console.log('Goals API response:', response.data);
      
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
          console.log('Authentication error - but continuing for prototype');
          // Return empty array for prototype mode
          return [];
        }
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
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
      console.log('Creating goal with data:', goalData);
      
      // Clean and validate the data before sending
      const cleanedData = {
        name: goalData.name?.trim(),
        target_amount: Number(goalData.target_amount),
        current_amount: goalData.current_amount ? Number(goalData.current_amount) : 0,
        start_date: goalData.start_date,
        target_date: goalData.target_date,
        description: goalData.description?.trim() || null,
        priority: Number(goalData.priority) || 2,
        status: Number(goalData.status) || 1,
        icon: goalData.icon || '🎯',
        color: goalData.color || '#1976d2'
      };
      
      // Remove null/undefined values
      const finalData = Object.fromEntries(
        Object.entries(cleanedData).filter(([_, value]) => value !== null && value !== undefined)
      );
      
      console.log('Sending cleaned goal data:', finalData);
      
      // Validate required fields on frontend
      if (!finalData.name) {
        throw new Error('Goal name is required');
      }
      if (!finalData.target_amount || finalData.target_amount <= 0) {
        throw new Error('Target amount must be greater than 0');
      }
      if (!finalData.start_date) {
        throw new Error('Start date is required');
      }
      if (!finalData.target_date) {
        throw new Error('Target date is required');
      }
      
      // Validate dates
      const startDate = new Date(finalData.start_date);
      const targetDate = new Date(finalData.target_date);
      if (targetDate <= startDate) {
        throw new Error('Target date must be after start date');
      }
      
      const response = await api.post<ApiResponse<FinancialGoal>>('/goals', finalData);
      
      console.log('Create goal API response:', response.data);
      
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
        if (error.response?.status === 422) {
          const validationErrors = error.response.data?.detail || [];
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((err: any) => err.msg || err.message || 'Validation error');
            throw new Error(errorMessages.join(', '));
          }
        }
        if (error.response?.status === 401) {
          console.log('Authentication error - but continuing for prototype');
          // Return mock goal for prototype mode
          return {
            id: Date.now(),
            name: goalData.name,
            target_amount: goalData.target_amount,
            current_amount: goalData.current_amount || 0,
            start_date: goalData.start_date,
            target_date: goalData.target_date,
            description: goalData.description,
            priority: goalData.priority,
            status: goalData.status || 1,
            progress_percentage: 0,
            icon: goalData.icon || '🎯',
            color: goalData.color || '#1976d2',
            created_at: new Date().toISOString(),
          } as FinancialGoal;
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