/**
 * Transaction types that match the backend Pydantic schemas
 */

export enum TransactionTypeEnum {
  EXPENSE = 0,
  INCOME = 1
}

export interface TransactionCreate {
  wallet_id: number;
  amount: number;
  transaction_type: TransactionTypeEnum;
  description?: string;
  transaction_date: string; // Format: YYYY-MM-DD
}

export interface TransactionUpdate {
  wallet_id?: number;
  amount?: number;
  transaction_type?: TransactionTypeEnum;
  description?: string;
  transaction_date?: string;
}

export interface TransactionResponse {
  id: number;
  user_id: number;
  wallet_id: number;
  amount: number;
  transaction_type: TransactionTypeEnum;
  description?: string;
  transaction_date: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionListResponse {
  transactions: TransactionResponse[];
}
