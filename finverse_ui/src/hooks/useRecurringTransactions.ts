import { useState, useEffect, useCallback } from 'react';
import { 
  recurringTransactionService
} from '../services/recurringTransactionService';
import type { 
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate
} from '../services/recurringTransactionService';

interface UseRecurringTransactionsReturn {
  recurringTransactions: RecurringTransaction[];
  loading: boolean;
  error: string | null;
  fetchRecurringTransactions: () => Promise<void>;
  getRecurringTransaction: (id: number) => Promise<RecurringTransaction | undefined>;
  createRecurringTransaction: (data: RecurringTransactionCreate) => Promise<RecurringTransaction | undefined>;
  updateRecurringTransaction: (id: number, data: RecurringTransactionUpdate) => Promise<RecurringTransaction | undefined>;
  deleteRecurringTransaction: (id: number) => Promise<boolean>;
  processRecurringTransaction: (id: number) => Promise<RecurringTransaction | undefined>;
}

export const useRecurringTransactions = (): UseRecurringTransactionsReturn => {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all recurring transactions
  const fetchRecurringTransactions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const transactions = await recurringTransactionService.getRecurringTransactions();
      setRecurringTransactions(transactions);
    } catch (err) {
      setError('Failed to fetch recurring transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a specific recurring transaction by ID
  const getRecurringTransaction = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      return await recurringTransactionService.getRecurringTransaction(id);
    } catch (err) {
      setError(`Failed to fetch recurring transaction #${id}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new recurring transaction
  const createRecurringTransaction = useCallback(async (data: RecurringTransactionCreate) => {
    setLoading(true);
    setError(null);
    try {
      const newTransaction = await recurringTransactionService.createRecurringTransaction(data);
      setRecurringTransactions(prev => [...prev, newTransaction]);
      return newTransaction;
    } catch (err) {
      setError('Failed to create recurring transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing recurring transaction
  const updateRecurringTransaction = useCallback(async (id: number, data: RecurringTransactionUpdate) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTransaction = await recurringTransactionService.updateRecurringTransaction(id, data);
      setRecurringTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
      return updatedTransaction;
    } catch (err) {
      setError(`Failed to update recurring transaction #${id}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a recurring transaction
  const deleteRecurringTransaction = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const success = await recurringTransactionService.deleteRecurringTransaction(id);
      if (success) {
        setRecurringTransactions(prev => 
          prev.filter(transaction => transaction.id !== id)
        );
      }
      return success;
    } catch (err) {
      setError(`Failed to delete recurring transaction #${id}`);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process a recurring transaction (update next occurrence)
  const processRecurringTransaction = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const processedTransaction = await recurringTransactionService.processRecurringTransaction(id);
      setRecurringTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? processedTransaction : transaction
        )
      );
      return processedTransaction;
    } catch (err) {
      setError(`Failed to process recurring transaction #${id}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load recurring transactions on component mount
  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  return {
    recurringTransactions,
    loading,
    error,
    fetchRecurringTransactions,
    getRecurringTransaction,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processRecurringTransaction
  };
}; 