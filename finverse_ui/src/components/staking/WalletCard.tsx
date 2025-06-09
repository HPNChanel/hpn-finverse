import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Copy, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

export function WalletCard() {
  const {
    isConnected,
    accountAddress,
    shortAddress,
    formattedBalanceETH,
    formattedBalanceFVT,
    isCorrectNetwork,
    networkName,
    connectWallet,
    switchToHardhatNetwork,
    isConnecting
  } = useWallet();

  const { toast } = useToast();

  const copyAddress = async () => {
    if (accountAddress) {
      try {
        await navigator.clipboard.writeText(accountAddress);
        toast({
          title: "Copied!",
          description: "Wallet address copied to clipboard",
        });
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Connect your MetaMask wallet to start staking FVT tokens
          </p>
          <Button 
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full max-w-xs"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connected Wallet
          </div>
          <Badge 
            variant={isCorrectNetwork ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isCorrectNetwork ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {networkName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex-1">
            <p className="font-mono text-sm">{shortAddress}</p>
            <p className="text-xs text-muted-foreground">Wallet Address</p>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyAddress}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open(`https://etherscan.io/address/${accountAddress}`, '_blank')}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Token Balances */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-700">ETH Balance</p>
              <p className="text-xs text-blue-600">Gas & Network fees</p>
            </div>
            <p className="text-lg font-bold text-blue-600">{formattedBalanceETH}</p>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-700">FVT Balance</p>
              <p className="text-xs text-green-600">Available to stake</p>
            </div>
            <p className="text-lg font-bold text-green-600">{formattedBalanceFVT}</p>
          </div>
        </div>

        {/* Network Status */}
        {!isCorrectNetwork && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800">Wrong Network</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Switch to Hardhat Local network to access staking features
                </p>
                <Button 
                  onClick={switchToHardhatNetwork}
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Switch Network
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
