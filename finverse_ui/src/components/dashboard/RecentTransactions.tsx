import React from 'react';
import { CreditCard, RefreshCw, ArrowUpRight, ArrowDownRight, Calendar, Plus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorHandler } from '@/utils/errorHandler';

interface ActivityItem {
  activity_type: string;
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  icon?: string;
  color?: string;
  action_url?: string;
}

interface RecentTransactionsProps {
  transactions: ActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
  onTransactionChange?: () => void; // New callback prop
}

export function RecentTransactions({ 
  transactions, 
  loading = false, 
  onRefresh,
  onTransactionChange 
}: RecentTransactionsProps) {
  const navigate = useNavigate();

  // Safe data processing with comprehensive error handling
  const safeTransactions = React.useMemo(() => {
    try {
      if (!transactions) return [];
      if (!Array.isArray(transactions)) {
        console.warn('RecentTransactions: transactions prop is not an array:', transactions);
        return [];
      }
      
      // Filter out invalid transaction objects
      return transactions.filter(transaction => {
        if (!transaction || typeof transaction !== 'object') return false;
        if (typeof transaction.title !== 'string') return false;
        if (typeof transaction.description !== 'string') return false;
        return true;
      });
    } catch (error) {
      ErrorHandler.logError(error, 'RecentTransactions: Processing transactions');
      return [];
    }
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      ErrorHandler.logError(error, 'Format Currency');
      return `$${amount || 0}`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      ErrorHandler.logError(error, 'Format Date');
      return 'Invalid Date';
    }
  };

  const getActivityIcon = (activityType: string, icon?: string, transactionType?: number) => {
    if (icon) {
      switch (icon) {
        case 'expense':
          return <ArrowDownRight className="w-4 h-4 text-red-500" />;
        case 'account_balance':
        case 'income':
          return <ArrowUpRight className="w-4 h-4 text-green-500" />;
        case 'warning':
        case 'alert':
          return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        default:
          return <CreditCard className="w-4 h-4 text-blue-500" />;
      }
    }

    // For transaction activities, use transaction_type if available
    if (activityType === 'transaction' && transactionType !== undefined) {
      return transactionType === 0 
        ? <ArrowUpRight className="w-4 h-4 text-green-500" /> // Income
        : <ArrowDownRight className="w-4 h-4 text-red-500" />; // Expense
    }

    // Fallback based on activity type
    switch (activityType) {
      case 'transaction':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'budget_alert':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'goal_milestone':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (activityType: string, color?: string, amount?: number, transactionType?: number) => {
    if (color) return color;
    
    if (activityType === 'transaction') {
      if (transactionType !== undefined) {
        return transactionType === 0 ? 'text-green-600' : 'text-red-600'; // 0 = Income (green), 1 = Expense (red)
      }
      if (amount !== undefined) {
        return amount > 0 ? 'text-green-600' : 'text-red-600';
      }
    }
    
    switch (activityType) {
      case 'budget_alert':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // Add helper function to format transaction amount correctly
  const formatTransactionAmount = (amount: number, transactionType?: number) => {
    const absAmount = Math.abs(amount);
    const formattedAmount = formatCurrency(absAmount);
    
    if (transactionType !== undefined) {
      return transactionType === 0 ? `+${formattedAmount}` : `-${formattedAmount}`; // 0 = Income (+), 1 = Expense (-)
    }
    
    // Fallback to existing logic
    return amount > 0 ? `+${formattedAmount}` : `-${formattedAmount}`;
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.action_url) {
      window.location.href = activity.action_url;
    } else if (activity.activity_type === 'transaction') {
      // Navigate to transactions page or show transaction details
      window.location.href = '/transactions';
      
      // Trigger budget refresh if callback provided
      if (onTransactionChange) {
        onTransactionChange();
      }
    } else if (activity.activity_type === 'budget_alert') {
      window.location.href = '/budgets';
    } else if (activity.activity_type === 'goal_milestone') {
      window.location.href = '/goals';
    }
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Recent Activity
        </h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-muted animate-pulse rounded" />
                <div className="w-1/2 h-3 bg-muted animate-pulse rounded" />
              </div>
              <div className="w-16 h-4 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : safeTransactions.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">No recent activity</p>
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {safeTransactions.slice(0, 5).map((activity, index) => (
            <div 
              key={`activity-${index}-${activity.activity_type}-${activity.timestamp}-${Date.now()}`}
              className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer"
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex-shrink-0 p-2 bg-muted rounded-full">
                {getActivityIcon(activity.activity_type, activity.icon, (activity as any).transaction_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {activity.title}
                </h4>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
              
              {activity.amount !== undefined && (
                <div className={`text-right ${getActivityColor(activity.activity_type, activity.color, activity.amount, (activity as any).transaction_type)}`}>
                  <div className="font-medium">
                    {formatTransactionAmount(activity.amount, (activity as any).transaction_type)}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {safeTransactions.length > 5 && (
            <button
              onClick={() => navigate('/transactions')}
              className="w-full py-2 text-sm text-primary hover:text-primary/80 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              View {safeTransactions.length - 5} more activities
            </button>
          )}
        </div>
      )}
    </div>
  );
}
