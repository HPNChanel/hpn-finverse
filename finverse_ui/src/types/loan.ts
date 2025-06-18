/**
 * TypeScript types for Loan Simulation Module
 * 
 * Defines all interfaces, types, and enums for loan simulation:
 * - Loan creation and management types
 * - Calculation request/response types
 * - Repayment schedule and payment types
 * - Analytics and summary types
 */

// Standard API response wrapper
export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Enums for loan configuration
export enum LoanType {
  PERSONAL = "personal",
  MORTGAGE = "mortgage",
  EDUCATION = "education",
  BUSINESS = "business",
  AUTO = "auto",
  HOME_IMPROVEMENT = "home_improvement",
  CREDIT_CARD = "credit_card",
  EMERGENCY = "emergency",
  OTHER = "other"
}

export enum InterestType {
  FIXED = "fixed",
  VARIABLE = "variable",
  HYBRID = "hybrid"
}

export enum AmortizationType {
  REDUCING_BALANCE = "reducing_balance",
  FLAT_RATE = "flat_rate",
  BULLET_PAYMENT = "bullet_payment"
}

export enum RepaymentFrequency {
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SEMI_ANNUALLY = "semi_annually",
  ANNUALLY = "annually"
}

export enum LoanStatus {
  PENDING = "pending",
  APPROVED = "approved",
  ACTIVE = "active",
  COMPLETED = "completed",
  DEFAULTED = "defaulted",
  REJECTED = "rejected",
  CLOSED = "closed",
  SIMULATED = "simulated",
  CANCELLED = "cancelled"
}

// Base interfaces
export interface LoanBase {
  loan_name: string;
  loan_type: LoanType;
  purpose?: string;
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number;
  start_date: string; // ISO date string
  
  // Interest configuration
  interest_type: InterestType;
  variable_rate_adjustment_frequency?: number;
  hybrid_fixed_period?: number;
  
  // Loan terms
  repayment_frequency: RepaymentFrequency;
  amortization_type: AmortizationType;
  
  // Optional fields
  notes?: string;
}

// Request types
export interface LoanCalculationRequest {
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number;
  repayment_frequency: RepaymentFrequency;
  amortization_type: AmortizationType;
}

export interface LoanCreateRequest extends LoanBase {
  is_simulation: boolean;
}

export interface LoanUpdateRequest {
  loan_name?: string;
  purpose?: string;
  notes?: string;
  status?: LoanStatus;
}

export interface LoanPaymentRequest {
  payment_amount: number;
  payment_date: string; // ISO date string
  payment_type: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  is_simulated: boolean;
}

// Response types
export interface LoanCalculationResult {
  emi_amount: number;
  total_interest: number;
  total_payment: number;
  effective_interest_rate: number;
  monthly_payment: number;
  payment_count: number;
}

export interface RepaymentScheduleItem {
  installment_number: number;
  due_date: string; // ISO date string
  installment_amount: number;
  principal_component: number;
  interest_component: number;
  opening_balance: number;
  closing_balance: number;
  is_paid: boolean;
  is_overdue: boolean;
  days_overdue?: number;
}

export interface LoanPaymentRecord {
  id: number;
  payment_date: string; // ISO date string
  payment_amount: number;
  payment_type: string;
  principal_paid: number;
  interest_paid: number;
  late_fee_paid: number;
  payment_method?: string;
  payment_reference?: string;
  is_simulated: boolean;
  notes?: string;
}

export interface LoanResponse extends LoanBase {
  id: number;
  user_id: number;
  current_balance: number;
  outstanding_balance?: number;
  emi_amount: number;
  emi: number; // alias for emi_amount
  total_interest: number;
  total_payment: number;
  status: LoanStatus;
  is_simulation: boolean;
  payments_made: number;
  last_payment_date?: string; // ISO date string
  next_payment_date?: string; // ISO date string
  maturity_date: string; // ISO date string
  created_at: string; // ISO datetime string
  updated_at?: string; // ISO datetime string
  simulation_uuid: string;
  // Additional fields for components
  principal: number; // alias for principal_amount
  annual_interest_rate: number; // alias for interest_rate
  term_months: number; // alias for loan_term_months
  start_date: string;
  end_date: string;
  purpose?: string;
}

export interface LoanDetailResponse extends LoanResponse {
  repayment_schedule: RepaymentScheduleItem[];
  payment_history: LoanPaymentRecord[];
  remaining_payments: number;
  completion_percentage: number;
}

export interface LoanSummaryResponse {
  total_loans: number;
  active_loans: number;
  simulated_loans: number;
  completed_loans: number;
  total_borrowed: number;
  total_remaining: number;
  total_interest_paid: number;
  average_interest_rate: number;
}

