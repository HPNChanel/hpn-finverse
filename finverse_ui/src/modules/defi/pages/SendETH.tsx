import React, { useState } from 'react';
import { MetaMaskConnectionGuard } from '@/modules/defi/components/MetaMaskConnectionGuard';
import { SendETHForm } from '@/modules/defi/components/SendETHForm';
import { ETHTransferHistory } from '@/modules/defi/components/ETHTransferHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Shield, Zap, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SendETH() {
  const { toast } = useToast();
  const [refreshHistory, setRefreshHistory] = useState(false);

  const handleSendSuccess = (txHash: string, amount: string, recipient: string) => {
    console.log('✅ ETH sent successfully:', { txHash, amount, recipient });
    toast({
      title: "Transfer Complete!",
      description: `Successfully sent ${amount} ETH to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
    });
    // Trigger history refresh
    setRefreshHistory(prev => !prev);
  };

  const handleSendError = (error: string) => {
    console.error('❌ ETH send failed:', error);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Send ETH</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transfer Ethereum directly to any address using MetaMask. Fast, secure, and tracked in your FinVerse portfolio.
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            MetaMask Secured
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Real-time Gas Estimation
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <History className="w-3 h-3" />
            Transaction History
          </Badge>
        </div>
      </div>

      <MetaMaskConnectionGuard>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="send" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="send">Send ETH</TabsTrigger>
                <TabsTrigger value="history">Transfer History</TabsTrigger>
              </TabsList>
              <TabsContent value="send" className="space-y-4">
                <SendETHForm 
                  onSendSuccess={handleSendSuccess}
                  onSendError={handleSendError}
                  className="w-full"
                />
              </TabsContent>
              <TabsContent value="history" className="space-y-4">
                <ETHTransferHistory 
                  key={refreshHistory.toString()} 
                  className="w-full" 
                  limit={20} 
                />
                
                {/* Link to Full History Page */}
                <div className="text-center pt-4">
                  <a 
                    href="/wallet/history" 
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View complete history with advanced filters
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How it Works</CardTitle>
                <CardDescription>Simple, secure ETH transfers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Connect MetaMask</p>
                    <p className="text-sm text-muted-foreground">Ensure you're on Hardhat Local network</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Enter Details</p>
                    <p className="text-sm text-muted-foreground">Recipient address and ETH amount</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Confirm & Send</p>
                    <p className="text-sm text-muted-foreground">Review gas fees and complete transfer</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">Auto-tracked</p>
                    <p className="text-sm text-muted-foreground">Transaction saved to your portfolio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Features</CardTitle>
                <CardDescription>Your safety is our priority</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">MetaMask wallet integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Real-time balance validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Gas fee estimation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Address format validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Transaction confirmation</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Tips</CardTitle>
                <CardDescription>Get the most out of your transfers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Minimum transfer: 0.0001 ETH</span>
                </div>
                <div className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Use "Max" button for full balance (minus gas)</span>
                </div>
                <div className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Double-check recipient address</span>
                </div>
                <div className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Save transaction hash for records</span>
                </div>
                <div className="flex gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Check network before sending</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MetaMaskConnectionGuard>
    </div>
  );
} 