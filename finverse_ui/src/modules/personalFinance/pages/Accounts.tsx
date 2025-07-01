import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, DollarSign, TrendingUp, PiggyBank, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { accountService, Account, AccountType, CreateAccountRequest } from '@/services/accountService';
import { HubLayout } from '@/modules/shared/layouts';

interface CreateAccountFormData {
  name: string;
  type: string;
  initial_balance: string; // Keep as string for input control
  note: string;
  icon: string;
  color: string;
}

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateAccountFormData>({
    name: '',
    type: '',
    initial_balance: '0', // Changed from empty string to '0'
    note: '',
    icon: '',
    color: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, typesData] = await Promise.all([
        accountService.getAccounts(),
        accountService.getAccountTypes()
      ]);
      setAccounts(accountsData);
      setAccountTypes(typesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      initial_balance: '0', // Changed from empty string to '0'
      note: '',
      icon: '',
      color: ''
    });
  };

  const handleInputChange = (field: keyof CreateAccountFormData, value: string) => {
    console.log(`Form field changed: ${field} = ${value}`);
    
    setFormData(prev => ({
      ...prev,
      [field]: value || '' // Ensure never undefined
    }));

    // Auto-fill icon and color when type changes
    if (field === 'type') {
      const selectedType = accountTypes.find(t => t.type === value);
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          type: value,
          icon: selectedType.icon,
          color: selectedType.color
        }));
      }
    }
  };

  const handleInitialBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '0'; // Default to '0' if empty
    console.log('Initial balance input changed:', value);
    
    // Allow empty string, numbers, and decimals, but default to '0'
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleInputChange('initial_balance', value || '0');
    }
  };

  const handleCreateAccount = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Account name is required",
          variant: "destructive"
        });
        return;
      }

      if (!formData.type) {
        toast({
          title: "Validation Error",
          description: "Account type is required",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      // Parse initial balance - convert empty string to 0
      const initialBalance = formData.initial_balance === '' ? 0 : parseFloat(formData.initial_balance || '0');
      
      if (isNaN(initialBalance) || initialBalance < 0) {
        toast({
          title: "Validation Error",
          description: "Initial balance must be a valid positive number",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const createRequest: CreateAccountRequest = {
        name: formData.name.trim(),
        type: formData.type,
        initial_balance: initialBalance, // This should be a number
        note: formData.note.trim() || undefined,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
        currency: 'USD'
      };

      console.log('Creating account with request:', createRequest);

      const newAccount = await accountService.createAccount(createRequest);
      
      setAccounts(prev => [...prev, newAccount]);
      setShowCreateDialog(false);
      resetForm();
      
      toast({
        title: "Success",
        description: `Account "${newAccount.name}" created successfully`,
      });

    } catch (error: any) {
      console.error('Failed to create account:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!confirm(`Are you sure you want to delete "${account.name}"?`)) {
      return;
    }

    try {
      await accountService.deleteAccount(account.id);
      setAccounts(prev => prev.filter(a => a.id !== account.id));
      toast({
        title: "Success",
        description: `Account "${account.name}" deleted successfully`,
      });
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete account",
        variant: "destructive"
      });
    }
  };

  const toggleAccountVisibility = async (account: Account) => {
    try {
      const updatedAccount = await accountService.toggleAccountVisibility(account.id, !account.is_hidden);
      setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
      
      toast({
        title: "Success",
        description: `Account ${updatedAccount.is_hidden ? 'hidden' : 'shown'} successfully`,
      });
    } catch (error: any) {
      console.error('Failed to toggle account visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update account visibility",
        variant: "destructive"
      });
    }
  };

  const getAccountIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      wallet: <DollarSign className="w-5 h-5" />,
      saving: <PiggyBank className="w-5 h-5" />,
      investment: <TrendingUp className="w-5 h-5" />,
      goal: <Target className="w-5 h-5" />
    };
    return iconMap[type] || <DollarSign className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="w-24 h-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="w-32 h-8 bg-muted rounded mb-4" />
                <div className="w-full h-4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <HubLayout hubName="Personal Finance" showSubNavigation={true}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Accounts</h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Account
          </Button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <Card key={account.id} className={`relative ${account.is_hidden ? 'opacity-60' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {getAccountIcon(account.type)}
                <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAccountVisibility(account)}
                >
                  {account.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAccount(account)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${account.balance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground capitalize">{account.type} Account</p>
              {account.note && (
                <p className="text-sm text-muted-foreground mt-2">{account.note}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Account Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                placeholder="e.g., Main Wallet"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Account Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                disabled={isSubmitting}
              >
                <option value="">Select type...</option>
                {accountTypes.map(type => (
                  <option key={type.type} value={type.type}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Initial Balance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.initial_balance}
                onChange={handleInitialBalanceChange}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                placeholder="0.00"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current value: {formData.initial_balance === '' ? '0' : formData.initial_balance}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Note (Optional)</label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                placeholder="Additional notes..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAccount}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </HubLayout>
  );
}
