import { useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transactionService';
import type { Transaction } from '../types';
import type { CreateTransactionRequest, TransactionFilters, UpdateTransactionRequest } from '../services/transactionService';
import { TransactionTypeEnum } from '../types/transactionTypes';

interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchHistory: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (data: CreateTransactionRequest) => Promise<Transaction>;
  updateTransaction: (id: number, data: UpdateTransactionRequest) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<boolean>;
  createTransfer: (data: any) => Promise<Transaction>;
}

export const useTransactionHistory = (): UseTransactionHistoryReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (filters?: TransactionFilters): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getTransactionHistory(filters);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load transaction history on component mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const createTransaction = useCallback(async (data: CreateTransactionRequest): Promise<Transaction> => {
    setLoading(true);
    setError(null);
    try {
      // Log data for debugging
      console.log('Creating transaction with data:', JSON.stringify(data, null, 2));
      
      const transaction = await transactionService.createTransaction(data);
      setTransactions(prev => [transaction, ...prev]);
      return transaction;
    } catch (err) {
      console.error('Error creating transaction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTransaction = useCallback(async (id: number, data: UpdateTransactionRequest): Promise<Transaction> => {
    setLoading(true);
    setError(null);
    try {
      const updatedTransaction = await transactionService.updateTransaction(id, data);
      setTransactions(prev => 
        prev.map(transaction => transaction.id === id ? updatedTransaction : transaction)
      );
      return updatedTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update transaction #${id}`);
      console.error('Error in updateTransaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const success = await transactionService.deleteTransaction(id);
      if (success) {
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete transaction #${id}`);
      console.error('Error in deleteTransaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransfer = useCallback(async (data: any): Promise<Transaction> => {
    setLoading(true);
    setError(null);
    try {
      const transfer = await transactionService.createTransaction({ ...data, type: TransactionTypeEnum.TRANSFER });
      setTransactions(prev => [transfer, ...prev]);
      return transfer;
    } catch (err) {
      console.error('Error creating transfer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transfer';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    fetchHistory,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createTransfer
  };
};

export default useTransactionHistory;