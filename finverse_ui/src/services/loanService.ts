/**
 * Loan Service for FinVerse UI
 * 
 * Provides API calls for loan simulation and management:
 * - Loan calculations and simulations
 * - CRUD operations for loans
 * - Payment processing
 * - Analytics and reporting
 */

import axios from 'axios';
import type {
  LoanCalculationRequest,
  LoanCalculationResult,
  LoanCreateRequest,
  LoanUpdateRequest,
  LoanPaymentRequest,
  LoanResponse,
  LoanDetailResponse,
  LoanSummaryResponse,
  LoanAnalyticsResponse,

  LoanOptions,
  LoanType,
  LoanStatus,
  StandardResponse
} from '../types/loan';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Debug log for API base URL
console.log('💰 Loan Service API Base URL:', API_BASE_URL);

class LoanServiceClass {
  private get apiClient() {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('access_token') && {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        })
      }
    });
  }

  // Calculate loan without creating
  async calculateLoan(request: LoanCalculationRequest): Promise<LoanCalculationResult> {
    const response = await this.apiClient.post<StandardResponse<LoanCalculationResult>>(
      '/loans/calculate',
      request
    );
    return response.data.data;
  }

  // Simulate multiple loan scenarios
  async simulateLoans(scenarios: LoanCalculationRequest[]): Promise<LoanCalculationResult[]> {
    const results = await Promise.all(
      scenarios.map(scenario => this.calculateLoan(scenario))
    );
    return results;
  }

  // Get loans with filters
  async getLoans(params: {
    status?: LoanStatus | string;
    loan_type?: LoanType;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<LoanResponse[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.apiClient.get<StandardResponse<LoanResponse[]>>(
      `/loans?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // Get single loan
  async getLoan(id: number): Promise<LoanDetailResponse> {
    const response = await this.apiClient.get<StandardResponse<LoanDetailResponse>>(`/loans/${id}`);
    return response.data.data;
  }

  // Create loan
  async createLoan(request: LoanCreateRequest): Promise<LoanDetailResponse> {
    const response = await this.apiClient.post<StandardResponse<LoanDetailResponse>>('/loans', request);
    return response.data.data;
  }

  // Update loan
  async updateLoan(id: number, updates: LoanUpdateRequest): Promise<LoanResponse> {
    const response = await this.apiClient.put<StandardResponse<LoanResponse>>(`/loans/${id}`, updates);
    return response.data.data;
  }

  // Get portfolio summary
  async getPortfolioSummary(): Promise<LoanSummaryResponse> {
    const response = await this.apiClient.get<StandardResponse<LoanSummaryResponse>>('/loans/summary/portfolio');
    return response.data.data;
  }

  // Get loan schedule (TODO: Backend endpoint not implemented yet)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getLoanSchedule(_loanId: number) {
    throw new Error('getLoanSchedule endpoint not implemented in backend yet');
  }

  // Get loan payments (TODO: Backend endpoint not implemented yet)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getLoanPayments(_loanId: number) {
    throw new Error('getLoanPayments endpoint not implemented in backend yet');
  }

  // Make payment (TODO: Backend endpoint not implemented yet)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async makePayment(_loanId: number, _payment: LoanPaymentRequest) {
    throw new Error('makePayment endpoint not implemented in backend yet');
  }

  // Get loan analytics (TODO: Backend endpoint not implemented yet)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getLoanAnalytics(_loanId: number): Promise<LoanAnalyticsResponse> {
    throw new Error('getLoanAnalytics endpoint not implemented in backend yet');
  }

  // Get configurations
  async getConfigurations(): Promise<LoanOptions> {
    const response = await this.apiClient.get<StandardResponse<LoanOptions>>('/loans/types/options');
    return response.data.data;
  }

  // Calculate prepayment impact
  async calculatePrepayment(loanId: number, amount: number) {
    const response = await this.apiClient.post(`/loans/${loanId}/prepayment-calculation`, { amount });
    return response.data.data;
  }

  // Close loan
  async closeLoan(loanId: number): Promise<LoanResponse> {
    const response = await this.apiClient.post<StandardResponse<LoanResponse>>(`/loans/${loanId}/close`);
    return response.data.data;
  }

  // Refinance loan
  async refinanceLoan(loanId: number, refinanceData: Record<string, unknown>) {
    const response = await this.apiClient.post(`/loans/${loanId}/refinance`, refinanceData);
    return response.data.data;
  }

  // Bulk payment
  async bulkPayment(payments: Array<{ loanId: number; payment: LoanPaymentRequest }>) {
    const response = await this.apiClient.post('/loans/bulk-payment', { payments });
    return response.data.data;
  }

  // Export statement
  async exportStatement(loanId: number, format = 'pdf', dateRange?: { from: string; to: string }) {
    const params = new URLSearchParams({ format });
    if (dateRange) {
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);
    }
    
    const response = await this.apiClient.get(`/loans/${loanId}/statement?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const loanService = new LoanServiceClass();
export default loanService; 