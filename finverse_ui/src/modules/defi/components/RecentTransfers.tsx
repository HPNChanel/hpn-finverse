import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  Copy,
  RefreshCw,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { walletApi, ethTransferApi } from '@/lib/api';

interface ETHTransfer {
  id: number;
  from_address: string;
  to_address: string;
  amount_eth: number;
  tx_hash: string;
  gas_used?: string;
  gas_price?: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface RecentTransfersProps {
  className?: string;
  limit?: number;
  showHeader?: boolean;
  onRefresh?: () => void;
}

export function RecentTransfers({ 
  className, 
  limit = 5, 
  showHeader = true,
  onRefresh 
}: RecentTransfersProps) {
  const [transfers, setTransfers] = useState<ETHTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { accountAddress, isConnected } = useWallet();

  // Fetch recent transfer history
  const fetchRecentTransfers = async () => {
    if (!accountAddress) return;

    try {
      setLoading(true);
      setError('');

      // Primary: Use wallet endpoint as specified in requirements  
      let response;
      try {
        response = await walletApi.getEthHistory(accountAddress, limit, 0);
        console.log('✅ Recent transfers loaded from wallet endpoint');
      } catch (walletErr) {
        console.warn('⚠️ Wallet endpoint failed, trying eth-transfer endpoint:', walletErr);
        // Fallback: Use eth-transfer endpoint
        response = await ethTransferApi.getEthTransferHistory(accountAddress, limit, 0);
        console.log('✅ Recent transfers loaded from eth-transfer endpoint');
      }

      setTransfers(response.transfers);
      
      // Call parent refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to fetch recent transfers:', err);
      setError('Failed to load recent transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && accountAddress) {
      fetchRecentTransfers();
    }
  }, [accountAddress, isConnected, limit]);

  // Utility functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransferDirection = (transfer: ETHTransfer) => {
    if (!accountAddress) return 'unknown';
    
    const isOutgoing = transfer.from_address.toLowerCase() === accountAddress.toLowerCase();
    return isOutgoing ? 'outgoing' : 'incoming';
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Recent Transfers
            </CardTitle>
            <CardDescription className="text-sm">
              Connect wallet to view transfers
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Recent Transfers
                {transfers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {transfers.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                Latest ETH transfers for your wallet
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecentTransfers}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "pt-0" : ""}>
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-6">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent transfers</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map((transfer) => {
              const direction = getTransferDirection(transfer);
              const isOutgoing = direction === 'outgoing';
              const counterpartyAddress = isOutgoing ? transfer.to_address : transfer.from_address;

              return (
                <div 
                  key={transfer.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Direction Icon */}
                    <div className={`p-1.5 rounded-full ${
                      isOutgoing ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {isOutgoing ? (
                        <ArrowUpRight className="h-3 w-3 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="h-3 w-3 text-green-600" />
                      )}
                    </div>

                    {/* Transfer Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {isOutgoing ? 'Sent' : 'Received'}
                        </span>
                        <Badge
                          variant={transfer.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {transfer.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatAddress(counterpartyAddress)}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(transfer.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        isOutgoing ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isOutgoing ? '-' : '+'}{transfer.amount_eth} ETH
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    {transfer.tx_hash && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(transfer.tx_hash)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/tx/${transfer.tx_hash}`, '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 