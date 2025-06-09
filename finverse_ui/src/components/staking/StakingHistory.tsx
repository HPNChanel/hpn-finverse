import React, { useEffect, useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { stakingApi } from '@/lib/api';
import { useCountdown, getCountdownColor } from '@/hooks/useCountdown';
import { Progress } from '@/components/ui/progress';

// Define types for the API response
interface StakingPosition {
  id: number;
  user_id: number;
  pool_id?: string;
  amount: number;
  staked_at: string;
  lock_period: number;
  reward_rate: number;
  tx_hash?: string;
  is_active: boolean;
  unlock_date?: string;
  rewards_earned: number;
  last_reward_calculation?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  is_unlocked: boolean;
  days_remaining?: number;
}

interface UserStakesResponse {
  user_id: number;
  positions: StakingPosition[];
  total_staked: number;
  total_rewards: number;
  total_positions: number;
  active_positions: number;
}

export function StakingHistory() {
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStakesData, setUserStakesData] = useState<UserStakesResponse | null>(null);

  const { isConnected, accountAddress } = useWallet();
  const { toast } = useToast();

  // Fetch user staking positions from API
  const fetchUserStakes = async () => {
    if (!isConnected || !accountAddress) {
      setPositions([]);
      setUserStakesData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await stakingApi.getUserStakes(false); // Get all positions, not just active

      // Validate response structure with defensive checks
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Extract positions with fallback for different response structures
      const stakesData: UserStakesResponse = response.data || response;
      
      if (!stakesData.positions || !Array.isArray(stakesData.positions)) {
        console.warn('⚠️ No positions array in response:', stakesData);
        setPositions([]);
        setUserStakesData({
          user_id: stakesData.user_id || 0,
          positions: [],
          total_staked: 0,
          total_rewards: 0,
          total_positions: 0,
          active_positions: 0
        });
      } else {
        setPositions(stakesData.positions);
        setUserStakesData(stakesData);
      }

      console.log('✅ User stakes fetched successfully:', {
        positionsCount: stakesData.positions?.length || 0,
        totalStaked: stakesData.total_staked,
        activePositions: stakesData.active_positions
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err
          ? (err as any).response?.data?.detail || 'Failed to fetch staking positions'
          : 'Failed to fetch staking positions';
      console.error('❌ Error fetching user stakes:', errorMessage);
      setError(errorMessage);
      setPositions([]);
      setUserStakesData(null);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserStakes();
  }, [isConnected, accountAddress]);

  // Optional refresh on visibility change instead of aggressive polling
  useEffect(() => {
    if (!isConnected || !accountAddress) return;

    const handleVisibilityChange = () => {
      // Only refresh when user returns to the tab
      if (!document.hidden) {
        console.log('🔄 User returned to tab, refreshing staking history');
        fetchUserStakes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, accountAddress]);

  // Enhanced formatting functions
  const formatETHAmount = (value: number): string => {
    try {
      if (!value || value === 0) return '0.0000';
      
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
      } else {
        return value.toFixed(4);
      }
    } catch (error) {
      console.error('Error formatting ETH amount:', error, 'Input:', value);
      return '0.0000';
    }
  };

  const formatAPY = (position: StakingPosition): string => {
    try {
      if (position.reward_rate && position.reward_rate > 0) {
        return `${position.reward_rate.toFixed(1)}%`;
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting APY:', error);
      return 'N/A';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Handle claiming rewards
  const handleClaimRewards = async (positionId: number) => {
    try {
      await stakingApi.claimStakeRewards(positionId.toString());
      toast({
        title: "Success",
        description: "Rewards claimed successfully!"
      });
      await fetchUserStakes(); // Refresh data
    } catch (error: unknown) {
      const err = error as any;
      toast({
        title: "Error",
        description: err.message || "Failed to claim rewards",
        variant: "destructive"
      });
    }
  };

  const handleUnstake = async (positionId: number, poolId: string, amount: number) => {
    try {
      await stakingApi.unstakeTokens({
        poolId: poolId,
        amount: amount
      });
      toast({
        title: "Success",
        description: "Tokens unstaked successfully!"
      });
      await fetchUserStakes(); // Refresh data
    } catch (error: unknown) {
      const err = error as any;
      toast({
        title: "Error",
        description: err.message || "Failed to unstake tokens",
        variant: "destructive"
      });
    }
  };

  // Render loading state
  if (!isConnected) {
    return (
      <Card className="overflow-visible">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Connect your wallet to view staking history</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="overflow-visible">
        <CardContent className="text-center py-8 space-y-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading staking positions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-visible">
        <CardContent className="text-center py-8 space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchUserStakes} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Your Staking Positions
            </CardTitle>
            <CardDescription>
              Track your staking positions and claim rewards
            </CardDescription>
          </div>
          <Button 
            onClick={fetchUserStakes} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Summary Stats */}
        {userStakesData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Staked</div>
              <div className="font-semibold text-lg">{formatETHAmount(userStakesData.total_staked)} ETH</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Rewards</div>
              <div className="font-semibold text-lg text-green-600">+{formatETHAmount(userStakesData.total_rewards)} ETH</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Positions</div>
              <div className="font-semibold text-lg">{userStakesData.total_positions}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Active Positions</div>
              <div className="font-semibold text-lg">{userStakesData.active_positions}</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="overflow-visible">
        {positions.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <Coins className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No staking positions found</p>
            <p className="text-sm text-muted-foreground">
              Start staking ETH to see your positions here
            </p>
          </div>
        ) : (
          <div className="space-y-4 overflow-visible">
            {positions.map((position) => (
              <StakePositionCard
                key={position.id}
                position={position}
                onClaimRewards={handleClaimRewards}
                onUnstake={handleUnstake}
                formatETHAmount={formatETHAmount}
                formatAPY={formatAPY}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for individual stake position cards
function StakePositionCard({ 
  position, 
  onClaimRewards, 
  onUnstake, 
  formatETHAmount, 
  formatAPY, 
  formatDate 
}: {
  position: StakingPosition;
  onClaimRewards: (positionId: number) => void;
  onUnstake: (positionId: number, poolId: string, amount: number) => void;
  formatETHAmount: (value: number) => string;
  formatAPY: (position: StakingPosition) => string;
  formatDate: (date: string) => string;
}) {
  // Calculate unlock time from position data
  const unlockTime = React.useMemo(() => {
    if (position.unlock_date) {
      return new Date(position.unlock_date);
    }
    if (position.staked_at && position.lock_period) {
      const stakeDate = new Date(position.staked_at);
      return new Date(stakeDate.getTime() + (position.lock_period * 24 * 60 * 60 * 1000));
    }
    return null;
  }, [position]);

  const startTime = React.useMemo(() => {
    return new Date(position.staked_at);
  }, [position.staked_at]);

  const countdown = useCountdown(unlockTime, startTime);

  // Determine status badge color
  const getStatusBadgeVariant = (status: string, isActive: boolean) => {
    if (!isActive) return 'secondary';
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="border rounded-lg p-4 overflow-visible space-y-4">
      {/* Header with ID and Status */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">
              Stake #{position.id}
            </h3>
            <Badge variant={getStatusBadgeVariant(position.status, position.is_active)}>
              {position.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Pool: {position.pool_id || 'Default'}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold">
            {formatETHAmount(position.amount)} ETH
          </div>
          <div className="text-sm text-muted-foreground">
            APY: {formatAPY(position)}
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y">
        <div>
          <div className="text-xs text-muted-foreground">Staked Date</div>
          <div className="text-sm font-medium">{formatDate(position.staked_at)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Lock Period</div>
          <div className="text-sm font-medium">{position.lock_period} days</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Rewards Earned</div>
          <div className="text-sm font-medium text-green-600">
            +{formatETHAmount(position.rewards_earned)} ETH
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="text-sm font-medium">
            {position.is_unlocked ? 'Unlocked' : 'Locked'}
          </div>
        </div>
      </div>

      {/* Countdown and Progress */}
      {position.is_active && !position.is_unlocked && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Lock Status:</span>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className={`text-sm font-mono font-medium ${getCountdownColor(countdown.totalSeconds, countdown.isUnlocked)}`}>
                {countdown.timeLeft}
              </span>
            </div>
          </div>

          {countdown.progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lock Progress</span>
                <span>{countdown.progress.toFixed(1)}%</span>
              </div>
              <Progress 
                value={countdown.progress} 
                className="h-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {position.rewards_earned > 0 && (
          <Button
            size="sm"
            onClick={() => onClaimRewards(position.id)}
            disabled={!position.is_active}
          >
            <Gift className="w-4 h-4 mr-2" />
            Claim Rewards
          </Button>
        )}
        
        {position.is_unlocked && position.is_active && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUnstake(position.id, position.pool_id || 'default', position.amount)}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Unstake
          </Button>
        )}
      </div>

      {/* Transaction Hash (if available) */}
      {position.tx_hash && (
        <div className="text-xs text-muted-foreground">
          Tx: {position.tx_hash.slice(0, 10)}...{position.tx_hash.slice(-10)}
        </div>
      )}
    </div>
  );
}
