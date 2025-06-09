import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  RefreshCw, 
  TrendingUp, 
  Award, 
  Coins, 
  BarChart3, 
  AlertTriangle, 
  Send,
  Shield,
  Zap,
  Clock,
  Wallet // Add missing import
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StakingPanel } from '@/components/staking/StakingPanel';
import { StakeTokenForm } from '@/components/staking/StakeTokenForm';
import { SendTokenForm } from '@/components/staking/SendTokenForm';
import { useToast } from '@/hooks/use-toast';
import { useStakingData } from '@/hooks/useStakingData';
import { useWallet } from '@/hooks/useWallet';

// Add loading skeleton
const StakingSkeleton = () => (
  <div className="space-y-6">
    <Card className="p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </Card>
    <Card className="p-6">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </Card>
  </div>
);

function StakingFeatures() {
  const features = [
    {
      icon: TrendingUp,
      title: "High APY Returns",
      description: "Earn up to 18% APY on your ETH tokens",
      color: "text-green-600"
    },
    {
      icon: Shield,
      title: "Secure Protocol",
      description: "Smart contracts audited and battle-tested",
      color: "text-blue-600"
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Daily reward distribution automatically",
      color: "text-yellow-600"
    },
    {
      icon: Clock,
      title: "Flexible Terms",
      description: "Choose from multiple lock periods",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <Card key={index} className="text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-muted">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Staking() {
  const { toast } = useToast();
  const { isConnected, accountAddress, isCorrectNetwork, connectWallet } = useWallet();
  
  // Only load staking data when wallet is properly connected
  const stakingDataProps = useStakingData();

  // Show full dashboard only when wallet is connected
  if (isConnected && accountAddress && isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
          <div className="space-y-8">
            {/* Single Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ETH Staking Platform</h1>
              <p className="text-muted-foreground">
                Stake your ETH tokens and earn rewards through our secure protocol
              </p>
            </div>

            {/* Features Section - Single instance */}
            <StakingFeatures />

            {/* Staking Panel - Single instance */}
            <StakingPanel onStakeSuccess={() => stakingDataProps.refreshData()} />
          </div>
        </div>
      </div>
    );
  }

  // Show connection prompt when not connected - Single instance
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center space-y-8">
          {/* Single Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ETH Staking Platform</h1>
            <p className="text-muted-foreground">
              Connect your wallet to start earning rewards on your ETH tokens
            </p>
          </div>

          {/* Features Section */}
          <StakingFeatures />

          {/* Connection Card */}
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-semibold">Connect Wallet to Stake</h2>
                <p className="text-muted-foreground">
                  Please connect your MetaMask wallet to access staking features.
                </p>
                <Button onClick={connectWallet} size="lg" className="w-full">
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
