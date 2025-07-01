import { Calculator, TrendingUp, AlertTriangle, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useLoanPortfolio, useLoans } from '@/hooks/useLoan'
import { LoanStatus } from '@/types/loan'

export function LoanOverview() {
  const navigate = useNavigate()
  const { data: portfolio, isLoading: portfolioLoading } = useLoanPortfolio()
  const { data: loans, isLoading: loansLoading } = useLoans({ status: LoanStatus.ACTIVE })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getNextPaymentDue = () => {
    if (!loans || loans.length === 0) return null
    
    const upcomingPayments = loans
      .filter(loan => loan.next_payment_date)
      .sort((a, b) => new Date(a.next_payment_date!).getTime() - new Date(b.next_payment_date!).getTime())
    
    return upcomingPayments[0] || null
  }

  const nextPayment = getNextPaymentDue()
  
  if (portfolioLoading || loansLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!portfolio && (!loans || loans.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Loans Overview
          </CardTitle>
          <CardDescription>Your loan portfolio summary</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Loans Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by exploring loan options or using our loan calculator
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/loans')} variant="outline">
              View Loans
            </Button>
            <Button onClick={() => navigate('/loans')}>
              Apply for Loan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Loans Overview
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/loans')}>
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </CardTitle>
        <CardDescription>Your loan portfolio summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Summary */}
        {portfolio && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(portfolio.total_remaining)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Borrowed</p>
              <p className="text-xl font-bold">
                {formatCurrency(portfolio.total_borrowed)}
              </p>
            </div>
          </div>
        )}

        {/* Active Loans Count */}
        {loans && loans.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Active Loans</span>
            </div>
            <Badge variant="secondary" className="text-sm">
              {loans.length} {loans.length === 1 ? 'loan' : 'loans'}
            </Badge>
          </div>
        )}

        {/* Next Payment Due */}
        {nextPayment && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Next Payment Due</h4>
              <Badge variant="outline" className="text-xs">
                {nextPayment.loan_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(nextPayment.emi)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="text-sm">
                  {new Date(nextPayment.next_payment_date!).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Health Score */}
        {portfolio && portfolio.average_interest_rate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Interest Rate</span>
              <span className="text-sm">
                {portfolio.average_interest_rate.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              {portfolio.average_interest_rate > 15 ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : portfolio.average_interest_rate > 8 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {portfolio.average_interest_rate > 15 
                  ? 'High interest rates - Consider refinancing'
                  : portfolio.average_interest_rate > 8 
                  ? 'Moderate interest rates'
                  : 'Good interest rates'
                }
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate('/loans')}
          >
            Manage Loans
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => navigate('/loans')}
          >
            New Application
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 