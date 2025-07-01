import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  LineChart, 
  FileText, 
  Activity,
  Eye,
  Database,
  Target
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

const analyticsApps: AppCard[] = [
  {
    id: 'expense-analytics',
    title: 'Expense Analytics',
    description: 'Deep dive into your spending patterns with interactive charts and detailed breakdowns by category.',
    icon: PieChart,
    route: '/analytics/expenses',
    color: 'from-orange-500 to-orange-600',
    features: ['Spending Patterns', 'Category Breakdown', 'Trend Analysis', 'Budget Comparison'],
    status: 'coming-soon'
  },
  {
    id: 'income-tracker',
    title: 'Income Tracker',
    description: 'Monitor income sources, track growth trends, and analyze revenue patterns over time.',
    icon: TrendingUp,
    route: '/analytics/income',
    color: 'from-green-500 to-green-600',
    features: ['Income Sources', 'Growth Tracking', 'Revenue Patterns', 'Forecasting'],
    status: 'coming-soon'
  },
  {
    id: 'financial-reports',
    title: 'Financial Reports',
    description: 'Generate comprehensive financial reports with customizable periods and export options.',
    icon: FileText,
    route: '/analytics/reports',
    color: 'from-blue-500 to-blue-600',
    features: ['Custom Reports', 'Export Options', 'Historical Data', 'Automated Generation'],
    status: 'coming-soon'
  },
  {
    id: 'portfolio-analytics',
    title: 'Portfolio Analytics',
    description: 'Analyze your investment portfolio performance with risk metrics and return calculations.',
    icon: LineChart,
    route: '/analytics/portfolio',
    color: 'from-purple-500 to-purple-600',
    features: ['Performance Metrics', 'Risk Analysis', 'Asset Allocation', 'ROI Tracking'],
    status: 'coming-soon'
  },
  {
    id: 'insights-engine',
    title: 'Insights Engine',
    description: 'AI-powered financial insights and recommendations based on your spending and saving patterns.',
    icon: Eye,
    route: '/analytics/insights',
    color: 'from-indigo-500 to-indigo-600',
    features: ['AI Insights', 'Recommendations', 'Pattern Recognition', 'Predictive Analysis'],
    status: 'coming-soon'
  },
  {
    id: 'dashboard-builder',
    title: 'Dashboard Builder',
    description: 'Create custom dashboards with drag-and-drop widgets to visualize your financial data.',
    icon: BarChart3,
    route: '/analytics/dashboard-builder',
    color: 'from-emerald-500 to-emerald-600',
    features: ['Custom Dashboards', 'Drag & Drop', 'Widget Library', 'Real-time Data'],
    status: 'coming-soon'
  }
];

export function AnalyticsHub() {
  const navigate = useNavigate();

  const handleNavigateToApp = () => {
    // For now, all analytics apps redirect to dashboard
    // as they are in development
    navigate('/dashboard');
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'coming-soon') {
      return <Badge variant="secondary" className="ml-2">Coming Soon</Badge>;
    }
    return <Badge variant="default" className="ml-2">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Analytics Hub
              </h1>
              <p className="text-lg text-muted-foreground">
                Transform your financial data into actionable insights
              </p>
            </div>
          </div>
          
          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Analytics Hub in Development
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Our analytics suite is being built with advanced visualization and AI-powered insights. 
                  Basic analytics are available in the Dashboard.
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-muted-foreground">Total Apps</span>
              </div>
              <p className="text-2xl font-bold">{analyticsApps.length}</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">In Development</span>
              </div>
              <p className="text-2xl font-bold">
                {analyticsApps.filter(app => app.status === 'coming-soon').length}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Data Sources</span>
              </div>
              <p className="text-2xl font-bold">5+</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Chart Types</span>
              </div>
              <p className="text-2xl font-bold">10+</p>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsApps.map((app) => {
            const IconComponent = app.icon;
            const isComingSoon = app.status === 'coming-soon';
            
            return (
              <Card 
                key={app.id} 
                className={`group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-[1.02] cursor-pointer overflow-hidden relative ${
                  isComingSoon ? 'opacity-75' : ''
                }`}
                onClick={() => handleNavigateToApp()}
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
                          <CardTitle className="text-lg font-semibold group-hover:text-orange-600 transition-colors flex items-center">
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
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Planned Features:</h4>
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
                    className="w-full bg-muted text-muted-foreground cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToApp();
                    }}
                    disabled={isComingSoon}
                  >
                    Preview in Dashboard
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4 text-center">Current Analytics Available</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              ← Back to Hub
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
              Transaction Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/budgets')}>
              Budget Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 