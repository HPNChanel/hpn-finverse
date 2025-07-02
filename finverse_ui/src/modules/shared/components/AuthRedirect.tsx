
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
  publicOnly?: boolean;
  requireAuth?: boolean;
}

export function AuthRedirect({ 
  children, 
  redirectTo = '/hub', 
  publicOnly = false, 
  requireAuth = false 
}: AuthRedirectProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If this is a public-only route (like landing page) and user is authenticated
  if (publicOnly && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If this route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Default case: render children
  return <>{children}</>;
}

// Specific redirect component for the landing page
export function LandingRedirect({ children }: { children: React.ReactNode }) {
  return (
    <AuthRedirect publicOnly={true} redirectTo="/hub">
      {children}
    </AuthRedirect>
  );
}

// Specific redirect component for protected routes
export function ProtectedRedirect({ children }: { children: React.ReactNode }) {
  return (
    <AuthRedirect requireAuth={true}>
      {children}
    </AuthRedirect>
  );
} 