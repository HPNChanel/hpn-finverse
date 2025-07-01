import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Coins, 
  BarChart3, 
  Wallet, 
  Shield, 
  ArrowRight,
  Zap,
  Globe,
  Clock,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  color: string;
  features: string[];
  status?: 'active' | 'coming-soon';
}

const defiStakingApps: AppCard[] = [
  {
    id: 'staking-dashboard',
    title: 'Staking Dashboard',
    description: 'Monitor all your staking positions, rewards, and performance metrics across different protocols and tokens.',
    icon: TrendingUp,
    route: '/staking/dashboard',
    color: 'from-purple-500 to-purple-600',
    features: ['Active Stakes', 'Performance Metrics', 'Portfolio Overview', 'Real-time Updates'],
    status: 'active'
  },
  {
    id: 'rewards-tracker',
    title: 'Rewards Tracker',
    description: 'Track earned rewards, claim history, and optimize your reward collection strategies across all protocols.',
    icon: Award,
    route: '/staking/rewards',
    color: 'from-green-500 to-green-600',
    features: ['Reward History', 'Auto-Claim', 'Yield Optimization', 'Tax Reports'],
    status: 'coming-soon'
  },
  {
    id: 'staking-analytics',
    title: 'Staking Analytics',
    description: 'Advanced analytics for your staking performance with detailed charts, trends, and strategic insights.',
    icon: BarChart3,
    route: '/staking/analytics',
    color: 'from-blue-500 to-blue-600',
    features: ['Performance Charts', 'ROI Analysis', 'Risk Assessment', 'Strategy Insights'],
    status: 'active'
  },
  {
    id: 'token-manager',
    title: 'Token Manager',
    description: 'Manage your cryptocurrency tokens, check balances, and execute staking transactions seamlessly.',
    icon: Coins,
    route: '/staking/tokens',
    color: 'from-orange-500 to-orange-600',
    features: ['Token Balances', 'Stake/Unstake', 'Transfer Tokens', 'Transaction History'],
    status: 'coming-soon'
  },
  {
    id: 'wallet-connector',
    title: 'Wallet Connector',
    description: 'Connect and manage multiple wallets, monitor balances, and ensure secure blockchain interactions.',
    icon: Wallet,
    route: '/wallet/connect',
    color: 'from-indigo-500 to-indigo-600',
    features: ['Multi-Wallet Support', 'Balance Monitoring', 'Security Features', 'Transaction Signing'],
    status: 'coming-soon'
  },
  {
    id: 'security-center',
    title: 'Security Center',
    description: 'Comprehensive security tools to protect your DeFi assets and monitor for potential threats.',
    icon: Shield,
    route: '/security',
    color: 'from-red-500 to-red-600',
    features: ['Threat Detection', 'Asset Protection', 'Security Alerts', 'Audit Reports'],
    status: 'coming-soon'
  }
];

export function DefiStakingHub() {
  const navigate = useNavigate();

  const handleNavigateToApp = (route: string, appId: string) => {
    if (appId === 'staking-dashboard') {
      navigate('/staking/dashboard');
      return;
    }
    if (appId === 'staking-analytics') {
      navigate('/staking/analytics');
      return;
    }
    // For coming soon apps, redirect to staking main page
    navigate('/staking');
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'coming-soon') {
      return <Badge variant="secondary" className="ml-2">Coming Soon</Badge>;
    }
    return <Badge variant="default" className="ml-2">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                DeFi & Staking Hub
              </h1>
              <p className="text-lg text-muted-foreground">
                Maximize your cryptocurrency earnings through decentralized finance
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Total Apps</span>
              </div>
              <p className="text-2xl font-bold">{defiStakingApps.length}</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Active Apps</span>
              </div>
              <p className="text-2xl font-bold">
                {defiStakingApps.filter(app => app.status === 'active').length}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Coming Soon</span>
              </div>
              <p className="text-2xl font-bold">
                {defiStakingApps.filter(app => app.status === 'coming-soon').length}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-muted-foreground">Protocols</span>
              </div>
              <p className="text-2xl font-bold">3+</p>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {defiStakingApps.map((app) => {
            const IconComponent = app.icon;
            const isComingSoon = app.status === 'coming-soon';
            
            return (
              <Card 
                key={app.id} 
                className={`group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-[1.02] cursor-pointer overflow-hidden relative ${
                  isComingSoon ? 'opacity-75' : ''
                }`}
                onClick={() => handleNavigateToApp(app.route, app.id)}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${app.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold group-hover:text-purple-600 transition-colors flex items-center">
                            {app.title}
                            {getStatusBadge(app.status)}
                          </CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                        {app.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative">
                  {/* Features List */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Features:</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {app.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${app.color} mr-2`} />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* App Button */}
                  <Button 
                    className={`w-full transition-colors ${
                      isComingSoon 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'group-hover:bg-primary/90'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToApp(app.route, app.id);
                    }}
                    disabled={isComingSoon}
                  >
                    {isComingSoon ? (
                      <>
                        Coming Soon
                      </>
                    ) : (
                      <>
                        Go to App
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4 text-center">Quick Navigation</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              ← Back to Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/staking')}>
              Staking Overview
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/wallet/history')}>
              Wallet History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 