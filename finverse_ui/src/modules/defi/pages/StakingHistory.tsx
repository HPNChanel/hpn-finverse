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
  List,
  DollarSign,
  BarChart3,
  Download
} from 'lucide-react';
import { useStakingAuth } from '@/hooks/useStakingAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { stakingService, StakeProfile } from '@/services/stakingService';
import { cn } from '@/lib/utils';
import { useStakingData } from '@/hooks/useStakingData';
import { StakeHistoryTable } from '../components/StakeHistoryTable';
import { StakeAnalyticsChart } from '../components/StakeAnalyticsChart';
import { RewardTimeline } from '../components/RewardTimeline';
import { StakingLogsHistory } from '../components/StakingLogsHistory';

interface StakeHistoryItem extends StakeProfile {
  // Additional computed properties for display
  unlockDate: Date;
  isOverdue: boolean;
  progressPercentage: number;
  // Add countdown-related properties
  timeUntilUnlock: number; // in milliseconds
  countdownDisplay: string;
  lockProgressPercentage: number;
}

function StakingSummaryCards() {
  const { tokenBalances, globalStats, isLoading } = useStakingData();
  const { isConnected } = useWallet();

  if (!isConnected) return null;

  const formatFVT = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(4);
  };

  const cards = [
    {
      title: "Total Staked",
      value: formatFVT(tokenBalances?.stakedBalance || '0'),
      suffix: "ETH",
      description: "Your total staked amount",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Stakes",
      value: "3", // This would come from your data
      suffix: "",
      description: "Currently running stakes",
      icon: BarChart3,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Rewards",
      value: formatFVT(500), // This would come from your reward calculations
      suffix: "ETH",
      description: "Lifetime rewards earned",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Average APY",
      value: globalStats?.apy || 0,
      suffix: "%",
      description: "Weighted average return",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.value} {card.suffix}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Quick Actions
          <Badge variant="outline">Pro Tools</Badge>
        </CardTitle>
        <CardDescription>
          Manage your staking data and analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-16 flex-col gap-2">
            <Download className="w-5 h-5" />
            <span>Export History</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Performance Report</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-2">
            <Filter className="w-5 h-5" />
            <span>Advanced Filter</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RewardGrowthChart() {
  // This component would show reward growth over time
  // Using mock data for demonstration
  const mockRewardData = [
    { date: '2024-01-01', rewards: 0 },
    { date: '2024-01-15', rewards: 25.50 },
    { date: '2024-02-01', rewards: 78.25 },
    { date: '2024-02-15', rewards: 142.80 },
    { date: '2024-03-01', rewards: 225.45 },
    { date: '2024-03-15', rewards: 334.70 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Reward Growth Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockRewardData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground">Rewards checkpoint</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">+{item.rewards.toFixed(2)} ETH</p>
                <p className="text-xs text-muted-foreground">
                  {index > 0 ? `+${(item.rewards - mockRewardData[index-1].rewards).toFixed(2)}` : 'Initial'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Add skeleton component if not available
const BalanceSkeleton = () => (
  <div className="animate-pulse space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-6 w-32" />
  </div>
);

// Add in the component where balances are displayed
const BalanceDisplay = ({ balance, label, isLoading }: { 
  balance: string | undefined; 
  label: string; 
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return <BalanceSkeleton />;
  }
  
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{balance || '0.0000'}</p>
    </div>
  );
};

export default function StakingHistory() {
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
      <div className="container mx-auto py-6 overflow-visible">
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
      <div className="container mx-auto py-6 overflow-visible">
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Connect to View History</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your wallet to view your complete staking history and track your rewards.
              </p>
              <Button onClick={() => window.location.href = '/staking/login'} size="lg">
                Access Staking Platform
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-8">
          {/* Header - Single instance */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staking History</h1>
            <p className="text-muted-foreground">
              Track your staking performance and manage your positions
            </p>
          </div>

          {/* Summary Cards */}
          <StakingSummaryCards />

          {/* Quick Actions */}
          <QuickActions />

          {/* Main Content - Remove any duplicate layout wrappers */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
              <TabsTrigger value="rewards">Reward Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StakeHistoryTable />
                <RewardGrowthChart />
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-6">
                <StakingLogsHistory />
                <StakeHistoryTable />
              </div>
            </TabsContent>

            <TabsContent value="rewards">
              <RewardGrowthChart />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
