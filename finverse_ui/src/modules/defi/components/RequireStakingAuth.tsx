import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStakingAuth } from '@/hooks/useStakingAuth';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';

interface RequireStakingAuthProps {
  children: ReactNode;
}

export function RequireStakingAuth({ children }: RequireStakingAuthProps) {
  const { isAuthenticated, isLoading } = useStakingAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 animate-pulse text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Verifying Staking Access</h2>
          <p className="text-muted-foreground">Please wait while we verify your credentials...</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/staking/login" 
        state={{ 
          from: location.pathname,
          message: 'Please log in to access staking features'
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
}
