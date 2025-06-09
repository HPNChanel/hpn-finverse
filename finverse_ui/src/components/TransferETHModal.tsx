import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, CheckCircle, XCircle, ArrowRight, Info, Clock, Zap, Copy, ExternalLink } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { transferService, TransferRequest, TransferResult } from '@/services/transferService';
import { useToast } from '@/hooks/use-toast';

interface TransferETHModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TransactionStatus = 'idle' | 'estimating' | 'pending' | 'success' | 'failed';

export function TransferETHModal({ isOpen, onClose }: TransferETHModalProps) {
  const { currentAccount, accounts, balance, refreshBalance, refreshAllBalances } = useWallet();
  const { toast } = useToast();

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);

  // Transaction state
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<{ gasLimit: string; gasPrice: string; totalCost: string } | null>(null);

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper data
  const [recentRecipients, setRecentRecipients] = useState<string[]>([]);
  const testnetAddresses = transferService.getTestnetAddresses();

  // Load recent recipients on mount
  useEffect(() => {
    setRecentRecipients(transferService.getRecentRecipients());
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRecipient('');
      setAmount('');
      setUseCustomRecipient(false);
      setStatus('idle');
      setError(null);
      setTxHash(null);
      setGasEstimate(null);
      setValidationError(null);
    }
  }, [isOpen]);

  // Validate form in real-time
  useEffect(() => {
    if (!recipient || !amount || !currentAccount) {
      setValidationError(null);
      setGasEstimate(null);
      return;
    }

    const request: TransferRequest = {
      from: currentAccount,
      to: recipient,
      amount: amount
    };

    const validation = transferService.validateTransfer(request);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid transfer');
      setGasEstimate(null);
      return;
    }

    // Clear validation error and estimate gas
    setValidationError(null);
    estimateGasDebounced(request);
  }, [recipient, amount, currentAccount]);

  // Debounced gas estimation
  const estimateGasDebounced = useCallback(
    debounce(async (request: TransferRequest) => {
      try {
        setStatus('estimating');
        const estimate = await transferService.estimateGas(request);
        setGasEstimate(estimate);
        setStatus('idle');
      } catch (error) {
        console.error('Gas estimation failed:', error);
        setGasEstimate(null);
        setStatus('idle');
      }
    }, 500),
    []
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount || !recipient || !amount) {
      setError('Please fill in all fields');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    const request: TransferRequest = {
      from: currentAccount,
      to: recipient,
      amount: amount
    };

    try {
      setStatus('pending');
      setError(null);
      setTxHash(null);

      const result: TransferResult = await transferService.sendTransfer(request);

      if (result.success && result.txHash) {
        setStatus('success');
        setTxHash(result.txHash);
        transferService.addRecentRecipient(recipient);
        setRecentRecipients(transferService.getRecentRecipients());
        
        // Refresh balances
        await refreshAllBalances();
        
        toast({
          title: "Transfer Successful!",
          description: `Sent ${transferService.formatETH(amount)} to ${transferService.formatAddress(recipient)}`,
        });
      } else {
        setStatus('failed');
        setError(result.error || 'Transfer failed');
        toast({
          title: "Transfer Failed",
          description: result.error || 'Transaction failed',
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle quick actions
  const handleSendMax = () => {
    if (!balance || !gasEstimate) return;
    
    const maxAmount = Math.max(0, parseFloat(balance) - parseFloat(gasEstimate.totalCost) + parseFloat(amount || '0'));
    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(6));
    }
  };

  const handleRecipientSelect = (address: string) => {
    setRecipient(address);
    setUseCustomRecipient(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const openEtherscan = (txHash: string) => {
    // This would need to be updated based on the network
    const url = `https://etherscan.io/tx/${txHash}`;
    window.open(url, '_blank');
  };

  const canSubmit = !validationError && recipient && amount && currentAccount && status === 'idle';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send ETH
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Transfer ETH between accounts (testnet only)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        {status === 'success' && txHash ? (
          // Success State
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700">Transfer Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your transaction has been confirmed on the blockchain
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-medium">{transferService.formatETH(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">From</span>
                    <span className="font-mono text-sm">{transferService.formatAddress(currentAccount || '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">To</span>
                    <span className="font-mono text-sm">{transferService.formatAddress(recipient)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Transaction Hash</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{transferService.formatAddress(txHash)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(txHash)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEtherscan(txHash)}
                        className="h-6 w-6 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatus('idle');
                  setTxHash(null);
                  setAmount('');
                  setRecipient('');
                }}
                className="flex-1"
              >
                Send Another
              </Button>
            </div>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Account */}
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <p className="font-mono text-sm">{transferService.formatAddress(currentAccount || '')}</p>
                  <p className="text-xs text-muted-foreground">Balance: {transferService.formatETH(balance)}</p>
                </div>
                <Badge variant="secondary">Connected</Badge>
              </div>
            </div>

            {/* To Account */}
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              
              {!useCustomRecipient ? (
                <div className="space-y-3">
                  {/* Quick Select */}
                  <Select value={recipient} onValueChange={handleRecipientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient or enter custom address" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Recent Recipients */}
                      {recentRecipients.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Recent</div>
                          {recentRecipients.map((addr) => (
                            <SelectItem key={addr} value={addr}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span className="font-mono text-xs">{transferService.formatAddress(addr)}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                        </>
                      )}
                      
                      {/* Connected Accounts */}
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Your Accounts</div>
                      {accounts.filter(acc => acc.address !== currentAccount).map((account) => (
                        <SelectItem key={account.address} value={account.address}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono text-xs">{transferService.formatAddress(account.address)}</span>
                            <span className="text-xs text-muted-foreground ml-2">{transferService.formatETH(account.balance)}</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      <Separator className="my-1" />
                      
                      {/* Testnet Addresses */}
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Testnet Accounts</div>
                      {testnetAddresses.map((addr) => (
                        <SelectItem key={addr.address} value={addr.address}>
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            <div>
                              <div className="text-xs font-medium">{addr.name}</div>
                              <div className="font-mono text-xs text-muted-foreground">{transferService.formatAddress(addr.address)}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setUseCustomRecipient(true)}
                    className="w-full"
                  >
                    Enter Custom Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="to"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="font-mono"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setUseCustomRecipient(false);
                      setRecipient('');
                    }}
                    className="w-full"
                  >
                    Select from List
                  </Button>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  min="0.0001"
                  placeholder="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleSendMax}
                  disabled={!gasEstimate}
                  size="sm"
                >
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum: 0.0001 ETH</p>
            </div>

            {/* Gas Estimation */}
            {status === 'estimating' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Estimating gas costs...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {gasEstimate && status !== 'estimating' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-medium">{transferService.formatETH(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gas Price</span>
                    <span className="text-sm">{parseFloat(gasEstimate.gasPrice).toFixed(8)} ETH</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Cost</span>
                    <span className="text-sm font-medium">{transferService.formatETH(gasEstimate.totalCost)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {(error || validationError) && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error || validationError}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={status === 'pending'}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!canSubmit || status === 'pending'}
              >
                {status === 'pending' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Send ETH
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 