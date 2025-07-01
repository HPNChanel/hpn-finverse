import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertTriangle,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
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

interface TransferHistoryProps {
  className?: string;
  limit?: number;
  showPagination?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  title?: string;
}

export function TransferHistory({ 
  className, 
  limit = 20, 
  showPagination = true,
  showFilters = true,
  showExport = true,
  title = "ETH Transfer History"
}: TransferHistoryProps) {
  const [transfers, setTransfers] = useState<ETHTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [searchAddress, setSearchAddress] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');

  const { toast } = useToast();
  const { accountAddress, isConnected } = useWallet();

  // Fetch transfer history with filters
  const fetchTransferHistory = useCallback(async (page: number = 1) => {
    if (!accountAddress) return;

    try {
      setLoading(true);
      setError('');

      const currentOffset = (page - 1) * limit;
      
      // Prepare filters for backend
      const apiFilters: {
        status?: string;
        direction?: string;
        fromDate?: string;
        toDate?: string;
      } = {};
      
      if (statusFilter !== 'all') {
        apiFilters.status = statusFilter;
      }
      
      if (directionFilter !== 'all') {
        apiFilters.direction = directionFilter;
      }
      
      // Convert time filter to date range
      if (timeFilter !== 'all') {
        const now = new Date();
        const fromDate = new Date();
        
        switch (timeFilter) {
          case '7d':
            fromDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            fromDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            fromDate.setDate(now.getDate() - 90);
            break;
        }
        
        apiFilters.fromDate = fromDate.toISOString();
      }

      // Primary: Use wallet endpoint as specified in requirements  
      let response;
      try {
        response = await walletApi.getEthHistory(accountAddress, limit, currentOffset, apiFilters);
        console.log('✅ Transfer history loaded from wallet endpoint');
      } catch (walletErr) {
        console.warn('⚠️ Wallet endpoint failed, trying eth-transfer endpoint:', walletErr);
        // Fallback: Use eth-transfer endpoint
        response = await ethTransferApi.getEthTransferHistory(accountAddress, limit, currentOffset);
        console.log('✅ Transfer history loaded from eth-transfer endpoint');
      }

      // Apply client-side filtering for search (address/tx hash search not supported by backend yet)
      let filteredTransfers = response.transfers;

      // Filter by address search (client-side for now)
      if (searchAddress.trim()) {
        const searchLower = searchAddress.toLowerCase();
        filteredTransfers = filteredTransfers.filter((transfer: ETHTransfer) => 
          transfer.from_address.toLowerCase().includes(searchLower) ||
          transfer.to_address.toLowerCase().includes(searchLower) ||
          transfer.tx_hash.toLowerCase().includes(searchLower)
        );
      }

      setTransfers(filteredTransfers);
      setTotal(response.total);
      setHasMore(response.has_more);
    } catch (err) {
      console.error('Failed to fetch transfer history:', err);
      setError('Failed to load transfer history');
    } finally {
      setLoading(false);
    }
  }, [accountAddress, limit, searchAddress, timeFilter, statusFilter, directionFilter]);

  useEffect(() => {
    if (isConnected && accountAddress) {
      fetchTransferHistory(currentPage);
    }
  }, [fetchTransferHistory, currentPage, isConnected, accountAddress]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchTransferHistory(1);
    }
  }, [searchAddress, timeFilter, statusFilter, directionFilter]);

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

  // Export to CSV functionality
  const exportToCSV = () => {
    if (transfers.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transfers to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Date', 'Type', 'Amount (ETH)', 'From Address', 'To Address', 'Transaction Hash', 'Status', 'Gas Used', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...transfers.map(transfer => {
        const direction = getTransferDirection(transfer);
        const isOutgoing = direction === 'outgoing';
        return [
          `"${formatDate(transfer.created_at)}"`,
          isOutgoing ? 'Sent' : 'Received',
          transfer.amount_eth,
          `"${transfer.from_address}"`,
          `"${transfer.to_address}"`,
          `"${transfer.tx_hash}"`,
          transfer.status,
          transfer.gas_used || '',
          `"${transfer.notes || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `eth_transfers_${accountAddress}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${transfers.length} transfers to CSV`,
    });
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>Connect your wallet to view transfer history</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {title}
              {total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {total} total
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Your ETH transfer history for {formatAddress(accountAddress || '')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showExport && transfers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTransferHistory(currentPage)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        {showFilters && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Address */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Address/Tx Hash</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="0x... or tx hash"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Time Filter */}
              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Direction Filter */}
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transfers</SelectItem>
                    <SelectItem value="sent">Sent Only</SelectItem>
                    <SelectItem value="received">Received Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

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
            <p className="text-sm text-muted-foreground">
              {searchAddress || timeFilter !== 'all' || statusFilter !== 'all' || directionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your ETH transfers will appear here'}
            </p>
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
                  <TableHead>Gas Fee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const direction = getTransferDirection(transfer);
                  const isOutgoing = direction === 'outgoing';
                  const counterpartyAddress = isOutgoing ? transfer.to_address : transfer.from_address;
                  const gasFeeTH = transfer.gas_used && transfer.gas_price 
                    ? (parseFloat(transfer.gas_used) * parseFloat(transfer.gas_price) / 1e18).toFixed(6)
                    : null;

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
                            {isOutgoing ? 'Sent to' : 'Received from'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">
                          <span className={isOutgoing ? 'text-red-600' : 'text-green-600'}>
                            {isOutgoing ? '-' : '+'}{transfer.amount_eth} ETH
                          </span>
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
                            title="Copy address"
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
                          variant={transfer.status === 'success' ? 'default' : 
                                   transfer.status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {transfer.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {gasFeeTH ? `${gasFeeTH} ETH` : 'N/A'}
                        </span>
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

            {/* Pagination */}
            {showPagination && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {transfers.length} of {total} transfers
                  {total > limit && ` (Page ${currentPage})`}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMore}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 