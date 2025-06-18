import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { ErrorHandler } from '@/utils/errorHandler.tsx';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';
  const message = location.state?.message;

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    // Basic validation
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      await login({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      // Navigation is handled by the auth context after successful login
    } catch (err) {
      console.error('Login error:', err);
      // Error is already handled by the auth context
    }
  };

  // Safe error rendering - ensure we only render strings
  const renderError = (errorValue: any) => {
    if (!errorValue) return null;
    
    if (typeof errorValue === 'string') {
      return errorValue;
    }
    
    if (Array.isArray(errorValue)) {
      return errorValue
        .map((e: any) => (typeof e === 'string' ? e : e?.msg || e?.message || 'Unknown error'))
        .join(', ');
    }
    
    if (errorValue?.message) {
      return errorValue.message;
    }
    
    if (errorValue?.detail) {
      return errorValue.detail;
    }
    
    return 'An unexpected error occurred';
  };

  const displayError = localError || renderError(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Login to Finverse</h2>
        
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {message}
          </div>
        )}
        
        {displayError && (
          <div className="text-red-600 text-sm">
            {displayError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email || ''} // Ensure never undefined
              onChange={(e) => setEmail(e.target.value || '')}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={isLoading}
              placeholder="Enter your email address"
              autoComplete="email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={isLoading}
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
