import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles, type PaletteMode } from '@mui/material';
import { getTheme } from './theme/muiTheme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext'; // Add this import
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
  TrendsPage,
  Goals,
  UserSettings // Import UserSettings
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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // TODO: Add isLoading check here once AuthContext provides it for better UX
  const { isAuthenticated /*, isLoading */ } = useAuth(); 
  
  // if (isLoading) {
  //   return <div>Loading authentication status...</div>; 
  // }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout for routes that use MainLayout and PageContainer
const AppLayout = ({ toggleColorMode, mode }: { toggleColorMode: () => void; mode: PaletteMode }) => (
  <MainLayout toggleColorMode={toggleColorMode} mode={mode}>
    <Outlet />
  </MainLayout>
);

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
          <CurrencyProvider> {/* Add CurrencyProvider */}
            <Router>
              <Routes>
                {/* Routes without MainLayout */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Routes with MainLayout and PageContainer */}
                <Route element={<AppLayout toggleColorMode={toggleColorMode} mode={mode} />}>
                  <Route 
                    path="/dashboard" 
                    element={<ProtectedRoute><PageContainer title="Dashboard"><Dashboard /></PageContainer></ProtectedRoute>} 
                  />
                  
                  {/* Transaction management routes */}
                  <Route 
                    path="/transactions" 
                    element={<ProtectedRoute><PageContainer title="Transactions"><Transactions /></PageContainer></ProtectedRoute>} 
                  />
                  <Route 
                    path="/transactions/create" 
                    element={<ProtectedRoute><PageContainer title="Create Transaction"><CreateTransaction /></PageContainer></ProtectedRoute>} 
                  />
                  <Route 
                    path="/transactions/history" 
                    element={<ProtectedRoute><PageContainer title="Transaction History"><TransactionHistory /></PageContainer></ProtectedRoute>} 
                  />
                  
                  <Route 
                    path="/accounts" 
                    element={<ProtectedRoute><PageContainer title="Financial Accounts"><Accounts /></PageContainer></ProtectedRoute>}
                  />
                  <Route 
                    path="/budget" 
                    element={<ProtectedRoute><PageContainer title="Budget Planning"><Budgets /></PageContainer></ProtectedRoute>}
                  />
                  <Route 
                    path="/staking" 
                    element={<ProtectedRoute><PageContainer title="Staking Dashboard"><StakingDashboard /></PageContainer></ProtectedRoute>}
                  />
                  <Route 
                    path="/profile" 
                    element={<ProtectedRoute><PageContainer title="My Profile"><Profile /></PageContainer></ProtectedRoute>}
                  />
                  <Route 
                    path="/trends" 
                    element={<ProtectedRoute><PageContainer title="Trends & Reports"><TrendsPage /></PageContainer></ProtectedRoute>} 
                  />
                  <Route 
                    path="/goals"
                    element={<ProtectedRoute><PageContainer title="Financial Goals"><Goals /></PageContainer></ProtectedRoute>}
                  />
                  <Route 
                    path="/settings" 
                    element={<ProtectedRoute><PageContainer><UserSettings /></PageContainer></ProtectedRoute>}
                  />
                  
                  {/* Other existing protected routes - review later if they fit the new design */}
                  <Route 
                    path="/transfer" 
                    element={<ProtectedRoute><PageContainer title="Transfer Funds"><Transfer /></PageContainer></ProtectedRoute>} 
                  />
                   <Route 
                    path="/history" 
                    element={<ProtectedRoute><PageContainer title="History"><History /></PageContainer></ProtectedRoute>} 
                  />
                  <Route 
                    path="/recurring-transactions" 
                    element={<ProtectedRoute><PageContainer title="Recurring Transactions"><RecurringTransactions /></PageContainer></ProtectedRoute>} 
                  />
                  <Route 
                    path="/staking/register" 
                    element={<ProtectedRoute><PageContainer title="Staking Registration"><StakingRegister /></PageContainer></ProtectedRoute>} 
                  />
                  <Route 
                    path="/staking/profile/:validatorId"
                    element={<ProtectedRoute><PageContainer title="Staking Profile"><StakingProfile /></PageContainer></ProtectedRoute>} 
                  />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </CurrencyProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
