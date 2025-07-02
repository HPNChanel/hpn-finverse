import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  ArrowUpRight, 
  Bell, 
  Plus,
  PiggyBank,
  Wallet,
  Send,
  Zap,
  CreditCard,
  BarChart3,
  Repeat,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useSmartHubData } from '@/hooks/useSmartHubData';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Quick actions configuration
const quickActions = [
  { label: 'Send ETH', path: '/send-eth', icon: Send, color: 'bg-blue-500' },
  { label: 'Add Transaction', path: '/transactions', icon: Plus, color: 'bg-green-500' },
  { label: 'Check Staking', path: '/hubs/defi-staking', icon: TrendingUp, color: 'bg-purple-500' },
  { label: 'Check Savings', path: '/savings', icon: Target, color: 'bg-orange-500' },
];

export function SmartHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: hubData, isLoading, error, refetch } = useSmartHubData();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  // Show loading state
  if (isLoading && !hubData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg">Loading your financial overview...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !hubData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Alert className="max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Welcome Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's your financial overview for {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={refetch}>
                <Bell className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Grid Layout */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Financial Overview Cards */}
          <motion.div className="lg:col-span-8 space-y-6" variants={itemVariants}>
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        ${(hubData?.totalBalance || 0).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <ArrowUpRight className="w-3 h-3" />
                        +{(hubData?.monthlyChange || 0).toFixed(1)}% this month
                      </div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Staking Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        ${(hubData?.stakingRewards || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {hubData?.activeStakes || 0} active stakes
                      </div>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{hubData?.activeSavings || 0}</div>
                      <div className="text-sm text-muted-foreground">Savings plans</div>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Financial Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hubData?.goals?.length ? (
                  hubData.goals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{goal.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No active financial goals</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/goals')}>
                      Create Goal
                    </Button>
                  </div>
                )}
                {hubData?.goals?.length && (
                  <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/goals')}>
                    Manage Goals
                  </Button>
                )}
              </CardContent>
            </Card>

          </motion.div>

          {/* Sidebar */}
          <motion.div className="lg:col-span-4 space-y-6" variants={itemVariants}>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto flex-col gap-2 p-4 hover:scale-105 transition-transform"
                      onClick={() => navigate(action.path)}
                    >
                      <div className={`p-2 rounded-full ${action.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hubData?.recentActivity?.length ? (
                  hubData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'income' ? 'bg-green-500/10 text-green-600' :
                          activity.type === 'transfer' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {activity.type === 'income' ? <TrendingUp className="w-4 h-4" /> :
                           activity.type === 'transfer' ? <Repeat className="w-4 h-4" /> :
                           <CreditCard className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <div className={`font-medium ${
                        activity.type === 'income' ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {activity.type === 'income' ? '+' : '-'}${activity.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
                {hubData?.recentActivity?.length && (
                  <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/transactions')}>
                    View All Transactions
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Feature Hub Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Feature Hubs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/hubs/analytics')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics Hub
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/hubs/defi-staking')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  DeFi Staking
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/hubs/personal-finance')}>
                  <PiggyBank className="w-4 h-4 mr-2" />
                  Personal Finance
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/hubs/savings-loans')}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Savings & Loans
                </Button>
              </CardContent>
            </Card>

          </motion.div>

        </motion.div>

      </div>
    </div>
  );
} 