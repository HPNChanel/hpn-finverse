import { useState, useEffect, useCallback } from 'react';
import transferService, { type TransferRequest } from '../services/transferService';
import { useTransactionHistory } from './useTransactionHistory';
import type { InternalTransaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseTransfersReturn {
  transactions: InternalTransaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  transferFunds: (data: TransferRequest) => Promise<InternalTransaction>;
}

export const useTransfers = (): UseTransfersReturn => {
  const [transactions, setTransactions] = useState<InternalTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { createTransfer } = useTransactionHistory();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchTransactions = useCallback(async () => {
    // Don't fetch if not authenticated or auth is still loading
    if (!isAuthenticated && !authLoading) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // Call the corrected getTransactions method
      const data = await transferService.getTransactions();
      setTransactions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions.';
      console.error('Error fetching transfers:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const transferFunds = useCallback(async (data: TransferRequest): Promise<InternalTransaction> => {
    try {
      setLoading(true);
      setError(null);
      
      // Try the new unified transaction service first
      try {
        const transferData = {
          from_account_id: data.from_account_id,
          to_account_id: data.to_account_id,
          amount: data.amount,
          description: data.note
        };
        
        const result = await createTransfer(transferData);
        
        // Convert to InternalTransaction format
        const internalResult: InternalTransaction = {
          id: result.id,
          from_account_id: result.from_account_id!,
          to_account_id: result.to_account_id!,
          amount: result.amount,
          timestamp: result.timestamp || result.created_at,
          note: result.description
        };
        
        // Update local state
        setTransactions(prev => [internalResult, ...prev]);
        
        return internalResult;
      } catch (error) {
        // If unified service fails, fall back to legacy transfer service
        console.warn('Unified transfer service failed, falling back to legacy transfer service:', error);
        const result = await transferService.transferFunds(data);
        
        // Update local state
        setTransactions(prev => [result, ...prev]);
        
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer funds.';
      console.error('Error transferring funds:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createTransfer]);

  // Fetch transactions only after auth is determined
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchTransactions();
      } else {
        // Clear transactions if not authenticated
        setTransactions([]);
      }
    }
  }, [isAuthenticated, authLoading, fetchTransactions]);

  return { transactions, loading, error, fetchTransactions, transferFunds };
};