export interface LoanAnalyticsResponse {
  total_interest_savings: number;
  payoff_acceleration_months: number;
  recommended_extra_payment: number;
  interest_to_principal_ratio: number;
}

export interface LoanListResponse {
  loans: LoanResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Configuration options
export interface LoanOptions {
  loan_types: string[];
  interest_types: string[];
  amortization_types: string[];
  repayment_frequencies: string[];
  loan_statuses: string[];
}

// UI-specific types
export interface LoanFormData extends Omit<LoanCreateRequest, 'start_date'> {
  start_date: Date;
}

export interface LoanCalculatorData extends Omit<LoanCalculationRequest, 'principal_amount' | 'interest_rate'> {
  principal_amount: string;
  interest_rate: string;
}

export interface LoanFilters {
  status?: LoanStatus;
  loan_type?: LoanType;
  simulations_only?: boolean;
  search?: string;
}

// Chart data types for visualizations
export interface LoanChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface AmortizationChartData {
  month: number;
  principal: number;
  interest: number;
  balance: number;
  cumulative_interest: number;
  cumulative_principal: number;
}

export interface PaymentBreakdownData {
  principal_percentage: number;
  interest_percentage: number;
  principal_amount: number;
  interest_amount: number;
}

// Error types
export interface LoanError {
  field?: string;
  message: string;
  code?: string;
}

// Hook types for React hooks
export interface UseLoanCalculatorReturn {
  calculation: LoanCalculationResult | null;
  isCalculating: boolean;
  error: string | null;
  calculate: (request: LoanCalculationRequest) => Promise<void>;
  reset: () => void;
}

export interface UseLoansReturn {
  loans: LoanResponse[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createLoan: (request: LoanCreateRequest) => Promise<LoanDetailResponse>;
  updateLoan: (id: number, request: LoanUpdateRequest) => Promise<LoanResponse>;
  deleteLoan: (id: number) => Promise<boolean>;
}

export interface UseLoanDetailsReturn {
  loan: LoanDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  makePayment: (request: LoanPaymentRequest) => Promise<LoanDetailResponse>;
}

// Utility types
export type LoanField = keyof LoanBase;
export type LoanCalculationField = keyof LoanCalculationRequest;
export type LoanStatusFilter = LoanStatus | 'all';
export type LoanTypeFilter = LoanType | 'all';

// Form validation types
export interface LoanValidationErrors {
  [key: string]: string | undefined;
  loan_name?: string;
  principal_amount?: string;
  interest_rate?: string;
  loan_term_months?: string;
  start_date?: string;
}

export interface LoanCalculationValidationErrors {
  [key: string]: string | undefined;
  principal_amount?: string;
  interest_rate?: string;
  loan_term_months?: string;
}

// Additional types for the loan components
export interface LoanApplicationRequest {
  loan_type: LoanType;
  principal: number;
  annual_interest_rate: number;
  term_months: number;
  interest_type: InterestType;
  amortization_type: AmortizationType;
  repayment_frequency: RepaymentFrequency;
  purpose?: string;
  collateral_value?: number;
  metadata?: Record<string, unknown>;
}

export interface LoanCalculationResponse {
  principal: number;
  annual_interest_rate: number;
  term_months: number;
  emi: number;
  total_amount: number;
  total_interest: number;
  effective_interest_rate: number;
  amortization_schedule?: LoanRepaymentScheduleResponse[];
}

export interface LoanRepaymentScheduleResponse {
  payment_number: number;
  due_date: string;
  emi_amount: number;
  principal_payment: number;
  interest_payment: number;
  remaining_balance: number;
}

export interface LoanPaymentResponse {
  id: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  payment_type: string;
  principal_component?: number;
  interest_component?: number;
  remaining_balance?: number;
  notes?: string;
}

export interface LoanPortfolioResponse {
  total_loans: number;
  total_principal: number;
  total_outstanding: number;
  total_monthly_payment: number;
  average_interest_rate: number;
  loan_breakdown?: Array<{
    loan_type: LoanType;
    count: number;
    total_outstanding: number;
  }>;
  upcoming_payments?: Array<{
    due_date: string;
    amount: number;
    principal_component: number;
    interest_component: number;
  }>;
  recent_activity?: Array<{
    description: string;
    date: string;
    type: string;
  }>;
  recommendations?: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    potential_savings?: number;
  }>;
  monthly_income?: number;
  next_payment_date?: string;
  next_payment_amount?: number;
  debt_to_income_ratio?: number;
  payment_performance?: {
    on_time_percentage: number;
    total_payments: number;
  };
}

export enum PaymentType {
  REGULAR = "regular",
  EXTRA = "extra",
  PREPAYMENT = "prepayment",
  PARTIAL = "partial"
} 