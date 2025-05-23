/**
 * Shared type definitions for account-related data
 * These should match the Pydantic models in the backend
 */

// Account creation request - must match backend FinancialAccountCreate model
export interface AccountCreateRequest {
  name: string;
  type: string;
  initial_balance: number;
  note?: string;
  icon?: string;
  color?: string;
  currency: string;
}

// Account type definition - must match backend AccountType model
export interface AccountType {
  type: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

// Account response - must match FinancialAccountResponse model
export interface AccountResponse {
  id: number;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  created_at: string;
  updated_at?: string;
  note?: string;
  icon?: string;
  color?: string;
  created_by_default: boolean;
  currency: string;
}

// Top-up request - must match TopUpRequest model
export interface TopUpRequest {
  account_id: number;
  amount: number;
  note?: string;
}
