import { useState } from 'react';
import { 
  Calendar, TrendingUp, Award, MoreVertical, Plus, Minus, 
  Brain, Shield, ExternalLink, Loader2 
} from 'lucide-react';
import { StakeProfile } from '@/services/stakingService';
import { stakingService } from '@/services/stakingService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface StakePositionCardProps {
  position: StakeProfile;
  onRefresh: () => void;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
}

export function StakePositionCard({ 
  position, 
  onRefresh, 
  formatCurrency, 
  formatPercentage 
}: StakePositionCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleUnstake = async (amount: number) => {
    try {
      setIsLoading(true);
      await stakingService.unstakeFromAccount(position.stake.id, {
        name: position.stake.name,
        amount
      });
      onRefresh();
      toast({
        title: "Unstake Successful",
        description: `Successfully unstaked ${formatCurrency(amount)}`,
      });
    } catch (error: any) {
      console.error('Unstake failed:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || error?.detail || 'Failed to unstake funds';
      toast({
        title: "Unstake Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredictReward = async () => {
    try {
      setIsPredicting(true);
      const result = await stakingService.predictStakeReward(position.stake.id);
      onRefresh();
      toast({
        title: "🔮 Prediction Complete",
        description: `Predicted reward: ${formatCurrency(result.predicted_reward)} (${(result.model_confidence * 100).toFixed(1)}% confidence)`,
      });
    } catch (error: any) {
      console.error('Prediction failed:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || error?.detail || 'Failed to generate reward prediction';
      toast({
        title: "Prediction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const handleVerifyOnChain = async () => {
    try {
      setIsVerifying(true);
      const result = await stakingService.verifyStakeOnChain(position.stake.id);
      onRefresh();
      
      if (result.verified) {
        toast({
          title: "🔗 Verification Successful",
          description: `Stake verified on blockchain. APY: ${result.apy_snapshot}%`,
        });
      } else {
        const errorMessage = result.error || "Could not verify stake on blockchain";
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Verification failed:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || error?.detail || 'Failed to verify stake on blockchain';
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysStaked = () => {
    const start = new Date(position.stake.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = () => {
    if (!position.stake.is_active) return 'bg-gray-100 text-gray-800';
    if (position.rewards.apy >= 10) return 'bg-purple-100 text-purple-800';
    if (position.rewards.apy >= 7) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getAiTagColor = (tag?: string) => {
    switch (tag) {
      case 'aggressive': return 'destructive';
      case 'conservative': return 'default';
      case 'systematic': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{position.stake.name}</h3>
            <Badge className={getStatusColor()}>
              {formatPercentage(position.rewards.apy)} APY
            </Badge>
            {position.stake.ai_tag && (
              <Badge variant={getAiTagColor(position.stake.ai_tag)}>
                {position.stake.ai_tag}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Staked {getDaysStaked()} days ago
          </p>
          
          {/* Linked Account */}
          {position.stake.linked_account && (
            <p className="text-xs text-blue-600 mt-1">
              📊 Linked to {position.stake.linked_account.name}
            </p>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showActions && (
            <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={() => {
                  handleUnstake(position.stake.amount / 2);
                  setShowActions(false);
                }}
                disabled={isLoading}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Minus className="w-3 h-3" />
                Unstake Half
              </button>
              <button
                onClick={() => {
                  handlePredictReward();
                  setShowActions(false);
                }}
                disabled={isPredicting}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                {isPredicting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                Predict Reward
              </button>
              <button
                onClick={() => {
                  handleVerifyOnChain();
                  setShowActions(false);
                }}
                disabled={isVerifying}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                Verify On-Chain
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Predictions Section */}
      {(position.stake.predicted_reward || position.stake.model_confidence) && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">AI Prediction</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {position.stake.predicted_reward && (
              <div>
                <span className="text-muted-foreground">Predicted:</span>
                <span className="ml-1 font-medium text-purple-700">
                  {formatCurrency(position.stake.predicted_reward)}
                </span>
              </div>
            )}
            {position.stake.model_confidence && (
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <span className="ml-1 font-medium text-purple-700">
                  {(position.stake.model_confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amount Display */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Staked Amount</span>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(position.stake.amount)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Balance</span>
          <span className="font-medium text-foreground">
            {formatCurrency(position.stake.balance)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Rewards Earned</span>
          <span className="font-medium text-green-600">
            +{formatCurrency(position.rewards.earned)}
          </span>
        </div>
        
        {position.stake.claimable_rewards && position.stake.claimable_rewards > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Claimable</span>
            <span className="font-medium text-orange-600">
              {formatCurrency(position.stake.claimable_rewards)}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Earning Progress</span>
          <span className="font-medium">{position.rewards.duration_days} days</span>
        </div>
        <Progress 
          value={Math.min((position.rewards.duration_days / 365) * 100, 100)} 
          className="h-2"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-3 bg-muted/50 rounded-lg cursor-help">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">APY</span>
                </div>
                <span className="font-bold text-green-600">
                  {formatPercentage(position.rewards.apy)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {position.stake.apy_snapshot && (
                <p>Snapshot APY: {formatPercentage(position.stake.apy_snapshot)}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-muted-foreground">Daily</span>
          </div>
          <span className="font-bold text-orange-600">
            {formatCurrency(position.rewards.earned / Math.max(position.rewards.duration_days, 1))}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Started {formatDate(position.stake.created_at)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {position.stake.blockchain_tx_hash && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View on blockchain: {position.stake.blockchain_tx_hash.slice(0, 8)}...</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <div className={`px-2 py-1 rounded-full ${
            position.stake.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {position.stake.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
}
