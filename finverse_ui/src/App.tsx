import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppStateProvider } from '@/contexts/AppStateContext'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'

// Shared Module - Layouts and Components
import { 
  SmartHub, 
  Profile, 
  Settings, 
  PublicLayout, 
  AppLayout, 
  LandingRedirect,
  ProtectedRedirect 
} from '@/modules/shared'
import { PersonalFinanceHub, DefiStakingHub, SavingsLoansHub, AnalyticsHub } from '@/modules/shared/hubs'

// Analytics Module
import { Dashboard, Analytics } from '@/modules/analytics'

// Auth Module
import { Login, Register } from '@/modules/auth'

// Landing Module
import { LandingPage } from '@/modules/landing'

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

import { StakingHistory } from '@/modules/defi/components/StakingHistory'

import { Toaster } from '@/components/ui/toaster'
import { FloatingChatButton } from '@/components/chat'
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
                  
                  {/* ====== PUBLIC ROUTES (No Auth Required) ====== */}
                  
                  {/* Landing Page - Redirect to /hub if already authenticated */}
                  <Route 
                    path="/" 
                    element={
                      <LandingRedirect>
                        <PublicLayout>
                          <LandingPage />
                        </PublicLayout>
                      </LandingRedirect>
                    } 
                  />

                  {/* Authentication Routes */}
                  <Route 
                    path="/login" 
                    element={
                      <LandingRedirect>
                        <PublicLayout>
                          <Login />
                        </PublicLayout>
                      </LandingRedirect>
                    } 
                  />
                  
                  <Route 
                    path="/register" 
                    element={
                      <LandingRedirect>
                        <PublicLayout>
                          <Register />
                        </PublicLayout>
                      </LandingRedirect>
                    } 
                  />

                  {/* ====== PRIVATE ROUTES (Auth Required) ====== */}
                  
                  {/* SmartHub - New Main Home for Authenticated Users */}
                  <Route
                    path="/hub"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <SmartHub />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* Feature Hubs */}
                  <Route
                    path="/hubs/personal-finance"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <PersonalFinanceHub />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/hubs/defi-staking"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <DefiStakingHub />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/hubs/savings-loans"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <SavingsLoansHub />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/hubs/analytics"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <AnalyticsHub />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* Analytics & Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Dashboard />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Analytics />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* Personal Finance Routes */}
                  <Route
                    path="/accounts"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Accounts />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Transactions />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/categories"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Categories />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/budgets"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Budgets />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/goals"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Goals />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* Savings & Loans Routes */}
                  <Route
                    path="/savings"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Savings />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/savings/:id"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <SavingsDetail />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/loans"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Loans />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* DeFi & Staking Routes */}
                  <Route
                    path="/staking"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <StakingDashboard />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/staking/login"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <StakingLogin />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/staking/analytics"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <StakingAnalytics />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/staking/history"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <StakingHistory />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/staking/transfer-history"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <StakingTransferHistory />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/send-eth"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <SendETH />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/wallet/history"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <WalletHistory />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* User Profile & Settings */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Profile />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <Settings />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* Development & Testing Routes (Optional) */}
                  <Route
                    path="/wallet-test"
                    element={
                      <ProtectedRedirect>
                        <AppLayout>
                          <WalletConnectionTest />
                        </AppLayout>
                      </ProtectedRedirect>
                    }
                  />

                  {/* ====== LEGACY REDIRECTS ====== */}
                  
                  {/* Redirect old paths to new structure */}
                  <Route path="/app" element={<Navigate to="/hub" replace />} />
                  <Route path="/home" element={<Navigate to="/hub" replace />} />
                  <Route path="/hub/personal-finance" element={<Navigate to="/hubs/personal-finance" replace />} />
                  <Route path="/hub/defi-staking" element={<Navigate to="/hubs/defi-staking" replace />} />
                  <Route path="/hub/savings-loans" element={<Navigate to="/hubs/savings-loans" replace />} />
                  <Route path="/hub/analytics" element={<Navigate to="/hubs/analytics" replace />} />
                  <Route path="/hub/:hubId" element={<Navigate to="/hub" replace />} />

                  {/* ====== FALLBACK ROUTES ====== */}
                  
                  {/* Catch-all: redirect unknown routes to appropriate home */}
                  <Route path="*" element={<Navigate to="/hub" replace />} />

                </Routes>
                
                {/* Global Toast Notifications */}
                <Toaster />
                
                {/* AI Chat Assistant - Available globally for authenticated users */}
                <FloatingChatButton />
              </div>
            </Router>
          </AppStateProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
