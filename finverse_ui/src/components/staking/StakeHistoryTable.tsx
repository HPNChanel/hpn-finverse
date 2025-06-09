import { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  Search, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { formatUnits } from 'ethers';

interface StakePosition {
  id: number;
  poolId: string;
  amount: number | string | bigint;
  stakedAt: string;
  unlockAt?: string;
  lockPeriod: number;
  rewardRate?: number;
  apy?: number;
  rewardsEarned: number | string | bigint;
  claimableRewards: number | string | bigint;
  isActive: boolean;
  status: string;
  txHash?: string;
  isUnlocked: boolean;
  daysRemaining?: number;
  modelConfidence?: number;
  aiTag?: string;
  predictedReward?: number | string | bigint;
}

interface UserStakesResponse {
  positions: StakePosition[];
  totalStaked: number;
  totalRewards: number;
  activePositions: number;
  totalPositions: number;
}

type SortField = 'id' | 'amount' | 'stakedAt' | 'rewardRate' | 'rewardsEarned' | 'lockPeriod';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'completed' | 'unlocked' | 'locked';

export function StakeHistoryTable() {
  const [positions, setPositions] = useState<StakePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('stakedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPool, setFilterPool] = useState<string>('all');
  const { toast } = useToast();

  // Fetch stake positions
  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<UserStakesResponse>('/staking/user-stakes');
      
      if (response.data?.positions) {
        setPositions(response.data.positions);
      } else {
        setPositions([]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch stake positions';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // Get unique pool IDs for filter
  const poolIds = useMemo(() => {
    const pools = new Set();
    positions.forEach((position, index) => {
      // Safe pool ID extraction
      const poolId = position.poolId;
      if (poolId && poolId.trim() !== '') {
        pools.add(poolId);
      } else {
        console.warn(`⚠️ Position ${index} has invalid poolId:`, {
          positionId: position.id,
          poolId: position.poolId,
          index
        });
      }
    });
    return Array.from(pools);
  }, [positions]);

  // Filter and sort positions
  const filteredAndSortedPositions = useMemo(() => {
    let filtered = positions;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(position => 
        position.id.toString().includes(query) ||
        position.poolId.toLowerCase().includes(query) ||
        position.txHash?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(position => {
        switch (filterStatus) {
          case 'active':
            return position.isActive;
          case 'completed':
            return !position.isActive || position.status === 'COMPLETED';
          case 'unlocked':
            return position.isUnlocked;
          case 'locked':
            return !position.isUnlocked;
          default:
            return true;
        }
      });
    }

    // Apply pool filter
    if (filterPool !== 'all') {
      filtered = filtered.filter(position => position.poolId === filterPool);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date sorting
      if (sortField === 'stakedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return filtered;
  }, [positions, searchQuery, filterStatus, filterPool, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (position: StakePosition) => {
    if (!position.isActive) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    
    if (position.isUnlocked) {
      return <Badge variant="default">Unlocked</Badge>;
    }
    
    return <Badge variant="outline">Active</Badge>;
  };

  // Enhanced formatting functions with proper error handling
  const formatFVTAmount = (amount: number | string | bigint): string => {
    try {
      if (!amount || amount === '0') return '0.0000';
      
      let numValue: number;
      
      if (typeof amount === 'bigint') {
        numValue = parseFloat(formatUnits(amount, 18));
      } else if (typeof amount === 'string') {
        if (amount.length > 15 && /^\d+$/.test(amount)) {
          // Likely wei amount
          numValue = parseFloat(formatUnits(amount, 18));
        } else {
          numValue = parseFloat(amount);
        }
      } else if (typeof amount === 'number') {
        numValue = amount;
      } else {
        console.warn('Unexpected amount type in formatFVTAmount:', typeof amount, amount);
        return '0.0000';
      }
      
      // Validate the parsed number
      if (isNaN(numValue) || !isFinite(numValue)) {
        console.warn('Invalid number after parsing in formatFVTAmount:', amount, '→', numValue);
        return '0.0000';
      }
      
      if (numValue >= 1000000) {
        return `${(numValue / 1000000).toFixed(2)}M`;
      } else if (numValue >= 1000) {
        return `${(numValue / 1000).toFixed(2)}K`;
      } else {
        return numValue.toFixed(4);
      }
    } catch (error) {
      console.error('Error formatting FVT amount:', error, 'Input:', amount);
      return '0.0000';
    }
  };

  const formatAPY = (position: StakePosition): string => {
    try {
      if (position.rewardRate && position.rewardRate > 0) {
        return `${position.rewardRate.toFixed(1)}%`;
      }
      if (position.apy && position.apy > 0) {
        return `${position.apy.toFixed(1)}%`;
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting APY:', error, 'Position:', position);
      return 'N/A';
    }
  };

  const formatClaimableRewards = (rewards: number | string | bigint): string => {
    try {
      let numValue: number;
      
      if (typeof rewards === 'bigint') {
        numValue = parseFloat(formatUnits(rewards, 18));
      } else if (typeof rewards === 'string' && rewards.length > 15) {
        // Likely wei amount
        numValue = parseFloat(formatUnits(rewards, 18));
      } else {
        numValue = typeof rewards === 'number' ? rewards : parseFloat(rewards.toString());
      }
      
      return numValue.toFixed(6);
    } catch (error) {
      console.warn('Error formatting claimable rewards:', error);
      return '0.000000';
    }
  };

  // Get claim status
  const getClaimStatus = (position: StakePosition) => {
    const claimableAmount = parseFloat(formatClaimableRewards(position.claimableRewards));
    
    if (claimableAmount > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {formatClaimableRewards(position.claimableRewards)} FVT
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <XCircle className="w-4 h-4" />
        <span className="text-sm">None</span>
      </div>
    );
  };

  // Render sort header
  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <Card className="overflow-visible">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading stake history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-visible">
        <CardContent className="py-8">
          <div className="text-center">
            <XCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPositions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Stake History
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 overflow-visible">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, pool, or transaction hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="unlocked">Unlocked</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPool} onValueChange={setFilterPool}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Pool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pools</SelectItem>
              {poolIds.map((poolId, index) => {
                // Safe key for pool filter options
                const safeKey = poolId && typeof poolId === 'string' && poolId.trim() !== '' 
                  ? `filter-pool-${poolId}` 
                  : `filter-pool-unknown-${index}`;
                
                return (
                  <SelectItem key={safeKey} value={poolId || `unknown-${index}`}>
                    {poolId || `Unknown Pool ${index + 1}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-visible">
        {filteredAndSortedPositions.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Stakes Found</h3>
            <p className="text-muted-foreground">
              {positions.length === 0 
                ? "You haven't created any stakes yet." 
                : "No stakes match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader field="id">Stake ID</SortHeader>
                  <SortHeader field="amount">Amount</SortHeader>
                  <TableHead>Pool</TableHead>
                  <SortHeader field="lockPeriod">Lock Period</SortHeader>
                  <SortHeader field="stakedAt">Start Date</SortHeader>
                  <SortHeader field="rewardsEarned">Rewards Earned</SortHeader>
                  <TableHead>Claimable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lock Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPositions.map((position) => (
                  <TableRow key={position.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      #{position.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatFVTAmount(position.amount)} FVT
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatAPY(position)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {position.poolId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{position.lockPeriod} days</span>
                      </div>
                      {position.daysRemaining !== undefined && position.daysRemaining > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {position.daysRemaining} left
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(position.stakedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        +{formatFVTAmount(position.rewardsEarned)} FVT
                      </div>
                    </TableCell>
                    <TableCell>
                      {getClaimStatus(position)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(position)}
                    </TableCell>
                    <TableCell>
                      {position.isUnlocked ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Locked
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
