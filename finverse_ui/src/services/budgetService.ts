import api from '@/lib/api';

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  name: string;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
  period_type: string;
  start_date: string;
  end_date?: string;
  alert_threshold: string;
  description?: string;
  is_active: boolean;
  status: 'active' | 'exceeded' | 'completed' | 'paused';
  days_remaining?: number;
  created_at: string;
  updated_at?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface CreateBudgetRequest {
  name: string;
  category_id: number;
  limit_amount: number;
  period_type: string;
  start_date: string;
  end_date?: string;
  alert_threshold?: string;
  description?: string;
  is_active?: boolean;
}

// Add alias for compatibility with component
export type BudgetCreate = CreateBudgetRequest;

export interface BudgetSummary {
  total_budgets: number;
  active_budgets: number;
  exceeded_budgets: number;
  total_budget_amount: number;
  total_spent_amount: number;
  overall_usage_percentage: number;
}

export interface BudgetListResponse {
  budgets: Budget[];
  summary: BudgetSummary;
}

export interface BudgetFilters {
  category_id?: number;
  status?: 'active' | 'exceeded' | 'completed' | 'paused';
  is_active?: boolean;
}

class BudgetService {
  /**
   * Get all budgets with optional filters
   */
  async getBudgets(filters?: BudgetFilters): Promise<BudgetListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.category_id) {
      params.append('category_id', filters.category_id.toString());
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }
    
    const response = await api.get(`/budgets?${params.toString()}`);
    return response.data;
  }

  /**
   * Get active budgets only
   */
  async getActiveBudgets(): Promise<Budget[]> {
    const response = await this.getBudgets({ is_active: true, status: 'active' });
    return response.budgets;
  }

  /**
   * Get exceeded budgets only
   */
  async getExceededBudgets(): Promise<Budget[]> {
    const response = await this.getBudgets({ status: 'exceeded' });
    return response.budgets;
  }

  /**
   * Create a new budget
   */
  async createBudget(budgetData: CreateBudgetRequest): Promise<Budget> {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  }

  /**
   * Update an existing budget
   */
  async updateBudget(id: number, budgetData: Partial<CreateBudgetRequest>): Promise<Budget> {
    try {
      console.log(`Updating budget ${id} with data:`, budgetData); // Debug log
      
      const response = await api.put(`/budgets/${id}`, budgetData);
      
      console.log('Update budget response:', response.data); // Debug log
      
      return response.data;
    } catch (error: any) {
      console.error('Budget update error:', error);
      
      // Improve error handling
      if (error.response?.status === 404) {
        throw new Error('Budget not found');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.detail || 'Invalid budget data');
      } else if (error.response?.status === 403) {
        throw new Error('Permission denied');
      }
      
      throw error;
    }
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`);
  }

  /**
   * Get a specific budget by ID
   */
  async getBudget(id: number): Promise<Budget> {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  }

  /**
   * Update budget usage based on current transactions
   */
  async updateBudgetUsage(id: number): Promise<Budget> {
    const response = await api.post(`/budgets/${id}/update-usage`);
    return response.data;
  }

  /**
   * Get budget overview for dashboard
   */
  async getBudgetOverview(): Promise<any> {
    const response = await api.get('/budgets/overview');
    return response.data;
  }

  /**
   * Get budget summary statistics
   */
  async getBudgetSummaryStats(): Promise<BudgetSummary> {
    const response = await api.get('/budgets/summary/stats');
    return response.data;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get status color based on budget status
   */
  getStatusColor(status: Budget['status']): string {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'exceeded':
        return 'text-red-600';
      case 'completed':
        return 'text-blue-600';
      case 'paused':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get usage color based on percentage
   */
  getUsageColor(percentage: number): string {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  }
}

export const budgetService = new BudgetService();
