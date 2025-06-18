import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Profile } from '@/pages/Profile'
import { Settings } from '@/pages/Settings'
import { Accounts } from '@/pages/Accounts'
import { Goals } from '@/pages/Goals'
import { Transactions } from '@/pages/Transactions'
import { Categories } from '@/pages/Categories'
import { Budgets } from '@/pages/Budgets'
import { Savings } from '@/pages/Savings'
import { SavingsDetail } from '@/pages/SavingsDetail'
import { Loans } from '@/pages/Loans'
import { MainLayout, StakingLayout } from '@/layouts'
import { StakingHistory } from '@/components/staking/StakingHistory'
import { Toaster } from '@/components/ui/toaster'
import { RequireAuth } from '@/components/RequireAuth'
import './App.css'
import StakingDashboard from '@/pages/StakingDashboard'
import { StakingLogin } from '@/pages/StakingLogin'
import StakingAnalytics from '@/pages/staking/StakingAnalytics'
import { WalletConnectionTest } from '@/components/WalletConnectionTest'
import { SendETH } from '@/pages/SendETH'
import { WalletHistory } from '@/pages/WalletHistory'
import { StakingTransferHistory } from '@/pages/staking/StakingTransferHistory'

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppStateProvider>
            <Router>
            <div className="min-h-screen overflow-y-auto bg-background">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Staking authentication route */}
                <Route path="/staking/login" element={<StakingLogin />} />
                
                {/* Wallet test route - for development */}
                <Route path="/wallet-test" element={<WalletConnectionTest />} />
                
                {/* Send ETH route */}
                <Route path="/send-eth" element={<SendETH />} />
                
                {/* Wallet History route */}
                <Route path="/wallet/history" element={<WalletHistory />} />

                {/* Protected routes - Main App */}
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Navigate to="/dashboard" replace />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Dashboard />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Accounts />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Transactions />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Categories />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/budgets"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Budgets />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/budgets/create"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Budgets />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/goals"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Goals />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/savings"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Savings />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/savings/:planId"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <SavingsDetail />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/loans"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Loans />
                      </MainLayout>
                    </RequireAuth>
                  }
                />

                {/* Staking Route Group - Apply StakingLayout once */}
                <Route
                  path="/staking/*"
                  element={
                    <StakingLayout>
                      <Routes>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route
                          path="dashboard"
                          element={
                            <RequireAuth>
                              <StakingDashboard />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="history"
                          element={
                            <RequireAuth>
                              <StakingHistory />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="analytics"
                          element={
                            <RequireAuth>
                              <StakingAnalytics />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="transfer-history"
                          element={
                            <RequireAuth>
                              <StakingTransferHistory />
                            </RequireAuth>
                          }
                        />
                      </Routes>
                    </StakingLayout>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Profile />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Settings />
                      </MainLayout>
                    </RequireAuth>
                  }
                />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>

              <Toaster />
            </div>
          </Router>
        </AppStateProvider>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
