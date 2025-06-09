import React from 'react';
import { MetaMaskConnectionGuard } from '@/components/MetaMaskConnectionGuard';
import { TransferHistory } from '@/components/wallet/TransferHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Shield, 
  TrendingUp, 
  BarChart3,
  Wallet,
  ArrowRight
} from 'lucide-react';

export function WalletHistory() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Wallet Transfer History</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Complete history of your ETH transfers with advanced filtering, search, and export capabilities.
          Track all your transactions in one comprehensive dashboard.
        </p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <History className="w-3 h-3" />
            Complete History
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Secure & Private
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Real-time Updates
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Export Ready
          </Badge>
        </div>
      </div>

      <MetaMaskConnectionGuard>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Transfer History */}
          <div className="lg:col-span-3">
            <TransferHistory 
              className="w-full"
              limit={25}
              showPagination={true}
              showFilters={true}
              showExport={true}
              title="Complete Transfer History"
            />
          </div>

          {/* Sidebar with Quick Stats and Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
                <CardDescription>Your transfer overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-lg font-bold">Track transactions</p>
                  <p className="text-xs text-muted-foreground">Auto-updated</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-lg font-bold">All transfers</p>
                  <p className="text-xs text-muted-foreground">Since joining</p>
                </div>
              </CardContent>
            </Card>

            {/* Features Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
                <CardDescription>What you can do here</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <History className="w-4 h-4 text-blue-500" />
                  <span>View all ETH transfers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Filter by date, status, direction</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span>Search by address or tx hash</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  <span>Export to CSV for records</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  <span>Real-time gas fee tracking</span>
                </div>
              </CardContent>
            </Card>

            {/* How to Use */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
                <CardDescription>Make the most of your history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                    1
                  </div>
                  <span>Use filters to narrow down results</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                    2
                  </div>
                  <span>Search for specific addresses or transactions</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                    3
                  </div>
                  <span>Click copy buttons to save addresses</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                    4
                  </div>
                  <span>Export data for tax/accounting purposes</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    ✓
                  </div>
                  <span>View transactions on Etherscan</span>
                </div>
              </CardContent>
            </Card>

            {/* Data Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data & Privacy</CardTitle>
                <CardDescription>Your data is secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Data stored locally and securely</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Only you can access your history</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>No third-party data sharing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Blockchain data is public by nature</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Related features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="/send-eth" 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">Send ETH</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="/dashboard" 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Dashboard</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="/staking" 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Staking</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </MetaMaskConnectionGuard>
    </div>
  );
} 