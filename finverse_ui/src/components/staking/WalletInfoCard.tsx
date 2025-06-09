import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { TransferETHModal } from '@/components/TransferETHModal';

export function WalletInfoCard() {
  const { 
    isConnected, 
    currentAccount,
    balance,
    chainId,
    connect
  } = useWallet();
  
  const { toast } = useToast();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Helper functions
  const shortAddress = currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : '';
  const formattedBalanceETH = parseFloat(balance).toFixed(3);
  const isCorrectNetwork = chainId === '31337' || chainId === '1337'; // Hardhat local network
  const networkName = isCorrectNetwork ? 'Hardhat Local' : chainId ? `Chain ${chainId}` : 'Unknown';
  const isConnecting = false; // You might want to add this to the useWallet hook

  const copyAddress = () => {
    if (currentAccount) {
      navigator.clipboard.writeText(currentAccount);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const openInExplorer = () => {
    if (currentAccount) {
      window.open(`https://etherscan.io/address/${currentAccount}`, '_blank');
    }
  };

  const switchToHardhatNetwork = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to start staking FVT tokens
          </p>
          <Button 
            onClick={connect} 
            disabled={isConnecting}
            className="w-full"
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
            Wallet Info
          </div>
          <Badge variant={isCorrectNetwork ? "default" : "destructive"}>
            {isCorrectNetwork ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <AlertTriangle className="w-3 h-3 mr-1" />
            )}
            {networkName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">{shortAddress}</p>
            <p className="text-xs text-muted-foreground">Wallet Address</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={openInExplorer}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-700">ETH Balance</p>
            <p className="text-lg font-bold text-blue-600">{formattedBalanceETH}</p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-700">FVT Balance</p>
            <p className="text-lg font-bold text-green-600">0.00</p>
          </div>
        </div>

        {/* Transfer ETH Button */}
        {isConnected && isCorrectNetwork && (
          <Button 
            onClick={() => setIsTransferModalOpen(true)}
            variant="outline"
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Transfer ETH
          </Button>
        )}

        {/* Network Warning */}
        {!isCorrectNetwork && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Wrong Network</p>
                <p className="text-xs text-red-600 mb-2">
                  Please switch to Hardhat Local network to use staking features
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={switchToHardhatNetwork}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Switch Network
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer ETH Modal */}
        <TransferETHModal 
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
        />
      </CardContent>
    </Card>
  );
}
