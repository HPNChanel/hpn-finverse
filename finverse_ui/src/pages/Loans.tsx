import { useState } from 'react'
import { Plus, Calculator, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoanSimulator } from '@/components/loans/LoanSimulator'
import { LoanList } from '@/components/loans/LoanList'
import { LoanApplicationForm } from '@/components/loans/LoanApplicationForm'
import { LoanInsights } from '@/components/loans/LoanInsights'
import { useLoanPortfolio } from '@/hooks/useLoan'

export function Loans() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showSimulator, setShowSimulator] = useState(false)
  const [showApplication, setShowApplication] = useState(false)
  
  const { data: portfolio, isLoading } = useLoanPortfolio()

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Loan Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Simulate, apply, and manage your loans with smart financial tools
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Loan Calculator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Loan Simulator</DialogTitle>
                <DialogDescription>
                  Calculate loan payments and compare different loan options
                </DialogDescription>
              </DialogHeader>
              <LoanSimulator />
            </DialogContent>
          </Dialog>

          <Dialog open={showApplication} onOpenChange={setShowApplication}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Apply for Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Loan Application</DialogTitle>
                <DialogDescription>
                  Apply for a new loan with our streamlined application process
                </DialogDescription>
              </DialogHeader>
              <LoanApplicationForm 
                onSuccess={() => setShowApplication(false)}
                onCancel={() => setShowApplication(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loan Insights */}
      <LoanInsights />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio?.total_borrowed?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {portfolio?.total_loans || 0} loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio?.total_remaining?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total remaining debt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interest Paid</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio?.total_interest_paid?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total interest paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio?.average_interest_rate?.toFixed(2) || '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted average rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active-loans">Active Loans</TabsTrigger>
          <TabsTrigger value="history">Loan History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loan Types Card */}
            <Card>
              <CardHeader>
                <CardTitle>Available Loan Types</CardTitle>
                <CardDescription>
                  Explore different loan options tailored to your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'Personal', rate: '8.5%', badge: 'Popular' },
                    { type: 'Mortgage', rate: '6.2%', badge: 'Low Rate' },
                    { type: 'Auto', rate: '7.1%', badge: 'Fast Approval' },
                    { type: 'Education', rate: '5.8%', badge: 'Flexible' },
                    { type: 'Business', rate: '9.2%', badge: 'Growth' },
                    { type: 'Emergency', rate: '12.5%', badge: 'Quick Cash' }
                  ].map((loan) => (
                    <div key={loan.type} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{loan.type}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {loan.badge}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        From {loan.rate}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest loan-related activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <p className="text-sm font-medium">Loan Portfolio Overview</p>
                        <p className="text-xs text-muted-foreground">Active: {portfolio?.active_loans || 0}</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <p className="text-sm font-medium">Completed Loans</p>
                        <p className="text-xs text-muted-foreground">Total: {portfolio?.completed_loans || 0}</p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <p className="text-sm font-medium">Simulated Loans</p>
                        <p className="text-xs text-muted-foreground">Count: {portfolio?.simulated_loans || 0}</p>
                      </div>
                      <Badge variant="outline">Simulation</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active-loans" className="space-y-6">
          <LoanList status="active" />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <LoanList status="completed" />
        </TabsContent>
      </Tabs>
    </div>
  )
} 