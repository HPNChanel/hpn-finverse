import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  History, 
  Clock, 
  Coins, 
  Gift, 
  ArrowUpRight,
  Loader2,
  Calendar,
  TrendingUp,
  Eye,
  RefreshCw,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { useStakingAuth } from '@/hooks/useStakingAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { stakingService, StakeProfile } from '@/services/stakingService';
import { cn } from '@/lib/utils';
import { useStakingData } from '@/hooks/useStakingData';

interface StakeHistoryItem extends StakeProfile {
  // Additional computed properties for display
  unlockDate: Date;
  isOverdue: boolean;
  progressPercentage: number;
}

export function StakingHistory() {
  const { 
    contractSummary, 
    stakes, // Now contains contract positions
    isLoading, 
    error, 
    refreshContractData 
  } = useStakingData();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // Ensure string type with default

  const { user } = useStakingAuth();
  const { isConnected, accountAddress } = useWallet();
  const { toast } = useToast();

  // Fetch staking history
  const fetchStakingHistory = async () => {
    // This now triggers contract data refresh
    await refreshContractData();
  };

  // Filter data based on status using contract positions
  const filteredData = useMemo(() => {
    if (!contractSummary?.positions) return [];
    
    return contractSummary.positions
      .filter(position => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return !position.claimed && parseFloat(position.amount) > 0;
        if (filterStatus === 'unlocked') return position.isUnlocked && !position.claimed;
        if (filterStatus === 'claimed') return position.claimed;
        return true;
      })
      .map(position => ({
        stake: {
          id: position.stakeIndex,
          user_id: 0,
          name: `Contract Stake #${position.stakeIndex}`,
          amount: parseFloat(position.amount),
          balance: parseFloat(position.amount),
          created_at: position.startDate.toISOString(),
          is_active: !position.claimed,
          pool_id: "blockchain",
          reward_rate: position.apy,
          claimable_rewards: position.claimed ? 0 : parseFloat(position.reward),
          rewards_earned: parseFloat(position.reward),
          status: position.claimed ? "COMPLETED" : "ACTIVE"
        },
        rewards: {
          apy: position.apy,
          earned: parseFloat(position.reward),
          duration_days: Math.floor((Date.now() - position.startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        isOverdue: position.isUnlocked && !position.claimed
      }));
  }, [contractSummary, filterStatus]);

  // Load data on mount
  useEffect(() => {
    fetchStakingHistory();
  }, [refreshContractData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Staking History</h1>
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4" />
            <p>Loading staking data from blockchain...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Staking History</h1>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load staking data: {error}
            <Button onClick={fetchStakingHistory} className="ml-4" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Staking History</h1>
        <div className="flex gap-2">
          <Button onClick={fetchStakingHistory} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      {contractSummary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription>Loaded directly from blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Staked</p>
                <p className="text-2xl font-bold">{contractSummary.totalStakedFormatted} FVT</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-2xl font-bold text-green-600">{contractSummary.totalRewardsFormatted} FVT</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claimable</p>
                <p className="text-2xl font-bold text-orange-600">{contractSummary.totalClaimableFormatted} FVT</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positions</p>
                <p className="text-2xl font-bold">{contractSummary.stakeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display filtered data */}
      {(!contractSummary || contractSummary.stakeCount === 0) ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No staking positions found on blockchain</p>
            <p className="text-sm mt-2">Connect your wallet and stake tokens to see your history</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredData.map((item) => (
                <div key={`contract-${item.stake.id}`} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-medium">{item.stake.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(item.stake.amount)} FVT
                      </p>
                      <p className="text-sm text-muted-foreground">
                        APY: {item.rewards.apy}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {item.rewards.duration_days} days
                      </p>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm font-medium">
                          Rewards: {formatCurrency(item.rewards.earned)} FVT
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Claimable: {formatCurrency(item.stake.claimable_rewards)} FVT
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant={item.stake.is_active ? "default" : "secondary"}>
                          {item.stake.status}
                        </Badge>
                        
                        {item.isOverdue && (
                          <Badge variant="outline">
                            Ready to claim
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
      )}
    </div>
  );
}
