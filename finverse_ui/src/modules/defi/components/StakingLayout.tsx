import { ReactNode } from 'react';
import { useStakingAuth } from '@/hooks/useStakingAuth';
import { useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  BarChart3, 
  History, 
  ArrowLeft,
  Coins,
  Shield,
  Award,
  Users,
  Loader2,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ErrorHandler } from '@/utils/errorHandler';
import { extractErrorMessage } from '@/utils/errorHelpers';

interface StakingLayoutProps {
  children: ReactNode;
}

const stakingNavigation = [
  { 
    name: 'Dashboard', 
    href: '/staking/dashboard', 
    icon: TrendingUp,
    description: 'Overview and staking actions'
  },
  { 
    name: 'History', 
    href: '/staking/history', 
    icon: History,
    description: 'View your staking history and positions'
  },
  { 
    name: 'Analytics', 
    href: '/staking/analytics', 
    icon: BarChart3,
    description: 'Performance insights and reward timeline'
  },
  { 
    name: 'Transfer History', 
    href: '/staking/transfer-history', 
    icon: ArrowUpDown,
    description: 'View your ETH transfer history'
  },
];

// Add a wrapper component for staking routes
export function StakingRouteWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  // Only apply StakingLayout to staking routes
  if (location.pathname.startsWith('/staking')) {
    return <StakingLayout>{children}</StakingLayout>;
  }
  
  return <>{children}</>;
}

export function StakingLayout({ children }: StakingLayoutProps) {
  const { user, isLoading, isAuthenticated, logout, error: authError } = useStakingAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Add loading state for auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading staking interface...</p>
        </div>
      </div>
    );
  }

  // Add error boundary for auth errors
  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
            <p className="text-muted-foreground mb-4">{extractErrorMessage(authError)}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Don't render content if user is not authenticated or user is null
  if (!isAuthenticated || !user) {
    return null;
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // logout function already handles navigation
    } catch (error) {
      console.error('Logout error:', error);
      ErrorHandler.logError(error, 'Staking logout');
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Single Staking Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Brand and navigation */}
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Finverse</span>
              </Link>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-lg">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">ETH Staking</h1>
                  <p className="text-xs text-gray-600">Decentralized Finance</p>
                </div>
              </div>
            </div>

            {/* Center - Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {stakingNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side - User menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                <p className="text-xs text-gray-600">Staking Platform</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                      <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                    <AvatarFallback className="text-sm bg-gradient-to-r from-blue-600 to-green-600 text-white">
                      {getUserInitials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1.5 py-1">
                      <p className="text-sm font-medium leading-relaxed break-words" 
                         title={user.name || user.email}>
                        {user.name || user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground break-all" 
                         title={user.email}>
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full cursor-pointer">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        <span>Main Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Staking Content - Single instance */}
      <main className="flex-1 pb-6">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Single Staking Info Banner */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-200/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Secure Staking Protocol</h3>
                <p className="text-sm text-blue-700">
                  Earn rewards by staking your FVT tokens in our audited smart contracts
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Navigation - Single instance */}
          <div className="md:hidden mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {stakingNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Main Content - Single rendering */}
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Footer - Single instance */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-12">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span>FVT Staking Protocol v1.0</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Secured by Smart Contracts</span>
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Audited</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
