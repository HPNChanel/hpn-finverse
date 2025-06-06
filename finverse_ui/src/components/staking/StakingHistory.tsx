import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  Clock, 
  Coins, 
  Gift, 
  ArrowUpRight,
  Loader2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useStakingData } from '@/hooks/useStakingData';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { stakingService } from '@/services/stakingService';

export function StakingHistory() {
  const { 
    stakes,  // Updated to use unified stakes
    isLoading, 
    error, 
    refreshData 
  } = useStakingData();

  const { isConnected } = useWallet();
  const { toast } = useToast();

  // Use stakingService for actions
  const handleClaimRewards = async (stakeId: string) => {
    try {
      await stakingService.claimRewards(stakeId);
      toast({
        title: "Success",
        description: "Rewards claimed successfully!"
      });
      await refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim rewards",
        variant: "destructive"
      });
    }
  };

  const handleUnstake = async (stakeId: string, amount: number) => {
    try {
      await stakingService.unstakeTokens(stakeId, amount);
      toast({
        title: "Success",
        description: "Tokens unstaked successfully!"
      });
      await refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unstake tokens",
        variant: "destructive"
      });
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return 'Ready to unstake';
    
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }
    return `${hours}h remaining`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Connect your wallet to view staking history</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>Loading staking history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={refreshData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Staking Positions</CardTitle>
        <CardDescription>
          Track your staking positions and claim rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stakes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No staking positions found
          </p>
        ) : (
          <div className="space-y-4">
            {stakes.map((stake) => (
              <div key={stake.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium">Pool: {stake.poolId}</h3>
                    <p className="text-sm text-muted-foreground">
                      Staked: {stake.amount} FVT
                    </p>
                    <p className="text-sm text-muted-foreground">
                      APY: {stake.rewardRate}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Staked on: {formatDate(stake.stakedAt)}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-sm font-medium">
                        Rewards: {stake.rewardsEarned} FVT
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Claimable: {stake.claimableRewards} FVT
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      {stake.claimableRewards > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleClaimRewards(stake.id.toString())}
                        >
                          Claim Rewards
                        </Button>
                      )}
                      
                      {stake.isUnlocked && stake.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnstake(stake.id.toString(), stake.amount)}
                        >
                          Unstake
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Status: {stake.status}</span>
                    <span>
                      {stake.isUnlocked 
                        ? 'Ready to unstake' 
                        : `${stake.daysRemaining} days remaining`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
