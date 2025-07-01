import React from 'react';
import { 
  Wallet, 
  Download, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  Shield,
  Coins,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

interface MetaMaskConnectionGuardProps {
  children: React.ReactNode;
  showFeatures?: boolean;
  title?: string;
  description?: string;
}

export function MetaMaskConnectionGuard({ 
  children, 
  showFeatures = true,
  title = "Welcome to ETH Staking",
  description = "Connect your MetaMask wallet to start staking ETH and earning rewards"
}: MetaMaskConnectionGuardProps) {
  const {
    isMetaMaskInstalled,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    networkName,
    accountAddress,
    formattedBalanceETH,
    connectWallet,
    switchToHardhatNetwork,
    error,
    clearError
  } = useWallet();

  const { toast } = useToast();

  // Handle wallet connection
  const handleConnect = async () => {
    clearError();
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (err) {
      console.error('Connection failed:', err);
      // Error is already handled in the useWallet hook
    }
  };

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      await switchToHardhatNetwork();
      toast({
        title: "Network Switched",
        description: "Successfully switched to Hardhat Local network",
      });
    } catch (err) {
      console.error('Network switch failed:', err);
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch to Hardhat Local network. Please try manually.",
        variant: "destructive",
      });
    }
  };

  // MetaMask not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-lg mx-auto border-2 border-orange-200">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-10 h-10 text-orange-600" />
            </div>
            <CardTitle className="text-2xl text-orange-600">MetaMask Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <p className="text-gray-600 mb-2">
                You need MetaMask installed to access the staking platform.
              </p>
              <p className="text-sm text-gray-500">
                MetaMask is a secure wallet that allows you to interact with the Ethereum blockchain.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Why MetaMask?</h4>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Secure wallet for your crypto assets</li>
                <li>• Industry standard for DeFi applications</li>
                <li>• Full control over your private keys</li>
                <li>• Easy to use browser extension</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Button 
                asChild 
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Install MetaMask
                </a>
              </Button>
              
              <p className="text-xs text-gray-500">
                After installation, refresh this page to continue
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-lg mx-auto border-2 border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={clearError}
                className="w-full"
              >
                Dismiss Error
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-[60vh] p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
              <Coins className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">{title}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            </div>
          </div>

          {/* Features Grid - Only show if enabled */}
          {showFeatures && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
                <CardContent className="pt-6 text-center">
                  <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Secure Protocol</h3>
                  <p className="text-sm text-muted-foreground">
                    Audited smart contracts ensure your funds are always safe
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">High APY</h3>
                  <p className="text-sm text-muted-foreground">
                    Competitive rewards with flexible staking options
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
                <CardContent className="pt-6 text-center">
                  <Coins className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Multiple Pools</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose from various staking pools to maximize returns
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Connect Wallet Card */}
          <Card className="max-w-md mx-auto border-2 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Wallet className="w-6 h-6 text-blue-600" />
                Connect Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your MetaMask wallet to start staking ETH and earning rewards.
                </p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">MetaMask Detected</span>
                </div>
              </div>
              
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect MetaMask
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p><strong>Network Required:</strong> Hardhat Local</p>
                <p><strong>Chain ID:</strong> 31337</p>
                <p><strong>RPC URL:</strong> http://127.0.0.1:8545</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Wrong network state
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-lg mx-auto border-2 border-yellow-200">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl text-yellow-600">Wrong Network</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge variant="secondary" className="text-sm">
                  Current: {networkName}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                You're connected to the wrong network. Please switch to Hardhat Local network to use the staking platform.
              </p>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-left text-sm">
                <strong>Required Network Details:</strong><br />
                <span className="font-mono">
                  Name: Hardhat Local<br />
                  Chain ID: 31337<br />
                  RPC URL: http://127.0.0.1:8545
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={handleSwitchNetwork} 
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Switch to Hardhat Local
              </Button>
              
              <p className="text-xs text-gray-500">
                This will open a MetaMask popup to switch networks
              </p>
            </div>

            {/* Connected account info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Connected Account:</p>
                <p className="font-mono text-xs break-all">{accountAddress}</p>
                <p className="mt-1">Balance: {formattedBalanceETH} ETH</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All good - render children
  return <>{children}</>;
} 