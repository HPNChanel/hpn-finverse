import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/contexts/ThemeContext'
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
import { Staking } from '@/pages/Staking'
import { MainLayout } from '@/layouts/MainLayout'
import { StakingLayout } from '@/layouts/StakingLayout'
import { StakingHistory } from '@/components/staking/StakingHistory'
import { GlobalStakingDashboard } from '@/components/staking/GlobalStakingDashboard'
import { Toaster } from '@/components/ui/toaster'
import { RequireAuth } from '@/components/RequireAuth'
import './App.css'
import { StakingDashboard } from '@/pages/StakingDashboard'
import { StakingLogin } from '@/pages/StakingLogin'
import { StakingAnalytics } from '@/pages/StakingAnalytics'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Staking authentication route */}
              <Route path="/staking/login" element={<StakingLogin />} />

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

              {/* Staking Route Group - Uses StakingLayout */}
              <Route
                path="/staking"
                element={
                  <StakingLayout>
                    <Navigate to="/staking/dashboard" replace />
                  </StakingLayout>
                }
              />
              <Route
                path="/staking/dashboard"
                element={
                  <RequireAuth>
                    <StakingLayout>
                      <StakingDashboard />
                    </StakingLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/staking/history"
                element={
                  <RequireAuth>
                    <StakingLayout>
                      <StakingHistory />
                    </StakingLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/staking/analytics"
                element={
                  <RequireAuth>
                    <StakingLayout>
                      <StakingAnalytics />
                    </StakingLayout>
                  </RequireAuth>
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
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
