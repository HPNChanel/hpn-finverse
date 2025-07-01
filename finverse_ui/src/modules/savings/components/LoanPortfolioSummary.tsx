import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'
import { LoanPortfolioResponse } from '@/types/loan'

interface LoanPortfolioSummaryProps {
  portfolio: LoanPortfolioResponse
}

export function LoanPortfolioSummary({ portfolio }: LoanPortfolioSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`
  }

  // Prepare chart data
  const loanTypeData = portfolio.loan_breakdown?.map(breakdown => ({
    name: breakdown.loan_type.replace('_', ' ').toUpperCase(),
    value: breakdown.total_outstanding,
    count: breakdown.count,
    percentage: (breakdown.total_outstanding / portfolio.total_outstanding) * 100
  })) || []

  const monthlyPaymentData = portfolio.upcoming_payments?.slice(0, 6).map(payment => ({
    month: new Date(payment.due_date).toLocaleDateString('en-US', { month: 'short' }),
    amount: payment.amount,
    principal: payment.principal_component,
    interest: payment.interest_component
  })) || []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const getHealthScore = () => {
    const dtiRatio = portfolio.debt_to_income_ratio || 0
    const paymentHistory = portfolio.payment_performance?.on_time_percentage || 100
    
    let score = 100
    
    // Penalize high DTI ratio
    if (dtiRatio > 40) score -= 30
    else if (dtiRatio > 30) score -= 15
    else if (dtiRatio > 20) score -= 5
    
    // Penalize poor payment history
    if (paymentHistory < 90) score -= 20
    else if (paymentHistory < 95) score -= 10
    else if (paymentHistory < 98) score -= 5
    
    return Math.max(score, 0)
  }

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' }
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' }
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950' }
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' }
  }

  const healthScore = getHealthScore()
  const healthStatus = getHealthStatus(healthScore)

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <Card className={healthStatus.bg}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {healthScore >= 80 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Loan Portfolio Health
            </span>
            <Badge variant="outline" className={`${healthStatus.color} border-current`}>
              {healthStatus.label}
            </Badge>
          </CardTitle>
          <CardDescription>
            Overall assessment of your loan portfolio performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-3xl font-bold ${healthStatus.color}`}>
                {healthScore}/100
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Health Score
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {formatPercentage(portfolio.debt_to_income_ratio || 0)}
              </div>
              <p className="text-sm text-muted-foreground">
                Debt-to-Income Ratio
              </p>
            </div>
          </div>
          <Progress value={healthScore} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0</span>
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
            <span>100</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolio.total_outstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {portfolio.total_loans} loans
            </p>
            <div className="mt-2">
              <Progress 
                value={(portfolio.total_principal - portfolio.total_outstanding) / portfolio.total_principal * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((portfolio.total_principal - portfolio.total_outstanding) / portfolio.total_principal * 100).toFixed(1)}% paid off
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Commitment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolio.total_monthly_payment)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage((portfolio.total_monthly_payment / (portfolio.monthly_income || 1)) * 100)} of income
            </p>
            <div className="flex items-center mt-2">
              {portfolio.next_payment_amount && (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">
                    Next: {formatCurrency(portfolio.next_payment_amount)}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interest Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(portfolio.potential_savings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Potential savings with optimizations
            </p>
            <div className="flex items-center mt-2">
              <div className="text-xs">
                Avg Rate: {formatPercentage(portfolio.average_interest_rate)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio.payment_performance?.on_time_percentage?.toFixed(1) || '100.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              On-time payment rate
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                {portfolio.payment_performance?.total_payments || 0} payments
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Portfolio Breakdown</CardTitle>
            <CardDescription>
              Distribution of outstanding balances by loan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loanTypeData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={loanTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {loanTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {loanTypeData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.count}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No loan data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>
              Your payment schedule for the next 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyPaymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyPaymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="principal" stackId="a" fill="#3b82f6" name="Principal" />
                  <Bar dataKey="interest" stackId="a" fill="#f59e0b" name="Interest" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming payments
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {portfolio.recommendations && portfolio.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Smart Recommendations</CardTitle>
            <CardDescription>
              Personalized suggestions to optimize your loan portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      {recommendation.priority === 'high' ? (
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {recommendation.title}
                      </h4>
                      <Badge 
                        variant={recommendation.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {recommendation.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      {recommendation.description}
                    </p>
                    {recommendation.potential_savings && (
                      <div className="text-sm font-medium text-green-700 dark:text-green-300">
                        💰 Potential savings: {formatCurrency(recommendation.potential_savings)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 