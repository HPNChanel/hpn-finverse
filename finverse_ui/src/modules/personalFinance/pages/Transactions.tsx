import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Filter, Download, Search, Calendar, DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { categoryService, Category } from '@/services/categoryService';
import { transactionService } from '@/services/transaction.service';
import { ErrorHandler } from '@/utils/errorHandler.tsx';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Update the interface to match our new unified Transaction type
interface Transaction {
  id: number;
  user_id: number;
  financial_account_id: number;  // Primary field
  wallet_id: number;  // Keep for backward compatibility
  category_id?: number;
  amount: number;
  transaction_type: number; // 0 = expense, 1 = income
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string | null;
  // UI helper fields
  wallet_name?: string;
  account_name?: string; // Legacy field for compatibility
  category_name?: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface TransactionFilters {
  transaction_type?: number;
  wallet_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

interface CreateTransactionRequest {
  amount: number;
  transaction_type: number;
  wallet_id: number;
  category_id?: number;
  description: string;
  transaction_date: string;
}

interface UpdateTransactionRequest {
  amount: number;
  transaction_type: number;
  wallet_id: number;
  category_id?: number;
  description: string;
  transaction_date: string;
}

interface MonthlyStats {
  year: number;
  monthly_data: Array<{
    month: number;
    income: number;
    expense: number;
  }>;
  total_income: number;
  total_expense: number;
  net_income: number;
}

export function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('table');

  const itemsPerPage = 20;

  // Helper function to handle errors consistently
  const handleError = (err: any, operation: string): string => {
    return ErrorHandler.handleApiError(err, operation);
  };

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchMonthlyStats();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions(true);
  }, [filters]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts/list');
      setAccounts(response.data.accounts || []);
    } catch (err) {
      const errorMessage = handleError(err, 'Fetch accounts');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async (reset = false) => {
    try {
      setLoading(true);
      
      // Use the new transaction service
      let fetchedTransactions = await transactionService.getTransactions(filters);

      // Client-side filtering for search (if needed)
      if (filters.search) {
        fetchedTransactions = fetchedTransactions.filter((t: Transaction) =>
          t.description?.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }

      // Enhanced deduplication with robust ID checking
      const uniqueTransactionsMap = new Map<number, Transaction>();
      
      // Add existing transactions to map first (for non-reset scenarios)
      if (!reset) {
        transactions.forEach(t => {
          if (t && t.id) {
            uniqueTransactionsMap.set(t.id, t);
          }
        });
      }
      
      // Add fetched transactions, overwriting any duplicates
      fetchedTransactions.forEach((t: Transaction) => {
        if (t && t.id) {
          uniqueTransactionsMap.set(t.id, t);
        }
      });
      
      // Convert back to array and sort by date/creation time
      const uniqueTransactions = Array.from(uniqueTransactionsMap.values())
        .sort((a, b) => {
          // Primary sort: transaction_date descending
          const dateA = new Date(a.transaction_date).getTime();
          const dateB = new Date(b.transaction_date).getTime();
          if (dateB !== dateA) return dateB - dateA;
          
          // Secondary sort: created_at descending
          const createdA = new Date(a.created_at).getTime();
          const createdB = new Date(b.created_at).getTime();
          return createdB - createdA;
        });

      setTransactions(uniqueTransactions);
      if (reset) {
        setCurrentPage(1);
      }
      
      setHasMore(fetchedTransactions.length === itemsPerPage);
    } catch (err) {
      const errorMessage = handleError(err, 'Fetch transactions');
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const statsData = await transactionService.getMonthlyStats();
      setMonthlyStats(statsData);
    } catch (err) {
      const errorMessage = handleError(err, 'Fetch monthly stats');
      toast({
        title: "Error",
        description: "Failed to fetch monthly statistics.",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      const errorMessage = handleError(err, 'Fetch categories');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const createTransaction = async (transactionData: CreateTransactionRequest) => {
    try {
      await transactionService.createTransaction(transactionData);
      await fetchTransactions(true);
      await fetchMonthlyStats();
      setIsCreateModalOpen(false);
      
      toast({
        title: "Success",
        description: "Transaction created successfully.",
      });
    } catch (err: any) {
      const errorMessage = handleError(err, 'Create transaction');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateTransaction = async (transactionId: number, updateData: UpdateTransactionRequest) => {
    try {
      await transactionService.updateTransaction(transactionId, updateData);
      await fetchTransactions(true);
      await fetchMonthlyStats();
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      
      toast({
        title: "Success",
        description: "Transaction updated successfully.",
      });
    } catch (err: any) {
      const errorMessage = handleError(err, 'Update transaction');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteTransaction = async (transactionId: number) => {
    try {
      await transactionService.deleteTransaction(transactionId);
      setTransactions(transactions.filter(t => t.id !== transactionId));
      await fetchMonthlyStats();
      setDeleteConfirm(null);
      
      toast({
        title: "Success",
        description: "Transaction deleted successfully.",
      });
    } catch (err) {
      const errorMessage = handleError(err, 'Delete transaction');
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Helper function to get transaction type indicators
  const getTransactionIndicators = (transaction: Transaction) => {
    const indicators = [];
    
    return indicators;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Fix the transaction type color logic
  const getTransactionTypeColor = (type: number) => {
    return type === 0 ? 'text-green-600' : 'text-red-600'; // 0 = Income (green), 1 = Expense (red)
  };

  // Fix the transaction type icon logic
  const getTransactionTypeIcon = (type: number) => {
    return type === 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />; // 0 = Income (up), 1 = Expense (down)
  };

  // Add helper function to get transaction type label
  const getTransactionTypeLabel = (type: number) => {
    return type === 0 ? 'Income' : 'Expense'; // 0 = Income, 1 = Expense
  };

  // Add helper function to format amount with proper sign
  const formatTransactionAmount = (amount: number, type: number) => {
    const formattedAmount = formatCurrency(Math.abs(amount));
    return type === 0 ? `+${formattedAmount}` : `-${formattedAmount}`; // 0 = Income (+), 1 = Expense (-)
  };

  const resetFilters = () => {
    setFilters({});
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchTransactions();
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? `${category.icon} ${category.name}` : 'Unknown Category';
  };

  // Add helper function to get account name
  const getAccountName = (transaction: Transaction): string => {
    return transaction.wallet_name || transaction.account_name || "Unknown Account";
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'charts' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Charts
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {viewMode === 'table' ? (
        <>
          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search descriptions..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={filters.transaction_type ?? ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    transaction_type: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">All Types</option>
                  <option value="1">Income</option>
                  <option value="0">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Account</label>
                <select
                  value={filters.wallet_id || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    wallet_id: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">All Accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    {/* Remove Flags column since we don't have recurring/internal indicators */}
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((transaction, index) => (
                    <tr key={`transaction-${transaction.id}-${index}`} className="hover:bg-accent/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        <div className="max-w-xs truncate">
                          {transaction.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {getAccountName(transaction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`flex items-center gap-2 ${getTransactionTypeColor(transaction.transaction_type)}`}>
                          {getTransactionTypeIcon(transaction.transaction_type)}
                          <span className="font-medium">
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={getTransactionTypeColor(transaction.transaction_type)}>
                          {formatTransactionAmount(transaction.amount, transaction.transaction_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {getCategoryName(transaction.category_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setIsEditModalOpen(true);
                            }}
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(transaction.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {hasMore && (
              <div className="p-4 text-center border-t border-border">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <ChartsView monthlyStats={monthlyStats} />
      )}

      {/* Enhanced Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createTransaction}
        accounts={accounts}
        categories={categories}
      />

      {/* Enhanced Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        onUpdate={updateTransaction}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          transactionId={deleteConfirm}
          onConfirm={() => deleteTransaction(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// Charts View Component
function ChartsView({ monthlyStats }: { monthlyStats: MonthlyStats | null }) {
  if (!monthlyStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${monthlyStats.total_income.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${monthlyStats.total_expense.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Income</p>
              <p className={`text-2xl font-bold ${monthlyStats.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${monthlyStats.net_income.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Monthly Income vs Expenses ({monthlyStats.year})
        </h3>
        <div className="h-80 flex items-end justify-between gap-2">
          {monthlyStats.monthly_data.map((month) => {
            const maxAmount = Math.max(
              ...monthlyStats.monthly_data.map(m => Math.max(m.income, m.expense))
            );
            const incomeHeight = maxAmount > 0 ? (month.income / maxAmount) * 100 : 0;
            const expenseHeight = maxAmount > 0 ? (month.expense / maxAmount) * 100 : 0;
            
            return (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex gap-1 items-end h-60">
                  <div
                    className="bg-green-500 hover:bg-green-600 transition-colors w-6 rounded-t cursor-pointer"
                    style={{ height: `${incomeHeight}%`, minHeight: incomeHeight > 0 ? '4px' : '0px' }}
                    title={`Income: $${month.income.toLocaleString()}`}
                  />
                  <div
                    className="bg-red-500 hover:bg-red-600 transition-colors w-6 rounded-t cursor-pointer"
                    style={{ height: `${expenseHeight}%`, minHeight: expenseHeight > 0 ? '4px' : '0px' }}
                    title={`Expense: $${month.expense.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {monthNames[month.month - 1]}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Enhanced Legend */}
        <div className="flex justify-center gap-8 mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
            <div className="text-sm">
              <span className="font-medium text-foreground">Income</span>
              <div className="text-xs text-muted-foreground">
                Total: ${monthlyStats.total_income.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
            <div className="text-sm">
              <span className="font-medium text-foreground">Expenses</span>
              <div className="text-xs text-muted-foreground">
                Total: ${monthlyStats.total_expense.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Net Income Summary */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Net Income for {monthlyStats.year}
            </span>
            <span className={`text-lg font-bold ${monthlyStats.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyStats.net_income >= 0 ? '+' : ''}${monthlyStats.net_income.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Create Transaction Modal Component
function CreateTransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  accounts,
  categories 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionRequest) => void;
  accounts: Account[];
  categories: Category[];
}) {
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    amount: 0,
    transaction_type: 0, // Default to Income (0)
    wallet_id: 0,
    category_id: undefined,
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.wallet_id === 0) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Ensure transaction_type is a number
      const submitData = {
        ...formData,
        transaction_type: Number(formData.transaction_type)
      };
      
      console.log('Submitting transaction with type:', submitData.transaction_type);
      
      await onSubmit(submitData);
      setFormData({
        amount: 0,
        transaction_type: 0, // Reset to Income (0)
        wallet_id: 0,
        category_id: undefined,
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories based on transaction type - with defensive array check
  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(cat => 
        cat.type === 'both' || 
        (formData.transaction_type === 0 && cat.type === 'income') ||
        (formData.transaction_type === 1 && cat.type === 'expense')
      )
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Create a new income or expense transaction for your accounts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                disabled={isSubmitting}
              >
                <option value={0}>Income</option>
                <option value={1}>Expense</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Account</label>
            <select
              value={formData.wallet_id}
              onChange={(e) => setFormData({ ...formData, wallet_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
              disabled={isSubmitting}
            >
              <option value={0}>Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (${account.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                category_id: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={isSubmitting}
            >
              <option value="">Select Category (Optional)</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              rows={2}
              placeholder="Optional description..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || formData.wallet_id === 0}
            >
              {isSubmitting ? 'Creating...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced Edit Transaction Modal Component
function EditTransactionModal({ 
  isOpen, 
  onClose, 
  transaction, 
  accounts,
  categories, 
  onUpdate 
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onUpdate: (id: number, data: UpdateTransactionRequest) => void;
}) {
  const [formData, setFormData] = useState<UpdateTransactionRequest>({
    amount: 0,
    transaction_type: 1,
    wallet_id: 0,
    category_id: undefined,
    description: '',
    transaction_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount,
        transaction_type: transaction.transaction_type,
        wallet_id: transaction.wallet_id,
        category_id: transaction.category_id,
        description: transaction.description || '',
        transaction_date: transaction.transaction_date,
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transaction) {
      setIsSubmitting(true);
      try {
        // Ensure transaction_type is a number
        const submitData = {
          ...formData,
          transaction_type: Number(formData.transaction_type)
        };
        
        await onUpdate(transaction.id, submitData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Filter categories based on transaction type - with defensive array check
  const filteredCategories = Array.isArray(categories)
    ? categories.filter(cat => 
        cat.type === 'both' || 
        (formData.transaction_type === 0 && cat.type === 'income') ||
        (formData.transaction_type === 1 && cat.type === 'expense')
      )
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the transaction details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                disabled={isSubmitting}
              >
                <option value={0}>Income</option>
                <option value={1}>Expense</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Account</label>
            <select
              value={formData.wallet_id}
              onChange={(e) => setFormData({ ...formData, wallet_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
              disabled={isSubmitting}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (${account.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                category_id: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={isSubmitting}
            >
              <option value="">Select Category (Optional)</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog - Updated to use ShadCN Dialog
function DeleteConfirmDialog({ 
  transactionId, 
  onConfirm, 
  onCancel 
}: {
  transactionId: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
