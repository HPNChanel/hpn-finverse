import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Coins, 
  TrendingUp, 
  Award, 
  Calendar, 
  RefreshCw, 
  Wallet,
  Network,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useStakingAuth } from '@/hooks/useStakingAuth';
import { useWallet } from '@/hooks/useWallet';
import { useStakingData } from '@/hooks/useStakingData';

interface StakingOverview {
  total_staked: number;
  current_rewards: number;
  active_stakes_count: number;
  total_value_usd: number;
  average_apy: number;
  next_reward_date: string;
  days_since_first_stake: number;
  portfolio_performance: {
    total_earned: number;
    best_performing_stake: {
      name: string;
      apy: number;
      amount: number;
    };
    monthly_trend: number;
  };
}

export function StakingDashboard() {
  const { 
    contractSummary, // Use contract summary instead of API data
    stakes,
    isLoading, 
    error, 
    refreshContractData 
  } = useStakingData();

  const { user } = useStakingAuth();
  const { 
    isConnected, 
    accountAddress, 
    shortAddress, 
    formattedBalanceFVT,
    networkName,
    connectWallet,
    isCorrectNetwork 
  } = useWallet();
  const { toast } = useToast();

  // Calculate overview from contract data
  const overview: StakingOverview = useMemo(() => {
    if (!contractSummary) {
      return {
        total_staked: 0,
        current_rewards: 0,
        active_stakes_count: 0,
        total_value_usd: 0,
        average_apy: 0,
        next_reward_date: "",
        days_since_first_stake: 0,
        portfolio_performance: {
          total_earned: 0,
          best_performing_stake: {
            name: "No stakes",
            apy: 0,
            amount: 0
          },
          monthly_trend: 0
        }
      };
    }

    const totalStaked = parseFloat(contractSummary.totalStaked);
    const currentRewards = parseFloat(contractSummary.totalClaimable);
    const totalEarned = parseFloat(contractSummary.totalRewards);
    const activeStakes = contractSummary.positions.filter(p => !p.claimed);
    
    // Calculate average APY from active stakes
    const averageApy = activeStakes.length > 0 
      ? activeStakes.reduce((sum, stake) => sum + stake.apy, 0) / activeStakes.length
      : 0;
    
    // Find best performing stake
    const bestStake = contractSummary.positions.reduce((best, current) => {
      const currentReward = parseFloat(current.reward);
      const bestReward = parseFloat(best?.reward || '0');
      return currentReward > bestReward ? current : best;
    }, contractSummary.positions[0]);
    
    // Calculate days since first stake
    const daysSinceFirst = contractSummary.positions.length > 0
      ? Math.floor((Date.now() - Math.min(...contractSummary.positions.map(p => p.startDate.getTime()))) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      total_staked: totalStaked,
      current_rewards: currentRewards,
      active_stakes_count: activeStakes.length,
      total_value_usd: totalStaked * 1.25, // Assuming 1 FVT = $1.25
      average_apy: averageApy,
      next_reward_date: "", // Calculate from unlock dates
      days_since_first_stake: daysSinceFirst,
      portfolio_performance: {
        total_earned: totalEarned,
        best_performing_stake: {
          name: bestStake ? `Stake #${bestStake.stakeIndex}` : "No stakes",
          apy: bestStake?.apy || 0,
          amount: bestStake ? parseFloat(bestStake.amount) : 0
        },
        monthly_trend: 0 // Can be calculated from historical data
      }
    };
  }, [contractSummary]);

  // Auto-refresh contract data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (refreshContractData) {
        refreshContractData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshContractData]);

  // Display contract-based staking data
  const renderStakingOverview = () => {
    if (isLoading) {
      return <div className="text-center py-8">Loading staking data from blockchain...</div>;
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={refreshContractData}>
            Retry Loading
          </Button>
        </div>
      );
    }

    if (!contractSummary || contractSummary.stakeCount === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No staking positions found on blockchain</p>
          <p className="text-sm">Total staked: {contractSummary?.totalStakedFormatted || '0.0000'} FVT</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contractSummary.totalStakedFormatted} FVT</div>
              <p className="text-xs text-muted-foreground">
                ${(parseFloat(contractSummary.totalStaked) * 1.25).toFixed(2)} USD
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Claimable Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {contractSummary.totalClaimableFormatted} FVT
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to claim
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Stakes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.active_stakes_count}</div>
              <p className="text-xs text-muted-foreground">
                Total positions: {contractSummary.stakeCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.average_apy.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Current earning rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stake Positions */}
        <Card>
          <CardHeader>
            <CardTitle>Your Staking Positions</CardTitle>
            <CardDescription>
              Data loaded directly from blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contractSummary.positions.map((position) => (
                <div key={position.stakeIndex} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-medium">Stake #{position.stakeIndex}</h3>
                      <p className="text-sm text-muted-foreground">
                        Amount: {position.amountFormatted} FVT
                      </p>
                      <p className="text-sm text-muted-foreground">
                        APY: {position.apy}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Started: {position.startDate.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm font-medium">
                          Rewards: {position.rewardFormatted} FVT
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Status: {position.claimed ? 'Claimed' : 'Active'}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {!position.claimed && parseFloat(position.reward) > 0 && (
                          <Badge variant="default">
                            Claimable
                          </Badge>
                        )}
                        
                        {position.isUnlocked && (
                          <Badge variant="secondary">
                            Unlocked
                          </Badge>
                        )}
                        
                        {!position.isUnlocked && (
                          <Badge variant="outline">
                            {position.daysRemaining}d remaining
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Staking Dashboard</h1>
        <Button onClick={refreshContractData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {renderStakingOverview()}
    </div>
  );
}
