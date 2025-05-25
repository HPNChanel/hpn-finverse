import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles, type PaletteMode, Box, CircularProgress, Typography } from '@mui/material';
import { getTheme } from './theme/muiTheme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import ErrorBoundary from './components/ErrorBoundary';
import { MainLayout, PageContainer } from './components/layouts';

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
  RecurringTransactions,
  Goals,
  UserSettings
} from './pages';

// Import transaction-related pages
import CreateTransaction from './pages/transactions/CreateTransaction';
import TransactionHistory from './pages/transactions/TransactionHistory';

// Import new staking routes
import StakingDashboard from './pages/staking/StakingDashboard';
import StakingRegister from './pages/staking/StakingRegister';
import StakingProfile from './pages/staking/StakingProfile';

// Import new landing page
import LandingPage from './pages/landing/LandingPage';

// Protected Route component for authenticated pages
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout wrapper with proper authentication
const AppLayoutWrapper = ({ toggleColorMode, mode }: { toggleColorMode: () => void; mode: PaletteMode }) => {
  return (
    <ProtectedRoute>
      <MainLayout toggleColorMode={toggleColorMode} mode={mode}>
        <Outlet />
      </MainLayout>
    </ProtectedRoute>
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
      <GlobalStyles styles={{ body: { scrollbarGutter: 'stable' } }} />
      <ErrorBoundary>
        <AuthProvider>
          <CurrencyProvider>
            <Router>
              <Routes>
                {/* Routes without MainLayout */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Routes with MainLayout - no protection needed */}
                <Route element={<AppLayoutWrapper toggleColorMode={toggleColorMode} mode={mode} />}>
                  <Route 
                    path="/dashboard" 
                    element={<PageContainer title="Dashboard"><Dashboard /></PageContainer>} 
                  />
                  
                  {/* Transaction management routes */}
                  <Route 
                    path="/transactions" 
                    element={<PageContainer title="Transactions"><Transactions /></PageContainer>} 
                  />
                  <Route 
                    path="/transactions/create" 
                    element={<PageContainer title="Create Transaction"><CreateTransaction /></PageContainer>} 
                  />
                  <Route 
                    path="/transactions/history" 
                    element={<PageContainer title="Transaction History"><TransactionHistory /></PageContainer>} 
                  />
                  
                  <Route 
                    path="/accounts" 
                    element={<PageContainer title="Financial Accounts"><Accounts /></PageContainer>}
                  />
                  <Route 
                    path="/budget" 
                    element={<PageContainer title="Budget Planning"><Budgets /></PageContainer>}
                  />
                  <Route 
                    path="/staking" 
                    element={<PageContainer title="Staking Dashboard"><StakingDashboard /></PageContainer>}
                  />
                  <Route 
                    path="/profile" 
                    element={<PageContainer title="My Profile"><Profile /></PageContainer>}
                  />
                  <Route 
                    path="/goals"
                    element={<PageContainer title="Financial Goals"><Goals /></PageContainer>}
                  />
                  <Route 
                    path="/settings" 
                    element={<PageContainer><UserSettings /></PageContainer>}
                  />
                  
                  {/* Other existing routes - no protection */}
                  <Route 
                    path="/transfer" 
                    element={<PageContainer title="Transfer Funds"><Transfer /></PageContainer>} 
                  />
                   <Route 
                    path="/history" 
                    element={<PageContainer title="History"><History /></PageContainer>} 
                  />
                  <Route 
                    path="/recurring-transactions" 
                    element={<PageContainer title="Recurring Transactions"><RecurringTransactions /></PageContainer>} 
                  />
                  <Route 
                    path="/staking/register" 
                    element={<PageContainer title="Staking Registration"><StakingRegister /></PageContainer>} 
                  />
                  <Route 
                    path="/staking/profile/:validatorId"
                    element={<PageContainer title="Staking Profile"><StakingProfile /></PageContainer>} 
                  />
                </Route>
                
                {/* Fallback route - go to dashboard instead of home */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </CurrencyProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
