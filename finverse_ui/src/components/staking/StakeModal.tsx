import { useState, useEffect } from 'react';
import { X, DollarSign, Clock, TrendingUp, AlertCircle, Wallet, Coins } from 'lucide-react';
import { StakingPool } from '@/services/stakingService';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { accountService } from '@/services/accountService';
import { formatCurrency } from '@/lib/utils';
import { parseUnits, formatUnits } from 'ethers';
import { useCountdown } from '@/hooks/useCountdown';

export function StakeModal({ isOpen, onClose, pools, selectedPool, onStake }: StakeModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState<string>(''); // Changed to string for select compatibility
  const [selectedAccountId, setSelectedAccountId] = useState<string>(''); // Changed to string
  const [duration, setDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const { toast } = useToast();
  
  // Add wallet hook for balance display
  const { 
    isConnected,
    accountAddress,
    shortAddress,
    formattedBalanceETH,
    formattedBalanceFVT,
    balanceETH,
    balanceFVT,
    isCorrectNetwork,
    networkName
  } = useWallet();

  // Initialize selectedPoolId when pools or selectedPool changes
  useEffect(() => {
    if (selectedPool?.id) {
      setSelectedPoolId(selectedPool.id.toString());
      setDuration(selectedPool.lock_period);
    } else if (pools.length > 0 && !selectedPoolId) {
      setSelectedPoolId(pools[0].id.toString());
      setDuration(pools[0].lock_period);
    }
  }, [selectedPool, pools, selectedPoolId]);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await accountService.getAccounts();
      setAccounts(response.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const currentPool = pools.find(p => p.id.toString() === selectedPoolId);
  const selectedAccount = accounts.find(a => a.id.toString() === selectedAccountId);
  
  // Get available balance for staking
  const getAvailableBalance = () => {
    if (selectedAccount) {
      return selectedAccount.balance;
    }
    return parseFloat(formattedBalanceFVT || '0');
  };

  const availableBalance = getAvailableBalance();

  const validateAmountInput = (value: string): boolean => {
    if (!value) {
      setValidationError('');
      return true;
    }

    const decimalPattern = /^\d*(\.\d{0,8})?$/;
    if (!decimalPattern.test(value)) {
      setValidationError('Invalid format. Use up to 8 decimal places.');
      return false;
    }

    if (value.includes('e') || value.includes('E') || value.includes('+') || value.includes('-')) {
      setValidationError('Scientific notation not allowed.');
      return false;
    }

    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      setValidationError('Invalid number format.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleAmountChange = (value: string) => {
    if (validateAmountInput(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const amountWei = parseUnits(amount || '0', 18);
      const stakeAmount = parseFloat(formatUnits(amountWei, 18));
      
      if (!stakeAmount || stakeAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (!currentPool || !selectedPoolId) {
        setError('Please select a pool');
        return;
      }

      if (stakeAmount < currentPool.min_stake) {
        setError(`Minimum stake amount is ${formatCurrency(currentPool.min_stake)}`);
        return;
      }

      if (stakeAmount > currentPool.max_stake) {
        setError(`Maximum stake amount is ${formatCurrency(currentPool.max_stake)}`);
        return;
      }

      // Check account balance if account is selected
      if (selectedAccount && stakeAmount > selectedAccount.balance) {
        setError(`Insufficient balance in ${selectedAccount.name}. Available: ${formatCurrency(selectedAccount.balance)}`);
        return;
      }

      try {
        setIsSubmitting(true);
        const poolIdNum = parseInt(selectedPoolId);
        const accountIdNum = selectedAccountId ? parseInt(selectedAccountId) : undefined;
        await onStake(poolIdNum, stakeAmount, duration, accountIdNum);
        
        // Reset form on success
        setAmount('');
        setError('');
        setSelectedAccountId('');
        toast({
          title: "Stake Successful",
          description: `Successfully staked ${formatCurrency(stakeAmount)} in ${currentPool.name}${
            selectedAccount ? ` from ${selectedAccount.name}` : ''
          }`,
        });
        onClose();
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to stake tokens';
        setError(errorMessage);
        toast({
          title: "Staking Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } catch (parseError) {
      setError('Invalid amount format');
      return;
    }
  };

  const calculateRewards = () => {
    if (!currentPool || !amount || validationError) {
      return { daily: 0, monthly: 0, yearly: 0 };
    }

    try {
      const amountWei = parseUnits(amount, 18);
      const stakeAmount = parseFloat(formatUnits(amountWei, 18));
      
      if (stakeAmount <= 0) return { daily: 0, monthly: 0, yearly: 0 };

      const dailyRate = currentPool.apy / 100 / 365;
      const daily = stakeAmount * dailyRate;
      const monthly = daily * 30;
      const yearly = stakeAmount * (currentPool.apy / 100);

      return { daily, monthly, yearly };
    } catch (error) {
      return { daily: 0, monthly: 0, yearly: 0 };
    }
  };

  const handleQuickAmount = (percentage: number) => {
    if (selectedAccount) {
      const quickAmount = selectedAccount.balance * (percentage / 100);
      const maxAllowed = currentPool?.max_stake ? Math.min(quickAmount, currentPool.max_stake) : quickAmount;
      const formattedAmount = maxAllowed.toFixed(8).replace(/\.?0+$/, '');
      handleAmountChange(formattedAmount);
    } else if (currentPool) {
      const quickAmount = currentPool.max_stake * (percentage / 100);
      const formattedAmount = quickAmount.toFixed(8).replace(/\.?0+$/, '');
      handleAmountChange(formattedAmount);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Stake Tokens</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Balance Summary */}
        {isConnected && accountAddress && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3 text-blue-800">
              <Wallet className="w-4 h-4" />
              <span className="font-medium">Wallet Overview</span>
              <span className="text-xs text-blue-600">({shortAddress})</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/70 p-2 rounded border border-blue-100">
                <div className="text-blue-700 font-medium">ETH Balance</div>
                <div className="text-lg font-bold text-blue-600">{formattedBalanceETH}</div>
                <div className="text-xs text-blue-600/70">
                  ≈ ${(parseFloat(balanceETH) * 2000).toLocaleString()}
                </div>
              </div>
              <div className="bg-white/70 p-2 rounded border border-green-100">
                <div className="text-green-700 font-medium">FVT Available</div>
                <div className="text-lg font-bold text-green-600">{formattedBalanceFVT}</div>
                <div className="text-xs text-green-600/70">Ready to stake</div>
              </div>
            </div>
            {!isCorrectNetwork && (
              <div className="mt-2 text-xs text-red-600">
                ⚠️ Wrong network: {networkName}. Switch to Hardhat Local.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pool Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Pool</label>
            <select
              value={selectedPoolId}
              onChange={(e) => {
                const poolId = e.target.value;
                setSelectedPoolId(poolId);
                const pool = pools.find(p => p.id.toString() === poolId);
                setDuration(pool?.lock_period || 0);
              }}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              {pools.map((pool, index) => {
                // Safe key validation for select options
                const poolIdNumber = Number(pool.id);
                const isValidPoolId = Number.isFinite(poolIdNumber) && poolIdNumber >= 0;
                const safeKey = isValidPoolId ? `modal-pool-${poolIdNumber}` : `modal-pool-fallback-${index}`;
                
                const safeValue = isValidPoolId ? pool.id.toString() : `fallback-${index}`;

                // Log any problematic pool data
                if (!isValidPoolId) {
                  console.warn(`⚠️ Modal pool with invalid ID:`, {
                    poolData: pool,
                    originalId: pool.id,
                    parsedId: poolIdNumber,
                    fallbackKey: safeKey,
                    fallbackValue: safeValue,
                    index
                  });
                }

                return (
                  <option key={safeKey} value={safeValue}>
                    {pool.name || `Pool ${index + 1}`} - {pool.apy || 0}% APY
                  </option>
                );
              })}
            </select>
          </div>

          {/* Account Selection with Balance Display */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Fund from Account
            </label>
            <Select
              value={selectedAccountId}
              onValueChange={(value) => setSelectedAccountId(value || '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funding source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-blue-500" />
                    <span>Connected Wallet</span>
                    <span className="text-muted-foreground">
                      ({formattedBalanceFVT} FVT)
                    </span>
                  </div>
                </SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      <span>{account.name}</span>
                      <span className="text-muted-foreground">
                        ({formatCurrency(account.balance)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Available balance indicator */}
            <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Balance:</span>
                <span className="font-mono font-medium">
                  {availableBalance.toLocaleString()} {selectedAccount ? 'USD' : 'FVT'}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Pool Info */}
          {currentPool && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium">{currentPool.name}</span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>APY:</span>
                  <span className="text-green-600 font-medium">{currentPool.apy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Min/Max:</span>
                  <span>{formatCurrency(currentPool.min_stake)} - {formatCurrency(currentPool.max_stake)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lock Period:</span>
                  <span>{currentPool.lock_period === 0 ? 'Flexible' : `${currentPool.lock_period} days`}</span>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input with Balance Integration */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount to Stake</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                inputMode="decimal"
                pattern="^\d*(\.\d{0,8})?$"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00000000"
                className={`w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring focus:border-transparent ${
                  validationError ? 'border-red-500' : ''
                }`}
                autoComplete="off"
                spellCheck="false"
                required
              />
            </div>
            
            {/* Validation Error */}
            {validationError && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {validationError}
              </p>
            )}
            
            {/* Enhanced Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => {
                    const quickAmount = availableBalance * (percentage / 100);
                    const maxAllowed = currentPool?.max_stake || quickAmount;
                    const finalAmount = Math.min(quickAmount, maxAllowed);
                    const formattedAmount = finalAmount.toFixed(8).replace(/\.?0+$/, '');
                    handleAmountChange(formattedAmount);
                  }}
                  className="flex-1 py-1 px-2 text-xs border border-border rounded hover:bg-muted transition-colors"
                  disabled={availableBalance === 0}
                >
                  {percentage}%
                </button>
              ))}
            </div>
            
            {/* Balance validation feedback */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Available:</span>
                <span className="font-mono">
                  {availableBalance.toLocaleString()} {selectedAccount ? 'USD' : 'FVT'}
                </span>
              </div>
              {amount && !validationError && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Remaining:</span>
                  <span className="font-mono">
                    {(() => {
                      try {
                        const amountWei = parseUnits(amount, 18);
                        const amountNum = parseFloat(formatUnits(amountWei, 18));
                        return Math.max(0, availableBalance - amountNum).toLocaleString();
                      } catch {
                        return availableBalance.toLocaleString();
                      }
                    })()} {selectedAccount ? 'USD' : 'FVT'}
                  </span>
                </div>
              )}
              {amount && !validationError && (() => {
                try {
                  const amountWei = parseUnits(amount, 18);
                  const amountNum = parseFloat(formatUnits(amountWei, 18));
                  return amountNum > availableBalance;
                } catch {
                  return false;
                }
              })() && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Insufficient balance
                </p>
              )}
            </div>

            {currentPool && (
              <p className="text-xs text-muted-foreground mt-1">
                Min: {formatCurrency(currentPool.min_stake)} | Max: {formatCurrency(currentPool.max_stake)}
              </p>
            )}
          </div>

          {/* Rewards Preview */}
          {amount && parseFloat(amount) > 0 && !validationError && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Estimated Rewards</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-green-700">
                  <span>Daily:</span>
                  <span>+{formatCurrency(calculateRewards().daily)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Monthly:</span>
                  <span>+{formatCurrency(calculateRewards().monthly)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Yearly:</span>
                  <span>+{formatCurrency(calculateRewards().yearly)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Lock Period Warning with Countdown Preview */}
          {currentPool && currentPool.lock_period > 0 && (
            <LockPeriodWarning 
              lockPeriod={currentPool.lock_period}
              amount={amount}
            />
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Submit Button with balance validation */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || 
                !amount || 
                validationError !== '' ||
                !isConnected ||
                !isCorrectNetwork
              }
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Staking...' : 'Stake Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// New component for lock period warning with countdown
function LockPeriodWarning({ lockPeriod, amount }: { lockPeriod: number; amount: string }) {
  const unlockTime = React.useMemo(() => {
    if (lockPeriod > 0) {
      const now = new Date();
      return new Date(now.getTime() + (lockPeriod * 24 * 60 * 60 * 1000));
    }
    return null;
  }, [lockPeriod]);

  const countdown = useCountdown(unlockTime, new Date());

  return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
        <div className="text-sm space-y-2">
          <div>
            <p className="font-medium text-orange-800">Lock Period Notice</p>
            <p className="text-orange-700">
              Your tokens will be locked for {lockPeriod} days. 
              Early withdrawal may result in penalties.
            </p>
          </div>
          
          {amount && parseFloat(amount) > 0 && unlockTime && (
            <div className="mt-2 p-2 bg-orange-100/50 rounded border border-orange-300">
              <p className="text-xs font-medium text-orange-800 mb-1">Lock Preview:</p>
              <div className="text-xs text-orange-700 space-y-1">
                <p>Unlock Date: {unlockTime.toLocaleDateString()} at {unlockTime.toLocaleTimeString()}</p>
                <p className="font-mono">⏱️ {countdown.timeLeft}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
