import api from '@/lib/api';

export interface Goal {
  id: number;
  user_id: number;
  account_id?: number;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority: number;
  status: number;
  icon?: string;
  color?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalRequest {
  name: string;
  target_amount: number;
  current_amount?: number;
  start_date: string;
  target_date: string;
  description?: string;
  priority?: number;
  status?: number;
  icon?: string;
  color?: string;
  account_id?: number;
}

class GoalService {
  async getGoals(): Promise<Goal[]> {
    const response = await api.get('/goals');
    // Handle wrapped response format
    const data = response.data;
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    console.warn('Goals API returned unexpected format:', data);
    return [];
  }

  async createGoal(data: CreateGoalRequest): Promise<Goal> {
    const response = await api.post('/goals', data);
    // Handle wrapped response format
    const responseData = response.data;
    if (responseData && responseData.data) {
      return responseData.data;
    }
    return responseData;
  }

  async updateGoal(id: number, data: Partial<CreateGoalRequest>): Promise<Goal> {
    const response = await api.put(`/goals/${id}`, data);
    // Handle wrapped response format
    const responseData = response.data;
    if (responseData && responseData.data) {
      return responseData.data;
    }
    return responseData;
  }

  async deleteGoal(id: number): Promise<void> {
    await api.delete(`/goals/${id}`);
  }

  async updateGoalProgress(id: number, amount: number): Promise<Goal> {
    const response = await api.patch(`/goals/${id}/progress`, { amount });
    // Handle wrapped response format
    const responseData = response.data;
    if (responseData && responseData.data) {
      return responseData.data;
    }
    return responseData;
  }
}

export const goalService = new GoalService();
