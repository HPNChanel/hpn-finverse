import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { dashboardService } from '@/services/dashboard.service';

interface RecentTransaction {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category?: string;
  account?: string;
  time: string;
  transaction_date: string;
}

interface RecentTransactionsData {
  transactions: RecentTransaction[];
  total_count: number;
  has_more: boolean;
}

interface UseRecentTransactionsReturn {
  data: RecentTransactionsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useRecentTransactions = (limit: number = 10): UseRecentTransactionsReturn => {
  const [data, setData] = useState<RecentTransactionsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchRecentTransactions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching recent transactions...');
      
      const response = await dashboardService.getRecentActivity(limit);
      
      // Transform activities to transaction format
      const transactions: RecentTransaction[] = response.activities
        ?.filter((activity: unknown) => (activity as { activity_type?: string }).activity_type === 'transaction')
        ?.map((activity: unknown) => {
          const act = activity as { 
            transaction_id?: number; 
            amount?: number; 
            title?: string; 
            description?: string; 
            category_name?: string; 
            account_name?: string; 
            timestamp?: string;
          };
          return {
            id: act.transaction_id || Math.random(),
            type: determineTransactionType(act),
            amount: Math.abs(act.amount || 0),
            description: act.title || act.description || 'Transaction',
            category: act.category_name,
            account: act.account_name,
            time: formatRelativeTime(act.timestamp || ''),
            transaction_date: act.timestamp || '',
          };
        }) || [];

      // If no transaction activities, try to get from overview
      if (transactions.length === 0) {
        const overviewResponse = await dashboardService.getOverview();
        const recentTxns = overviewResponse.recent_transactions || [];
        
        transactions.push(...recentTxns.map((txn: unknown) => {
          const transaction = txn as {
            transaction_id?: number;
            amount?: number;
            description?: string;
            category_name?: string;
            account_name?: string;
            transaction_date?: string;
            created_at?: string;
          };
          return {
            id: transaction.transaction_id || 0,
            type: determineTransactionType(transaction),
            amount: Math.abs(transaction.amount || 0),
            description: transaction.description || '',
            category: transaction.category_name,
            account: transaction.account_name,
            time: formatRelativeTime(transaction.transaction_date || transaction.created_at || ''),
            transaction_date: transaction.transaction_date || transaction.created_at || '',
          };
        }));
      }

      const transactionsData: RecentTransactionsData = {
        transactions: transactions.slice(0, limit),
        total_count: response.total_count || transactions.length,
        has_more: response.has_more || false,
      };

      setData(transactionsData);
      setLastUpdated(new Date());
      console.log(`✅ Loaded ${transactions.length} recent transactions`);
      
    } catch (err: unknown) {
      console.error('❌ Failed to fetch recent transactions:', err);
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load recent transactions';
      setError(errorMessage);
      
      toast({
        title: "Error Loading Transactions",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, limit, toast]);

  const determineTransactionType = (item: { transaction_type?: string; amount?: number; title?: string }): 'income' | 'expense' | 'transfer' => {
    if (item.transaction_type === 'income' || item.transaction_type === '1' || (item.amount && item.amount > 0)) {
      return 'income';
    }
    if (item.transaction_type === 'transfer' || item.title?.toLowerCase().includes('transfer')) {
      return 'transfer';
    }
    return 'expense';
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return minutes <= 1 ? 'just now' : `${minutes} minutes ago`;
    }
    if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (days < 7) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    
    return date.toLocaleDateString();
  };

  // Fetch data on mount and when auth status changes
  useEffect(() => {
    fetchRecentTransactions();
  }, [fetchRecentTransactions]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchRecentTransactions,
    lastUpdated,
  };
}; 