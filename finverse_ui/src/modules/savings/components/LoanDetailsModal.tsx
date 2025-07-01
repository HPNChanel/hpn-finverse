import { useState } from 'react'
import { Calendar, DollarSign, TrendingUp, FileText, Download, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { LoanResponse, LoanStatus, LoanType } from '@/types/loan'
import { useLoanPayments, useLoanSchedule } from '@/hooks/useLoan'

interface LoanDetailsModalProps {
  loan: LoanResponse
}

export function LoanDetailsModal({ loan }: LoanDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  const { data: payments, isLoading: paymentsLoading } = useLoanPayments(loan.id)
  const { data: schedule, isLoading: scheduleLoading } = useLoanSchedule(loan.id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: LoanStatus) => {
    const statusConfig = {
      [LoanStatus.ACTIVE]: { variant: 'default' as const, label: 'Active' },
      [LoanStatus.PENDING]: { variant: 'secondary' as const, label: 'Pending' },
      [LoanStatus.APPROVED]: { variant: 'default' as const, label: 'Approved' },
      [LoanStatus.REJECTED]: { variant: 'destructive' as const, label: 'Rejected' },
      [LoanStatus.COMPLETED]: { variant: 'outline' as const, label: 'Completed' },
      [LoanStatus.DEFAULTED]: { variant: 'destructive' as const, label: 'Defaulted' },
      [LoanStatus.CLOSED]: { variant: 'secondary' as const, label: 'Closed' }
    }
    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const calculateProgress = () => {
    if (loan.principal === 0) return 0
    const paidAmount = loan.principal - (loan.outstanding_balance || loan.principal)
    return (paidAmount / loan.principal) * 100
  }

  const calculateTotalInterest = () => {
    return (loan.emi * loan.term_months) - loan.principal
  }

  // Prepare chart data
  const paymentHistory = payments?.map((payment, index) => ({
    payment: index + 1,
    date: payment.payment_date,
    amount: payment.amount,
    principal: payment.principal_component || 0,
    interest: payment.interest_component || 0,
    balance: payment.remaining_balance || 0
  })) || []

  const scheduleData = schedule?.slice(0, 12).map((item, index) => ({
    month: index + 1,
    emi: item.emi_amount,
    principal: item.principal_payment,
    interest: item.interest_payment,
    balance: item.remaining_balance
  })) || []

  return (
    <div className="space-y-6">
      {/* Loan Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">
              {loan.loan_type.replace('_', ' ').toUpperCase()} Loan
            </h2>
            {getStatusBadge(loan.status)}
          </div>
          <p className="text-muted-foreground">
            Loan ID: #{loan.id.toString().slice(-8).toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Statement
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Agreement
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Principal Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(loan.principal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(loan.outstanding_balance || loan.principal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly EMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(loan.emi)}
            </div>
            <p className="text-xs text-muted-foreground">
              {loan.repayment_frequency.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loan.annual_interest_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {loan.interest_type.replace('_', ' ').toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Loan Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Repayment Progress</span>
              <span>{calculateProgress().toFixed(1)}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Amount Paid</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(loan.principal - (loan.outstanding_balance || loan.principal))}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-semibold text-orange-600">
                {formatCurrency(loan.outstanding_balance || loan.principal)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Interest</p>
              <p className="font-semibold">
                {formatCurrency(calculateTotalInterest())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Type</span>
                  <span className="font-medium">
                    {loan.loan_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{formatDate(loan.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">{formatDate(loan.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term</span>
                  <span className="font-medium">{loan.term_months} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amortization</span>
                  <span className="font-medium">
                    {loan.amortization_type.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Principal Amount</span>
                  <span className="font-medium">{formatCurrency(loan.principal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Interest</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(calculateTotalInterest())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Payable</span>
                  <span className="font-medium">
                    {formatCurrency(loan.emi * loan.term_months)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Payment</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(loan.emi)}
                  </span>
                </div>
                {loan.next_payment_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">
                      {formatDate(loan.next_payment_date)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {loan.purpose && (
            <Card>
              <CardHeader>
                <CardTitle>Loan Purpose</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{loan.purpose}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Amortization Schedule</CardTitle>
              <CardDescription>
                Payment breakdown for the next 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : schedule && schedule.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Payment #</TableHead>
                        <TableHead className="text-right">EMI Amount</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-center">Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.slice(0, 12).map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center font-medium">
                            {payment.payment_number}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payment.emi_amount)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatCurrency(payment.principal_payment)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatCurrency(payment.interest_payment)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.remaining_balance)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatDate(payment.due_date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {schedule.length > 12 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Showing first 12 payments of {schedule.length} total payments
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No schedule data available
                </div>
              )}
            </CardContent>
          </Card>

          {scheduleData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Breakdown Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scheduleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="principal" stackId="a" fill="#3b82f6" name="Principal" />
                    <Bar dataKey="interest" stackId="a" fill="#f59e0b" name="Interest" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Record of all payments made on this loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatDate(payment.payment_date)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatCurrency(payment.principal_component || 0)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatCurrency(payment.interest_component || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default">Completed</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No payment history available
                </div>
              )}
            </CardContent>
          </Card>

          {paymentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={paymentHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="payment" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Remaining Balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Interest Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate Type</span>
                    <span className="font-medium">
                      {loan.interest_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Rate</span>
                    <span className="font-medium">{loan.annual_interest_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Interest</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(calculateTotalInterest())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Ratio</span>
                    <span className="font-medium">
                      {((calculateTotalInterest() / (loan.emi * loan.term_months)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payments Made</span>
                    <span className="font-medium">{payments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">On-time Rate</span>
                    <span className="font-medium text-green-600">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prepayments</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Remaining</span>
                    <span className="font-medium">
                      {Math.max(0, loan.term_months - (payments?.length || 0))} months
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Optimization Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                        Extra Payment Impact
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                        Adding $100 to your monthly payment could save you approximately $2,500 in interest 
                        and reduce your loan term by 8 months.
                      </p>
                      <Button size="sm" variant="outline" className="border-green-200 text-green-700">
                        Calculate Savings
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Refinancing Option
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                        Current market rates for {loan.loan_type.replace('_', ' ').toLowerCase()} loans 
                        are around 7.2%. You might save money by refinancing.
                      </p>
                      <Button size="sm" variant="outline" className="border-blue-200 text-blue-700">
                        Check Rates
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 