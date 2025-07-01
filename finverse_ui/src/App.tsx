import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'

// Shared Module
import { Home, Profile, Settings, MainLayout, RequireAuth } from '@/modules/shared'
import { PersonalFinanceHub, DefiStakingHub, SavingsLoansHub, AnalyticsHub } from '@/modules/shared/hubs'

// Analytics Module
import { Dashboard, Analytics } from '@/modules/analytics'

// Auth Module
import { Login, Register } from '@/modules/auth'

// Personal Finance Module
import { Accounts, Goals, Transactions, Categories, Budgets } from '@/modules/personalFinance'

// Savings Module
import { Savings, SavingsDetail, Loans } from '@/modules/savings'

// DeFi Module - Direct imports until we fix component exports
import StakingDashboard from '@/modules/defi/pages/StakingDashboard'
import { StakingLogin } from '@/modules/defi/pages/StakingLogin'
import StakingAnalytics from '@/modules/defi/pages/StakingAnalyticsSubpage'
import { WalletConnectionTest } from '@/modules/defi/components/WalletConnectionTest'
import { SendETH } from '@/modules/defi/pages/SendETH'
import { WalletHistory } from '@/modules/defi/pages/WalletHistory'
import { StakingTransferHistory } from '@/modules/defi/pages/StakingTransferHistory'
import { StakingLayout } from '@/modules/defi/components/StakingLayout'
import { StakingHistory } from '@/modules/defi/components/StakingHistory'

import { Toaster } from '@/components/ui/toaster'
import './App.css'

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
                        <Home />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/home"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Home />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                {/* Hub routing - Updated to match navigation constants */}
                <Route
                  path="/hubs/personal-finance"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <PersonalFinanceHub />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/hubs/defi-staking"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <DefiStakingHub />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/hubs/savings-loans"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <SavingsLoansHub />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/hubs/analytics"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <AnalyticsHub />
                      </MainLayout>
                    </RequireAuth>
                  }
                />
                {/* Legacy hub routes - redirect to new paths */}
                <Route path="/hub/personal-finance" element={<Navigate to="/hubs/personal-finance" replace />} />
                <Route path="/hub/defi-staking" element={<Navigate to="/hubs/defi-staking" replace />} />
                <Route path="/hub/savings-loans" element={<Navigate to="/hubs/savings-loans" replace />} />
                <Route path="/hub/analytics" element={<Navigate to="/hubs/analytics" replace />} />
                <Route
                  path="/hub/:hubId"
                  element={<Navigate to="/" replace />}
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
                <Route
                  path="/analytics"
                  element={
                    <RequireAuth>
                      <MainLayout>
                        <Analytics />
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
