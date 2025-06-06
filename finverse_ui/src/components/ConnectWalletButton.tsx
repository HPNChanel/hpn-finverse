import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  Copy,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ConnectWalletButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showBalances?: boolean;
  showNetworkInfo?: boolean;
  compact?: boolean;
}

export function ConnectWalletButton({ 
  variant = 'default',
  size = 'default',
  className,
  showBalances = true,
  showNetworkInfo = true,
  compact = false
}: ConnectWalletButtonProps) {
  const {
    accountAddress,
    isConnected,
    isConnecting,
    isReconnecting,
    balanceETH,
    balanceFVT,
    chainId,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    reconnectWallet,
    switchToHardhatNetwork,
    error,
    clearError,
    isMetaMaskInstalled
  } = useWallet();

  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  // Format address for display (0x1234...abcd)
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (balance: string, decimals: number = 4): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(decimals);
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!accountAddress) return;
    
    try {
      await navigator.clipboard.writeText(accountAddress);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle wallet connection
  const handleConnect = async () => {
    clearError();
    try {
      await connectWallet();
    } catch (err) {
      // Error handling is done in the useWallet hook
      console.error('Connection failed:', err);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      await switchToHardhatNetwork();
    } catch (err) {
      console.error('Network switch failed:', err);
    }
  };

  // If MetaMask is not installed
  if (!isMetaMaskInstalled) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>MetaMask is required to connect your wallet</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://metamask.io/', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Install
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="flex-1">{error}</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearError}
          >
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleConnect}
        disabled={isConnecting}
        className={cn("relative", className)}
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  // Connected state - compact view
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isReconnecting && (
          <Badge variant="secondary" className="text-xs animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Switching...
          </Badge>
        )}
        {!isCorrectNetwork && (
          <Badge variant="destructive" className="text-xs">
            Wrong Network
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={copyAddress}
          disabled={isReconnecting}
          className="font-mono text-xs"
        >
          {copied ? (
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 mr-1" />
          )}
          {formatAddress(accountAddress!)}
        </Button>
      </div>
    );
  }

  // Connected state - full view
  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardContent className="p-4">
        {/* Header with connection status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isReconnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-blue-600">Switching Account...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Connected</span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={isReconnecting}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Disconnect
          </Button>
        </div>

        {/* Account switching notice */}
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          💡 Switch accounts in MetaMask to change connected wallet
        </div>

        {/* Address with copy functionality */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={copyAddress}
            disabled={isReconnecting}
            className="font-mono text-sm flex-1 justify-start"
          >
            {copied ? (
              <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 mr-2" />
            )}
            {formatAddress(accountAddress!)}
          </Button>
        </div>

        {/* Manual reconnection button */}
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={reconnectWallet}
            disabled={isReconnecting}
            className="w-full text-xs"
          >
            {isReconnecting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Connection
              </>
            )}
          </Button>
        </div>

        {/* Network Status */}
        {showNetworkInfo && (
          <div className="mb-3">
            {isCorrectNetwork ? (
              <Badge variant="default" className="text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                Hardhat Local
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  Wrong Network
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchNetwork}
                  disabled={isReconnecting}
                  className="h-6 px-2 text-xs"
                >
                  Switch
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Balances */}
        {showBalances && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">ETH Balance:</span>
              <span className={cn(
                "font-mono font-medium",
                isReconnecting && "opacity-50"
              )}>
                {formatBalance(balanceETH)} ETH
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">FVT Balance:</span>
              <span className={cn(
                "font-mono font-medium",
                isReconnecting && "opacity-50"
              )}>
                {formatBalance(balanceFVT)} FVT
              </span>
            </div>
          </div>
        )}

        {/* Account switching instructions */}
        {!isReconnecting && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              Switch accounts in MetaMask to use a different wallet
            </div>
          </div>
        )}

        {/* Chain ID for debugging */}
        {import.meta.env?.DEV && chainId && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Chain ID: {chainId}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export component and props type for reuse
export type { ConnectWalletButtonProps };
