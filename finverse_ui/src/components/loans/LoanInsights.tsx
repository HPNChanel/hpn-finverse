import { TrendingUp, Lightbulb, AlertTriangle, CheckCircle, Calculator } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLoanPortfolio, useLoans } from '@/hooks/useLoan'
import { LoanStatus, LoanType } from '@/types/loan'

interface LoanInsight {
  id: string
  title: string
  description: string
  type: 'opportunity' | 'warning' | 'info' | 'success'
  impact: 'high' | 'medium' | 'low'
  savings?: number
  action?: string
  actionUrl?: string
}

export function LoanInsights() {
  const { data: portfolio } = useLoanPortfolio()
  const { data: loans } = useLoans({ status: LoanStatus.ACTIVE })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const generateInsights = (): LoanInsight[] => {
    const insights: LoanInsight[] = []

    if (!portfolio || !loans) return insights

    // High interest rate warning
    const highInterestLoans = loans.filter(loan => loan.annual_interest_rate > 12)
    if (highInterestLoans.length > 0) {
      const totalHighInterest = highInterestLoans.reduce((sum, loan) => sum + (loan.outstanding_balance || loan.principal), 0)
      insights.push({
        id: 'high-interest',
        title: 'High Interest Rate Alert',
        description: `You have ${highInterestLoans.length} loan(s) with interest rates above 12%. Consider refinancing to save money.`,
        type: 'warning',
        impact: 'high',
        savings: totalHighInterest * 0.03, // Estimated 3% savings
        action: 'Explore Refinancing',
        actionUrl: '/loans'
      })
    }

    // Prepayment opportunity
    const personalLoans = loans.filter(loan => loan.loan_type === LoanType.PERSONAL)
    if (personalLoans.length > 0 && portfolio.average_interest_rate > 8) {
      const averageBalance = personalLoans.reduce((sum, loan) => sum + (loan.outstanding_balance || loan.principal), 0) / personalLoans.length
      insights.push({
        id: 'prepayment-opportunity',
        title: 'Prepayment Opportunity',
        description: 'Making extra payments on your personal loans can significantly reduce total interest paid.',
        type: 'opportunity',
        impact: 'medium',
        savings: averageBalance * 0.15, // Estimated savings
        action: 'Calculate Savings',
        actionUrl: '/loans'
      })
    }

    // Good payment history
    if (portfolio.total_loans > 0) {
      insights.push({
        id: 'good-standing',
        title: 'Excellent Payment History',
        description: 'Your consistent payment history puts you in a strong position for favorable loan terms.',
        type: 'success',
        impact: 'low',
        action: 'Apply for New Loan',
        actionUrl: '/loans'
      })
    }

    // Multiple loans consolidation
    if (loans.length >= 3) {
      const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.outstanding_balance || loan.principal), 0)
      insights.push({
        id: 'consolidation',
        title: 'Loan Consolidation Option',
        description: `Consider consolidating your ${loans.length} loans into one to simplify payments and potentially lower interest.`,
        type: 'opportunity',
        impact: 'medium',
        savings: totalOutstanding * 0.02, // Estimated 2% savings
        action: 'Learn More',
        actionUrl: '/loans'
      })
    }

    // Debt-to-income improvement
    if (portfolio.average_interest_rate < 8 && portfolio.total_loans > 0) {
      insights.push({
        id: 'good-rates',
        title: 'Great Interest Rates',
        description: 'Your average interest rate is below market average. You\'re managing your debt efficiently.',
        type: 'success',
        impact: 'low'
      })
    }

    // Emergency fund suggestion
    if (loans.some(loan => loan.loan_type === LoanType.EMERGENCY)) {
      insights.push({
        id: 'emergency-fund',
        title: 'Build Emergency Fund',
        description: 'Having an emergency loan suggests you might benefit from building an emergency savings fund.',
        type: 'info',
        impact: 'medium',
        action: 'Start Savings Plan',
        actionUrl: '/savings'
      })
    }

    return insights
  }

  const insights = generateInsights()

  const getInsightIcon = (type: LoanInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      default:
        return <Lightbulb className="h-5 w-5 text-purple-600" />
    }
  }

  const getInsightBadge = (impact: LoanInsight['impact']) => {
    const config = {
      high: { variant: 'destructive' as const, label: 'High Impact' },
      medium: { variant: 'default' as const, label: 'Medium Impact' },
      low: { variant: 'secondary' as const, label: 'Low Impact' }
    }
    const { variant, label } = config[impact]
    return <Badge variant={variant} className="text-xs">{label}</Badge>
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Loan Insights
          </CardTitle>
          <CardDescription>Personalized recommendations for your loans</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">All Good!</h3>
          <p className="text-muted-foreground">
            Your loan portfolio looks healthy. Keep up the good work!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Loan Insights
        </CardTitle>
        <CardDescription>
          Personalized recommendations to optimize your loans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getInsightIcon(insight.type)}
                <h4 className="font-medium">{insight.title}</h4>
              </div>
              {getInsightBadge(insight.impact)}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {insight.description}
            </p>

            {insight.savings && (
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  Potential savings: {formatCurrency(insight.savings)}
                </span>
              </div>
            )}

            {insight.action && (
              <Button variant="outline" size="sm" className="w-full">
                {insight.action}
              </Button>
            )}
          </div>
        ))}

        {/* Summary Stats */}
        {portfolio && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Portfolio Overview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Loans</p>
                <p className="font-medium">{portfolio.total_loans}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg. Interest</p>
                <p className="font-medium">{portfolio.average_interest_rate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Loans</p>
                <p className="font-medium">{portfolio.active_loans}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining Balance</p>
                <p className="font-medium">{formatCurrency(portfolio.total_remaining)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Savings
          </Button>
          <Button size="sm" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            Optimize Loans
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 