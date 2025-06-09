import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  Copy,
  RefreshCw,
  AlertTriangle
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



interface ETHTransferHistoryProps {
  className?: string;
  limit?: number;
}

export function ETHTransferHistory({ className, limit = 10 }: ETHTransferHistoryProps) {
  const [transfers, setTransfers] = useState<ETHTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [total, setTotal] = useState(0);

  const { toast } = useToast();
  const { accountAddress, isConnected } = useWallet();

  // Fetch transfer history
  const fetchTransferHistory = async () => {
    if (!accountAddress) return;

    try {
      setLoading(true);
      setError('');

      // Primary: Use wallet endpoint as specified in requirements  
      let response;
      try {
        response = await walletApi.getEthHistory(accountAddress, limit, 0);
        console.log('✅ Transfer history loaded from wallet endpoint');
      } catch (walletErr) {
        console.warn('⚠️ Wallet endpoint failed, trying eth-transfer endpoint:', walletErr);
        // Fallback: Use eth-transfer endpoint
        response = await ethTransferApi.getEthTransferHistory(accountAddress, limit, 0);
        console.log('✅ Transfer history loaded from eth-transfer endpoint');
      }

      setTransfers(response.transfers);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to fetch transfer history:', err);
      setError('Failed to load transfer history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && accountAddress) {
      fetchTransferHistory();
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transfer History
          </CardTitle>
          <CardDescription>Connect your wallet to view transfer history</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent ETH Transfers
          {total > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {total} total
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Your ETH transfer history for {formatAddress(accountAddress || '')}
        </CardDescription>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransferHistory}
          disabled={loading}
          className="w-fit"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading transfer history...</span>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No transfers found</p>
            <p className="text-sm text-muted-foreground">Your ETH transfers will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const direction = getTransferDirection(transfer);
                  const isOutgoing = direction === 'outgoing';
                  const counterpartyAddress = isOutgoing ? transfer.to_address : transfer.from_address;

                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isOutgoing ? (
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm">
                            {isOutgoing ? 'Sent' : 'Received'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">
                          {isOutgoing ? '-' : '+'}{transfer.amount_eth} ETH
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatAddress(counterpartyAddress)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(counterpartyAddress)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(transfer.created_at)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <Badge
                          variant={transfer.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {transfer.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {transfer.tx_hash && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(transfer.tx_hash)}
                                className="h-6 w-6 p-0"
                                title="Copy transaction hash"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://etherscan.io/tx/${transfer.tx_hash}`, '_blank')}
                                className="h-6 w-6 p-0"
                                title="View on Etherscan"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {total > limit && (
              <div className="text-center pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Showing {transfers.length} of {total} transfers
                </p>
                <a 
                  href="/wallet/history" 
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View all transfers with advanced filters
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 