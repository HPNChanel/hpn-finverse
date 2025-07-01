import React from 'react';
import { TransferHistory } from '@/modules/defi/components/TransferHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpDown, 
  TrendingUp, 
  Shield, 
  BarChart3,
  Coins,
  ArrowRight
} from 'lucide-react';

export function StakingTransferHistory() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <ArrowUpDown className="h-8 w-8 text-blue-600" />
          Transfer History
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track all your ETH transfers related to staking activities and regular wallet transactions.
          Monitor your staking deposits, withdrawals, and rewards.
        </p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Staking Related
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Real-time Updates
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Detailed Analytics
          </Badge>
        </div>
      </div>

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

        {/* Sidebar with Staking-specific Info */}
        <div className="space-y-6">
          {/* Staking Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-600" />
                Staking Context
              </CardTitle>
              <CardDescription>How transfers relate to staking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span><strong>Deposits:</strong> ETH sent to staking contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-blue-500" />
                <span><strong>Withdrawals:</strong> ETH received from unstaking</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span><strong>Rewards:</strong> Staking rewards received</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" />
                <span><strong>Regular:</strong> Standard ETH transfers</span>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Types Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfer Types</CardTitle>
              <CardDescription>Understanding your transfers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-1">Staking Deposits</h4>
                <p className="text-sm text-green-700">
                  ETH sent to staking contracts to earn rewards
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-1">Unstaking</h4>
                <p className="text-sm text-blue-700">
                  ETH withdrawn from staking positions
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-1">Rewards</h4>
                <p className="text-sm text-purple-700">
                  Earned rewards from staking activities
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Related staking features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a 
                href="/staking/dashboard" 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Staking Dashboard</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="/staking/history" 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Staking History</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="/staking/analytics" 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Analytics</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="/send-eth" 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-sm">Send ETH</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>

          {/* Tips for Staking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staking Tips</CardTitle>
              <CardDescription>Maximize your staking experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                  💡
                </div>
                <span>Monitor gas fees before staking/unstaking</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-medium">
                  📊
                </div>
                <span>Track your transfer history for tax purposes</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-medium">
                  🔄
                </div>
                <span>Regular transfers don't affect staking positions</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-medium">
                  ⚡
                </div>
                <span>Export data for detailed analysis</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 