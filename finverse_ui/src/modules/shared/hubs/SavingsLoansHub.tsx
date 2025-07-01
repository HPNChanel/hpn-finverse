import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PiggyBank, 
  Calculator, 
  Target, 
  TrendingUp, 
  CreditCard, 
  ArrowRight,
  DollarSign,
  Calendar,
  FileText,
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

const savingsLoansApps: AppCard[] = [
  {
    id: 'savings-planner',
    title: 'Savings Planner',
    description: 'Create comprehensive savings plans, set targets, and track your progress towards financial milestones.',
    icon: PiggyBank,
    route: '/savings',
    color: 'from-green-500 to-green-600',
    features: ['Savings Plans', 'Target Setting', 'Progress Tracking', 'Automated Savings'],
    status: 'active'
  },
  {
    id: 'loan-center',
    title: 'Loan Center',
    description: 'Explore loan options, apply for credit, and manage existing loans with detailed payment tracking.',
    icon: Calculator,
    route: '/loans',
    color: 'from-blue-500 to-blue-600',
    features: ['Loan Applications', 'Payment Tracking', 'Interest Calculator', 'Credit Analysis'],
    status: 'active'
  },
  {
    id: 'financial-goals',
    title: 'Financial Goals',
    description: 'Set and achieve your financial goals with smart planning, milestone tracking, and progress insights.',
    icon: Target,
    route: '/goals',
    color: 'from-purple-500 to-purple-600',
    features: ['Goal Setting', 'Milestone Tracking', 'Progress Analytics', 'Achievement Rewards'],
    status: 'active'
  },
  {
    id: 'investment-planner',
    title: 'Investment Planner',
    description: 'Plan and optimize your investment portfolio with risk assessment and return projections.',
    icon: TrendingUp,
    route: '/investments/planner',
    color: 'from-orange-500 to-orange-600',
    features: ['Portfolio Planning', 'Risk Assessment', 'Return Projections', 'Diversification'],
    status: 'coming-soon'
  },
  {
    id: 'credit-monitor',
    title: 'Credit Monitor',
    description: 'Monitor your credit score, track credit history, and get insights for credit improvement.',
    icon: CreditCard,
    route: '/credit/monitor',
    color: 'from-indigo-500 to-indigo-600',
    features: ['Credit Score', 'Credit History', 'Improvement Tips', 'Alert System'],
    status: 'coming-soon'
  },
  {
    id: 'financial-reports',
    title: 'Financial Reports',
    description: 'Generate comprehensive financial reports for loans, savings, and overall financial health analysis.',
    icon: FileText,
    route: '/reports/financial',
    color: 'from-emerald-500 to-emerald-600',
    features: ['Detailed Reports', 'Export Options', 'Trend Analysis', 'Custom Periods'],
    status: 'coming-soon'
  }
];

export function SavingsLoansHub() {
  const navigate = useNavigate();

  const handleNavigateToApp = (route: string, appId: string) => {
    if (appId === 'savings-planner') {
      navigate('/savings');
      return;
    }
    if (appId === 'loan-center') {
      navigate('/loans');
      return;
    }
    if (appId === 'financial-goals') {
      navigate('/goals');
      return;
    }
    // For coming soon apps, redirect to dashboard
    navigate('/dashboard');
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'coming-soon') {
      return <Badge variant="secondary" className="ml-2">Coming Soon</Badge>;
    }
    return <Badge variant="default" className="ml-2">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
              <PiggyBank className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Savings & Loans Hub
              </h1>
              <p className="text-lg text-muted-foreground">
                Build wealth through smart savings and strategic lending
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
              <p className="text-2xl font-bold">{savingsLoansApps.length}</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Active Apps</span>
              </div>
              <p className="text-2xl font-bold">
                {savingsLoansApps.filter(app => app.status === 'active').length}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Coming Soon</span>
              </div>
              <p className="text-2xl font-bold">
                {savingsLoansApps.filter(app => app.status === 'coming-soon').length}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-muted-foreground">Features</span>
              </div>
              <p className="text-2xl font-bold">24+</p>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingsLoansApps.map((app) => {
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
                          <CardTitle className="text-lg font-semibold group-hover:text-green-600 transition-colors flex items-center">
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
            <Button variant="outline" size="sm" onClick={() => navigate('/savings')}>
              Savings Overview
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/loans')}>
              Loan Management
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/goals')}>
              Financial Goals
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 