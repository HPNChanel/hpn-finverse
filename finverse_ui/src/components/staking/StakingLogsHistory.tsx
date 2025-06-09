import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { stakingApi } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

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

interface StakingLogsHistoryProps {
  className?: string;
}

export function StakingLogsHistory({ className }: StakingLogsHistoryProps) {
  const [logs, setLogs] = useState<StakingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useWallet();
  const { toast } = useToast();

  const fetchLogs = async () => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);
    try {
      const response = await stakingApi.getStakingLogs(50, 0);
      setLogs(response.logs || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch staking logs';
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
    fetchLogs();
  }, [isConnected]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(4);
  };

  const getPoolName = (poolId: string) => {
    const poolNames: Record<string, string> = {
      'eth-flexible': 'ETH Flexible',
      'eth-30d': 'ETH 30-Day Lock',
      'eth-90d': 'ETH 90-Day Lock',
      'eth-180d': 'ETH 180-Day Lock',
      'default-pool': 'Default Pool'
    };
    return poolNames[poolId] || `Pool ${poolId}`;
  };

  const getDurationLabel = (days: number) => {
    if (days === 0) return 'Flexible';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          <p className="text-muted-foreground">
            Connect your wallet to view your staking history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <CardTitle>Staking History</CardTitle>
          </div>
          <Button
            onClick={fetchLogs}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading staking history...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchLogs} variant="outline">
              Try Again
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Staking History</h3>
            <p className="text-muted-foreground">
              Your staking transactions will appear here once you start staking
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getPoolName(log.pool_id)}
                      </Badge>
                      <Badge variant="outline">
                        {getDurationLabel(log.duration)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {formatAmount(log.amount)} ETH Staked
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.event_timestamp)}
                        </div>
                        <div>
                          Stake ID: #{log.stake_id}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const etherscanUrl = `https://etherscan.io/tx/${log.tx_hash}`;
                        window.open(etherscanUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View TX
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {log.tx_hash.slice(0, 8)}...{log.tx_hash.slice(-6)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {logs.length >= 50 && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing latest 50 transactions
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 