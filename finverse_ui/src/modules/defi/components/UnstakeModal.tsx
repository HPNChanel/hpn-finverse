import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StakeProfile } from '@/services/stakingService';
import { BrowserProvider, Contract } from 'ethers';
import { STAKE_VAULT_ABI } from '@/lib/contracts';
import { getStakeVaultAddress } from '@/utils/contractLoader';
import api from '@/lib/api';

interface UnstakeModalProps {
  position: StakeProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

enum UnstakeStatus {
  CONFIRM = 'confirm',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export function UnstakeModal({ position, isOpen, onClose, onSuccess }: UnstakeModalProps) {
  const [status, setStatus] = useState<UnstakeStatus>(UnstakeStatus.CONFIRM);
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const formatAmount = (amount: number): string => {
    return `${amount.toFixed(4)} ETH`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleUnstake = async () => {
    try {
      setStatus(UnstakeStatus.PENDING);
      setErrorMessage('');

      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask to continue.');
      }

      // Initialize provider and contract
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultAddress = await getStakeVaultAddress();
      const contract = new Contract(vaultAddress, STAKE_VAULT_ABI, signer);

      // Get user address
      const userAddress = await signer.getAddress();

      // Get user's stake count and stake IDs
      const stakeCount = await contract.getUserStakeCount(userAddress);
      if (stakeCount === 0) {
        throw new Error('No stakes found for this user.');
      }

      const stakeIds = await contract.getUserStakeIds(userAddress);
      
      // Find the matching stake index using a more robust approach
      let stakeIndex = -1;
      for (let i = 0; i < stakeIds.length; i++) {
        try {
          const stakeInfo = await contract.getUserStake(userAddress, stakeIds[i]);
          const amount = stakeInfo[0];
          const timestamp = stakeInfo[1];
          const claimed = stakeInfo[2];
          
          // More precise matching using both amount and timestamp
          const amountEther = parseFloat((Number(amount) / 1e18).toFixed(8));
          const positionAmountEther = parseFloat(position.amount.toFixed(8));
          const timestampMs = Number(timestamp) * 1000;
          const positionTimestamp = new Date(position.stakedAt).getTime();
          
          // Match by amount (with tolerance) and timestamp (within 1 minute)
          if (
            Math.abs(amountEther - positionAmountEther) < 0.0001 &&
            Math.abs(timestampMs - positionTimestamp) < 60000 && // 1 minute tolerance
            !claimed
          ) {
            stakeIndex = Number(stakeIds[i]);
            break;
          }
        } catch (e) {
          console.warn(`Error checking stake ${i}:`, e);
          continue;
        }
      }

      if (stakeIndex === -1) {
        throw new Error('Could not find matching stake on blockchain. Please try refreshing your stakes.');
      }

      // Check if stake can be unstaked (for locked stakes)
      const canUnstake = await contract.canUnstake(userAddress, stakeIndex);
      
      if (!canUnstake && !position.isUnlocked) {
        // For now, we'll treat this as an error since the smart contract doesn't have emergencyUnstake
        // In a future version, you could implement penalty logic here
        throw new Error('Stake is still locked and cannot be unstaked. Please wait for the lock period to expire.');
      }

      // Call the unstake function on the smart contract
      console.log(`Unstaking stake index ${stakeIndex} for user ${userAddress}`);
      const tx = await contract.unstake(stakeIndex);
      setTxHash(tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Transaction successful, sync with backend
        const syncResponse = await api.post('/staking/unstake-sync', {
          stake_id: position.id,
          tx_hash: tx.hash
        });

        setStatus(UnstakeStatus.SUCCESS);
        
        // Check if there was an early withdrawal penalty
        const responseData = syncResponse.data;
        let toastDescription = `Successfully unstaked ${formatAmount(position.amount)}`;
        
        if (responseData.is_early_withdrawal && responseData.penalty_amount > 0) {
          toastDescription += ` (Penalty: ${responseData.penalty_amount.toFixed(6)} ETH)`;
          
          toast({
            title: "Unstake Successful with Penalty ⚠️",
            description: toastDescription,
            variant: "default",
          });
        } else {
          toast({
            title: "Unstake Successful! ✅",
            description: toastDescription,
          });
        }

        // Auto-close modal and refresh after success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error('Transaction failed on blockchain');
      }

    } catch (error: unknown) {
      console.error('Unstake failed:', error);
      setStatus(UnstakeStatus.FAILED);
      
      let errorMsg = 'Failed to unstake';
      const errorObj = error as { code?: number; message?: string; reason?: string };
      if (errorObj?.code === 4001) {
        errorMsg = 'Transaction cancelled by user';
      } else if (errorObj?.message) {
        errorMsg = errorObj.message;
      } else if (errorObj?.reason) {
        errorMsg = errorObj.reason;
      }
      
      setErrorMessage(errorMsg);
      
      toast({
        title: "Unstake Failed ❌",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case UnstakeStatus.PENDING:
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case UnstakeStatus.SUCCESS:
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case UnstakeStatus.FAILED:
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case UnstakeStatus.PENDING:
        return 'Processing Unstake...';
      case UnstakeStatus.SUCCESS:
        return 'Unstake Successful!';
      case UnstakeStatus.FAILED:
        return 'Unstake Failed';
      default:
        return 'Confirm Unstake';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case UnstakeStatus.PENDING:
        return 'Please confirm the transaction in MetaMask and wait for blockchain confirmation...';
      case UnstakeStatus.SUCCESS:
        return 'Your ETH has been successfully unstaked and returned to your wallet.';
      case UnstakeStatus.FAILED:
        return errorMessage || 'Something went wrong during the unstaking process.';
      default:
        return 'Review the details below and confirm to unstake your ETH.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          <DialogTitle className="text-center">
            {getStatusTitle()}
          </DialogTitle>
          <DialogDescription className="text-center">
            {getStatusDescription()}
          </DialogDescription>
        </DialogHeader>

        {status === UnstakeStatus.CONFIRM && (
          <div className="space-y-4">
            {/* Stake Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Stake Amount</span>
                <span className="font-mono font-bold text-lg">
                  {formatAmount(position.amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Staked Date</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(position.stakedAt.toISOString())}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pool</span>
                <Badge variant="outline">{position.poolId}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rewards Earned</span>
                <span className="text-sm font-medium text-green-600">
                  {formatAmount(position.rewardsEarned)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Warning */}
            {!position.isUnlocked ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Early Withdrawal Warning:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Your stake is still locked (remaining: {position.daysRemaining} days)</li>
                      <li>• A 10% penalty will be applied to your stake amount</li>
                      <li>• Penalty amount: ~{(position.amount * 0.1).toFixed(6)} ETH</li>
                      <li>• You'll receive: ~{(position.amount * 0.9).toFixed(6)} ETH + rewards</li>
                      <li>• This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-700">
                    <p className="font-medium">Important:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Your staked ETH and earned rewards will be returned to your wallet</li>
                      <li>• This action cannot be undone</li>
                      <li>• You'll need to pay gas fees for the transaction</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnstake}
                className="flex-1"
                variant="destructive"
              >
                Confirm Unstake
              </Button>
            </div>
          </div>
        )}

        {status === UnstakeStatus.PENDING && (
          <div className="space-y-4 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Transaction submitted to blockchain...
              </p>
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-2"
                >
                  View on Etherscan
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        )}

        {(status === UnstakeStatus.SUCCESS || status === UnstakeStatus.FAILED) && (
          <div className="space-y-4">
            {txHash && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Transaction Hash</span>
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    View on Etherscan
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {status === UnstakeStatus.FAILED && (
                <Button
                  variant="outline"
                  onClick={() => setStatus(UnstakeStatus.CONFIRM)}
                  className="flex-1"
                >
                  Try Again
                </Button>
              )}
              <Button
                onClick={onClose}
                className="flex-1"
                variant={status === UnstakeStatus.SUCCESS ? "default" : "outline"}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 