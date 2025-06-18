// Import the centralized Axios instance
import { apiClient } from '@/lib/axios';

export interface SavingsPlan {
  id: number;
  source_account_id: number;
  name: string;
  initial_amount: number;
  monthly_contribution: number;
  interest_rate: number;
  duration_months: number;
  interest_type: 'simple' | 'compound';
  created_at: string;
  updated_at: string;
  // Additional UI fields
  source_account_name?: string;
  source_account_balance?: number;
}

export interface SavingsProjection {
  id: number;
  plan_id: number;
  month_index: number;
  balance: number;
  interest_earned: number;
}

export interface SavingsPlanDetail extends SavingsPlan {
  projections: SavingsProjection[];
  total_interest: number;
  final_value: number;
}

export interface CreateSavingsPlanRequest {
  name: string;
  source_account_id: number;
  initial_amount: number;
  monthly_contribution: number;
  interest_rate: number;
  duration_months: number;
  interest_type: 'simple' | 'compound';
}

export interface UpdateSavingsPlanRequest {
  name?: string;
  source_account_id?: number;
  initial_amount?: number;
  monthly_contribution?: number;
  interest_rate?: number;
  duration_months?: number;
  interest_type?: 'simple' | 'compound';
}

export interface SavingsCalculationRequest {
  initial_amount: number;
  monthly_contribution: number;
  interest_rate: number;
  duration_months: number;
  interest_type: 'simple' | 'compound';
}

export interface SavingsCalculationResponse {
  monthly_projections: Array<{
    month_index: number;
    balance: number;
    interest_earned: number;
  }>;
  total_contributions: number;
  total_interest: number;
  final_value: number;
}

export interface SavingsSummary {
  total_plans: number;
  total_saved: number;
  total_projected_value: number;
  total_projected_interest: number;
}

export interface FinancialAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

// API response wrapper interfaces
interface SavingsPlansResponse {
  success: boolean;
  message: string;
  data: SavingsPlan[];
}

/**
 * Savings API Service
 * Uses centralized Axios instance with authentication and error handling
 */
export const savingsApi = {
  /**
   * Get all savings plans for the authenticated user
   */
  async getSavingsPlans(): Promise<SavingsPlan[]> {
    try {
      console.log('📊 Fetching savings plans...');
      const response = await apiClient.get<SavingsPlansResponse>('/savings');
      console.log('✅ Savings plans fetched successfully:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch savings plans:', error);
      throw error;
    }
  },

  /**
   * Get detailed savings plan with projections
   */
  async getSavingsPlanDetail(planId: number): Promise<SavingsPlanDetail> {
    try {
      console.log(`📊 Fetching savings plan details for ID: ${planId}`);
      const response = await apiClient.get<SavingsPlanDetail>(`/savings/${planId}`);
      console.log('✅ Savings plan details fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch savings plan details for ID ${planId}:`, error);
      throw error;
    }
  },

  /**
   * Get projections for a specific savings plan
   */
  async getSavingsPlanProjections(planId: number): Promise<SavingsProjection[]> {
    try {
      console.log(`📈 Fetching projections for savings plan ID: ${planId}`);
      const response = await apiClient.get<SavingsProjection[]>(`/savings/${planId}/projections`);
      console.log('✅ Savings plan projections fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch projections for savings plan ID ${planId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new savings plan
   */
  async createSavingsPlan(planData: CreateSavingsPlanRequest): Promise<SavingsPlanDetail> {
    try {
      console.log('📝 Creating savings plan:', planData);
      const response = await apiClient.post<SavingsPlanDetail>('/savings', planData);
      console.log('✅ Savings plan created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create savings plan:', error);
      throw error;
    }
  },

  /**
   * Update an existing savings plan
   */
  async updateSavingsPlan(planId: number, updateData: UpdateSavingsPlanRequest): Promise<SavingsPlanDetail> {
    try {
      console.log(`📝 Updating savings plan ID ${planId}:`, updateData);
      const response = await apiClient.put<SavingsPlanDetail>(`/savings/${planId}`, updateData);
      console.log('✅ Savings plan updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to update savings plan ID ${planId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a savings plan
   */
  async deleteSavingsPlan(planId: number): Promise<void> {
    try {
      console.log(`🗑️ Deleting savings plan ID: ${planId}`);
      await apiClient.delete(`/savings/${planId}`);
      console.log('✅ Savings plan deleted successfully');
    } catch (error) {
      console.error(`❌ Failed to delete savings plan ID ${planId}:`, error);
      throw error;
    }
  },

  /**
   * Calculate savings projections (preview without saving)
   */
  async calculateSavings(calculationData: SavingsCalculationRequest): Promise<SavingsCalculationResponse> {
    try {
      console.log('🧮 Calculating savings projections:', calculationData);
      const response = await apiClient.post<SavingsCalculationResponse>('/savings/calculate', calculationData);
      console.log('✅ Savings calculation completed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to calculate savings:', error);
      throw error;
    }
  },

  /**
   * Get savings summary statistics
   */
  async getSavingsSummary(): Promise<SavingsSummary> {
    try {
      console.log('📈 Fetching savings summary...');
      const response = await apiClient.get<SavingsSummary>('/savings/summary/stats');
      console.log('✅ Savings summary fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch savings summary:', error);
      throw error;
    }
  },

  /**
   * Get current user balance
   */
  async getUserBalance(): Promise<{ user_id: number; total_balance: number; currency: string; last_updated: string }> {
    try {
      console.log('💰 Fetching user balance...');
      const response = await apiClient.get<{ user_id: number; total_balance: number; currency: string; last_updated: string }>('/savings/balance/current');
      console.log('✅ User balance fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user balance:', error);
      throw error;
    }
  },

  /**
   * Sync user balance from financial accounts
   */
  async syncUserBalance(): Promise<{ user_id: number; total_balance: number; currency: string; last_updated: string }> {
    try {
      console.log('🔄 Syncing user balance from financial accounts...');
      const response = await apiClient.post<{ user_id: number; total_balance: number; currency: string; last_updated: string }>('/savings/balance/sync');
      console.log('✅ User balance synced successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to sync user balance:', error);
      throw error;
    }
  },

  /**
   * Get all financial accounts for the authenticated user
   */
  async getFinancialAccounts(): Promise<FinancialAccount[]> {
    try {
      console.log('🏦 Fetching financial accounts...');
      const response = await apiClient.get<FinancialAccount[]>('/savings/financial-accounts');
      console.log('✅ Financial accounts fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch financial accounts:', error);
      throw error;
    }
  },
}; 