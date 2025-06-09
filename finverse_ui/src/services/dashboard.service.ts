import api from '@/lib/api';

// Type definitions that match the backend schemas
export interface CategoryBreakdown {
  period: string;
  transaction_type: string;
  total_amount: number;
  categories: CategoryBreakdownItem[];
  period_start: string;
  period_end: string;
}

export interface CategoryBreakdownItem {
  category_id: number;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface CashflowTrends {
  period_type: string;
  total_periods: number;
  data_points: TrendDataPoint[];
  summary: Record<string, number>;
}

export interface TrendDataPoint {
  period: string;
  period_label: string;
  income: number;
  expenses: number;
  net: number;
  period_start: string;
  period_end: string;
}

export interface FinancialSummary {
  current_month: Record<string, number>;
  previous_month: Record<string, number>;
  month_over_month_change: Record<string, number>;
  year_to_date: Record<string, number>;
  account_balances: Record<string, number>;
  top_expense_categories: CategoryBreakdownItem[];
  top_income_categories: CategoryBreakdownItem[];
  savings_rate: number;
  expense_to_income_ratio: number;
}

export interface RecentActivity {
  activities: ActivityItem[];
  total_count: number;
  has_more: boolean;
}

export interface ActivityItem {
  activity_type: string;
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  icon?: string;
  color?: string;
  action_url?: string;
}

export interface DashboardOverview {
  total_balance: number;
  total_income_month: number;
  total_expenses_month: number;
  net_income_month: number;
  accounts: AccountSummaryItem[];
  account_types_summary: Record<string, number>;
  active_budgets_count: number;
  total_budget_limit: number;
  total_budget_spent: number;
  budget_health_score: number;
  critical_budgets: BudgetSummaryItem[];
  active_goals_count: number;
  total_goals_target: number;
  total_goals_current: number;
  goals_completion_rate: number;
  urgent_goals: GoalSummaryItem[];
  active_goal?: ActiveGoalSummary;
  recent_transactions: RecentTransactionItem[];
  unread_alerts_count: number;
  spending_trend: string;
  top_expense_category?: string;
  savings_rate: number;
  current_period: string;
  period_start: string;
  period_end: string;
}

export interface AccountSummaryItem {
  account_id: number;
  account_name: string;
  account_type: string;
  balance: number;
  icon?: string;
  color?: string;
}

export interface BudgetSummaryItem {
  budget_id: number;
  budget_name: string;
  category_name: string;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
  status: string;
  days_remaining?: number;
}

export interface GoalSummaryItem {
  goal_id: number;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  progress_percentage: number;
  target_date?: string;
  days_remaining?: number;
  status: string;
}

export interface ActiveGoalSummary {
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

export interface RecentTransactionItem {
  transaction_id: number;
  amount: number;
  transaction_type: string;
  description: string;
  category_name?: string;
  account_name: string;
  wallet_name?: string; // Add wallet_name field
  transaction_date: string;
  created_at: string;
}

// Dashboard Service Class
class DashboardService {
  private baseUrl = '/dashboard';

  async getOverview(): Promise<any> {
    const response = await api.get(`${this.baseUrl}/overview`);
    return response.data.data || response.data;
  }

  async getCategoryBreakdown(
    period: string = 'month',
    transactionType: string = 'expense'
  ): Promise<any> {
    const response = await api.get(`${this.baseUrl}/category-breakdown`, {
      params: { period, transaction_type: transactionType }
    });
    return response.data.data || response.data;
  }

  async getTrends(
    period: string = 'month',
    months: number = 12
  ): Promise<any> {
    const response = await api.get(`${this.baseUrl}/trends`, {
      params: { period, months }
    });
    return response.data.data || response.data;
  }

  async getRecentActivity(limit: number = 10): Promise<any> {
    const response = await api.get(`${this.baseUrl}/recent-activity`, {
      params: { limit }
    });
    return response.data.data || response.data;
  }

  async getGoalProgress(): Promise<any> {
    const response = await api.get(`${this.baseUrl}/goal-progress`);
    return response.data.data || response.data;
  }

  async getStakingOverview(): Promise<any> {
    const response = await api.get(`${this.baseUrl}/staking-overview`);
    return response.data.data || response.data;
  }

  async getFinancialInsights(): Promise<any> {
    const response = await api.get(`${this.baseUrl}/insights`);
    return response.data.data || response.data;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// Export individual types for easier importing
export type {
  CategoryBreakdown,
  CashflowTrends,
  FinancialSummary,
  RecentActivity,
  DashboardOverview
};
