import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
  BarChart3,
  History
} from 'lucide-react';
import { stakingApi } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

// TypeScript interfaces
interface StakingLog {
  id: number;
  stake_id: number;
  amount: number;
  duration: number;
  tx_hash: string;
  pool_id: string;
  event_timestamp: string;
  synced_at: string;
}

interface StakingPosition {
  id: number;
  amount: number;
  rewardRate: number;
  stakedAt: string;
  lockPeriod: number;
  isActive: boolean;
  poolId: string;
  txHash: string;
}

interface CumulativeRewardData {
  date: string;
  timestamp: number;
  totalReward: number;
  dailyReward: number;
  activeStakes: number;
}

interface LogsResponse {
  logs: StakingLog[];
  total_count: number;
  has_more: boolean;
}

interface UserStakesResponse {
  positions: StakingPosition[];
  summary: {
    totalStaked: number;
    totalRewards: number;
    activeCount: number;
  };
}

type EventType = 'all' | 'stake_created' | 'claimed' | 'unstaked';

export function RewardTimeline() {
  // State management
  const [logs, setLogs] = useState<StakingLog[]>([]);
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [eventType, setEventType] = useState<EventType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'chart' | 'timeline'>('chart');
  
  const { isConnected } = useWallet();
  const { toast } = useToast();

  // Fetch data functions
  const fetchStakingLogs = async () => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '100');
      params.append('offset', '0');
      
      // Add event type filter if not 'all'
      if (eventType !== 'all') {
        params.append('event_type', eventType);
      }
      
      // Add date range filters
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      const [logsResponse, stakesResponse] = await Promise.all([
        stakingApi.getStakingLogs(100, 0),
        stakingApi.getUserStakes(false) // Get all stakes, not just active
      ]);

      setLogs(logsResponse.logs || []);
      setPositions(stakesResponse.positions || []);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch timeline data';
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

  // Calculate cumulative rewards using the provided formula
  const calculateCumulativeRewards = useMemo((): CumulativeRewardData[] => {
    if (!positions.length) return [];

    const now = Date.now();
    const rewardData: Map<string, CumulativeRewardData> = new Map();
    
    // Get earliest stake date to start from
    const earliestStake = positions.reduce((earliest, position) => {
      const stakeDate = new Date(position.stakedAt);
      return stakeDate < earliest ? stakeDate : earliest;
    }, new Date());
    
    // Generate daily data points from earliest stake to now
    const daysBetween = Math.ceil((now - earliestStake.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysBetween; i++) {
      const currentDate = new Date(earliestStake.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = currentDate.toISOString().split('T')[0];
      
      let totalReward = 0;
      let dailyReward = 0;
      let activeStakes = 0;
      
      // Calculate rewards for each position active on this date
      positions.forEach(position => {
        const stakeStartTime = new Date(position.stakedAt).getTime();
        const currentTime = currentDate.getTime();
        
        // Only calculate if position was active on this date
        if (stakeStartTime <= currentTime) {
          // Apply date range filter if specified
          if (startDate && currentDate < new Date(startDate)) return;
          if (endDate && currentDate > new Date(endDate)) return;
          
          activeStakes++;
          
          // Calculate seconds elapsed from stake start to current date
          const secondsElapsed = Math.max(0, (currentTime - stakeStartTime) / 1000);
          
          // Apply the provided formula
          const amount = position.amount;
          const rewardRate = position.rewardRate || 5.0; // Default 5% APY
          const bonusRate = 0; // No bonus for now
          
          const reward = (amount * (rewardRate + bonusRate) * secondsElapsed) / (365 * 24 * 3600 * 100);
          
          totalReward += reward;
          
          // Calculate daily reward (reward gained on this specific day)
          if (i > 0) {
            const previousDayReward = (amount * (rewardRate + bonusRate) * Math.max(0, secondsElapsed - 24 * 3600)) / (365 * 24 * 3600 * 100);
            dailyReward += Math.max(0, reward - previousDayReward);
          }
        }
      });
      
      rewardData.set(dateString, {
        date: dateString,
        timestamp: currentDate.getTime(),
        totalReward,
        dailyReward,
        activeStakes
      });
    }
    
    return Array.from(rewardData.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [positions, startDate, endDate]);

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(log => 
        new Date(log.event_timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(log => 
        new Date(log.event_timestamp) <= new Date(endDate)
      );
    }
    
    return filtered.sort((a, b) => 
      new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()
    );
  }, [logs, startDate, endDate]);

  // Effect to fetch data on mount and filter changes
  useEffect(() => {
    fetchStakingLogs();
  }, [isConnected, eventType, startDate, endDate]);

  // Utility functions
  const formatETH = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(3)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(3)}K`;
    return amount.toFixed(6);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'stake_created': 'Stake Created',
      'claimed': 'Rewards Claimed',
      'unstaked': 'Unstaked',
      'all': 'All Events'
    };
    return labels[type] || type;
  };

  // Connection check
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Wallet Required</h3>
            <p className="text-muted-foreground">Connect your wallet to view reward timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reward Timeline</h2>
          <p className="text-muted-foreground">
            Track your ETH staking reward accumulation over time
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStakingLogs}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Event Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={eventType} onValueChange={(value: EventType) => setEventType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="stake_created">Stake Created</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="unstaked">Unstaked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setEventType('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart/Timeline Toggle */}
      <Tabs value={viewMode} onValueChange={(value: 'chart' | 'timeline') => setViewMode(value)}>
        <TabsList>
          <TabsTrigger value="chart" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Cumulative Growth
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Timeline View
          </TabsTrigger>
        </TabsList>

        {/* Cumulative Growth Chart */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Reward Growth</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total accumulated rewards over time using real staking positions
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading reward data...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : calculateCumulativeRewards.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={calculateCumulativeRewards}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatDate(value)}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${formatETH(value)} ETH`}
                    />
                    <Tooltip 
                      labelFormatter={(value) => `Date: ${formatDate(value)}`}
                      formatter={(value: number, name: string) => {
                        if (name === 'totalReward') return [`${formatETH(value)} ETH`, 'Cumulative Rewards'];
                        if (name === 'dailyReward') return [`${formatETH(value)} ETH`, 'Daily Rewards'];
                        if (name === 'activeStakes') return [value, 'Active Stakes'];
                        return [value, name];
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalReward" 
                      stroke="#82ca9d" 
                      fill="#82ca9d"
                      fillOpacity={0.3}
                      name="totalReward"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No reward data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Raw staking event logs with transaction details
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading timeline...</span>
                  </div>
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredLogs.length} events
                    </p>
                    <Badge variant="outline">
                      {getEventTypeLabel(eventType)}
                    </Badge>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Pool</TableHead>
                        <TableHead>Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(log.event_timestamp)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(log.event_timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Stake #{log.stake_id}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatETH(log.amount)} ETH
                            </span>
                          </TableCell>
                          <TableCell>
                            {log.duration > 0 ? `${log.duration} days` : 'Flexible'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.pool_id.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://etherscan.io/tx/${log.tx_hash}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No events found with current filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
