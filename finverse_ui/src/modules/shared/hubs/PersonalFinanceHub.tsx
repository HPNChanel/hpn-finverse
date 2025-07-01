import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  CreditCard, 
  PieChart, 
  Target, 
  TrendingUp,
  ArrowRight,
  DollarSign,
  Calculator,
  BarChart3
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

const personalFinanceApps: AppCard[] = [
  {
    id: 'accounts',
    title: 'Accounts Manager',
    description: 'Manage all your financial accounts, track balances, and monitor account health in one centralized dashboard.',
    icon: Wallet,
    route: '/accounts',
    color: 'from-blue-500 to-blue-600',
    features: ['Account Overview', 'Balance Tracking', 'Account Health', 'Multi-Account View'],
    status: 'active'
  },
  {
    id: 'transactions',
    title: 'Transactions Tracker',
    description: 'Track, categorize, and analyze all your financial transactions with powerful filtering and search capabilities.',
    icon: CreditCard,
    route: '/transactions',
    color: 'from-green-500 to-green-600',
    features: ['Transaction History', 'Smart Categories', 'Search & Filter', 'Export Data'],
    status: 'active'
  },
  {
    id: 'budget',
    title: 'Budget Planner',
    description: 'Create comprehensive budgets, set spending limits, and monitor your financial discipline with smart alerts.',
    icon: PieChart,
    route: '/budgets',
    color: 'from-purple-500 to-purple-600',
    features: ['Budget Creation', 'Spending Limits', 'Alert System', 'Progress Tracking'],
    status: 'active'
  },
  {
    id: 'goals',
    title: 'Goal Setter',
    description: 'Set financial goals, track progress, and achieve your dreams with structured planning and milestone tracking.',
    icon: Target,
    route: '/goals',
    color: 'from-orange-500 to-orange-600',
    features: ['Goal Creation', 'Progress Tracking', 'Milestone Planning', 'Achievement Rewards'],
    status: 'active'
  },
  {
    id: 'investment-tracker',
    title: 'Investment Tracker',
    description: 'Monitor your investment portfolio performance, track gains/losses, and analyze investment strategies.',
    icon: TrendingUp,
    route: '/investments',
    color: 'from-emerald-500 to-emerald-600',
    features: ['Portfolio Overview', 'Performance Analysis', 'Asset Allocation', 'ROI Tracking'],
    status: 'coming-soon'
  },
  {
    id: 'expense-analyzer',
    title: 'Expense Analyzer',
    description: 'Deep dive into your spending patterns with advanced analytics and personalized insights.',
    icon: BarChart3,
    route: '/expense-analysis',
    color: 'from-red-500 to-red-600',
    features: ['Spending Patterns', 'Category Analysis', 'Trend Detection', 'Cost Optimization'],
    status: 'coming-soon'
  }
];

export function PersonalFinanceHub() {
  const navigate = useNavigate();

  const handleNavigateToApp = (route: string, appId: string) => {
    if (appId === 'investment-tracker' || appId === 'expense-analyzer') {
      // For coming soon apps, redirect to dashboard
      navigate('/dashboard');
      return;
    }
    navigate(route);
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'coming-soon') {
      return <Badge variant="secondary" className="ml-2">Coming Soon</Badge>;
    }
    return <Badge variant="default" className="ml-2">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Personal Finance Hub
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your personal finances with comprehensive tools and insights
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Apps</span>
              </div>
              <p className="text-2xl font-bold">{personalFinanceApps.length}</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Active Apps</span>
              </div>
              <p className="text-2xl font-bold">
                {personalFinanceApps.filter(app => app.status === 'active').length}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Coming Soon</span>
              </div>
              <p className="text-2xl font-bold">
                {personalFinanceApps.filter(app => app.status === 'coming-soon').length}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-muted-foreground">Categories</span>
              </div>
              <p className="text-2xl font-bold">4</p>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalFinanceApps.map((app) => {
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
                          <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors flex items-center">
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
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard Overview
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}