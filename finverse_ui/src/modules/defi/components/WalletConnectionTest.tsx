import React from 'react';
import { MetaMaskConnectionGuard } from './MetaMaskConnectionGuard';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Wallet, Loader2 } from 'lucide-react';

export function WalletConnectionTest() {
  const {
    isMetaMaskInstalled,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    accountAddress,
    formattedBalanceETH,
    chainId,
    networkName,
    error,
    connectWallet,
    disconnectWallet,
    switchToHardhatNetwork
  } = useWallet();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">MetaMask Connection Test</h1>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MetaMask Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isMetaMaskInstalled ? "default" : "destructive"}>
              {isMetaMaskInstalled ? "✅ Installed" : "❌ Not Found"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "🔗 Connected" : "⚡ Disconnected"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Network Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isCorrectNetwork ? "default" : "destructive"}>
              {isCorrectNetwork ? "✅ Correct" : "⚠️ Wrong"}
            </Badge>
            <p className="text-xs mt-1 text-muted-foreground">
              {chainId ? `Chain: ${chainId} (${networkName})` : 'No network'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      {isConnected && accountAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Address: </span>
              <span className="font-mono text-sm">{accountAddress}</span>
            </div>
            <div>
              <span className="font-medium">Balance: </span>
              <span>{formattedBalanceETH} ETH</span>
            </div>
            <div>
              <span className="font-medium">Network: </span>
              <span>{networkName} (Chain ID: {chainId})</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {!isConnected && isMetaMaskInstalled && (
          <Button onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        )}

        {isConnected && (
          <Button onClick={disconnectWallet} variant="outline">
            Disconnect Wallet
          </Button>
        )}

        {isConnected && !isCorrectNetwork && (
          <Button onClick={switchToHardhatNetwork} variant="secondary">
            Switch to Hardhat
          </Button>
        )}
      </div>

      {/* Demo Component with Guard */}
      <Card>
        <CardHeader>
          <CardTitle>MetaMask Guard Component Test</CardTitle>
        </CardHeader>
        <CardContent>
          <MetaMaskConnectionGuard showFeatures={false}>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Success! You are connected and on the correct network.
                </span>
              </div>
              <p className="text-green-700 text-sm mt-2">
                This content only shows when MetaMask is properly connected.
              </p>
            </div>
          </MetaMaskConnectionGuard>
        </CardContent>
      </Card>
    </div>
  );
} 