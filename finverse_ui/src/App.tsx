import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { getTheme } from './theme/muiTheme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Import pages from the index file
import {
  Dashboard,
  Accounts,
  Transfer,
  Budgets,
  Transactions,
  LoginPage,
  RegisterPage,
  History,
  Profile,
  RecurringTransactions
} from './pages';

// Import new staking routes
import StakingDashboard from './pages/staking/StakingDashboard';
import StakingRegister from './pages/staking/StakingRegister';
import StakingProfile from './pages/staking/StakingProfile';

// Import new landing page
import LandingPage from './pages/landing/LandingPage';

// Components
import Navbar from './components/Navbar';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Component for layouts with Navbar
const AppLayout = ({ toggleColorMode }: { toggleColorMode: () => void }) => {
  return (
    <>
      <Navbar toggleColorMode={toggleColorMode} />
      <Box sx={{ mt: 2 }}>
        <Outlet />
      </Box>
    </>
  );
};

// Main App component
const App: React.FC = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  
  // Theme object based on current mode
  const theme = useMemo(() => getTheme(mode), [mode]);
  
  // Toggle color mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Landing Page (no navbar) */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Routes with Navbar */}
              <Route element={<AppLayout toggleColorMode={toggleColorMode} />}>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Dashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/accounts" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Accounts />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/transfer" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Transfer />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/budgets" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Budgets />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staking" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <StakingDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staking/register" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <StakingRegister />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staking/profile/:id" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <StakingProfile />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Transactions />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <History />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Profile />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/recurring-transactions" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <RecurringTransactions />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
              </Route>
              
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
