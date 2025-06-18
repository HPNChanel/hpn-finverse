import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Calendar, DollarSign, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { LoanCalculationRequest, LoanType, InterestType, AmortizationType, RepaymentFrequency } from '@/types/loan'
import { useLoanCalculation } from '@/hooks/useLoan'

export function LoanSimulator() {
  const [simulationData, setSimulationData] = useState<LoanCalculationRequest>({
    principal_amount: 50000,
    interest_rate: 8.5,
    loan_term_months: 60,
    amortization_type: AmortizationType.REDUCING_BALANCE,
    repayment_frequency: RepaymentFrequency.MONTHLY
  })

  const [activeTab, setActiveTab] = useState('calculator')
  
  const { data: calculation, refetch, isLoading } = useLoanCalculation(simulationData)

  useEffect(() => {
    refetch()
  }, [simulationData, refetch])

  const handleInputChange = (field: keyof LoanCalculationRequest, value: any) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`
  }

  // Calculate chart data for visualization
  const chartData = calculation?.amortization_schedule?.map((payment, index) => ({
    payment: index + 1,
    principalPayment: payment.principal_payment,
    interestPayment: payment.interest_payment,
    remainingBalance: payment.remaining_balance,
    cumulativePrincipal: calculation.principal - payment.remaining_balance,
    cumulativeInterest: calculation.amortization_schedule
      .slice(0, index + 1)
      .reduce((sum, p) => sum + p.interest_payment, 0)
  })) || []

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
          <TabsTrigger value="charts">Visualizations</TabsTrigger>
          <TabsTrigger value="comparison">Compare Options</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Loan Parameters
                </CardTitle>
                <CardDescription>
                  Adjust the loan parameters to see how they affect your payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal">Loan Amount</Label>
                    <Input
                      id="principal"
                      type="number"
                      value={simulationData.principal_amount}
                      onChange={(e) => handleInputChange('principal_amount', Number(e.target.value))}
                      placeholder="50,000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest">Annual Interest Rate (%)</Label>
                    <Input
                      id="interest"
                      type="number"
                      step="0.1"
                      value={simulationData.interest_rate}
                      onChange={(e) => handleInputChange('interest_rate', Number(e.target.value))}
                      placeholder="8.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Loan Term (Months)</Label>
                    <Input
                      id="term"
                      type="number"
                      value={simulationData.loan_term_months}
                      onChange={(e) => handleInputChange('loan_term_months', Number(e.target.value))}
                      placeholder="60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amortization</Label>
                    <Select 
                      value={simulationData.amortization_type} 
                      onValueChange={(value) => handleInputChange('amortization_type', value as AmortizationType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select amortization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AmortizationType.REDUCING_BALANCE}>Reducing Balance</SelectItem>
                        <SelectItem value={AmortizationType.FLAT_RATE}>Flat Rate</SelectItem>
                        <SelectItem value={AmortizationType.BULLET_PAYMENT}>Bullet Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Frequency</Label>
                  <Select 
                    value={simulationData.repayment_frequency} 
                    onValueChange={(value) => handleInputChange('repayment_frequency', value as RepaymentFrequency)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RepaymentFrequency.WEEKLY}>Weekly</SelectItem>
                      <SelectItem value={RepaymentFrequency.BIWEEKLY}>Bi-weekly</SelectItem>
                      <SelectItem value={RepaymentFrequency.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={RepaymentFrequency.QUARTERLY}>Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Calculation Results
                </CardTitle>
                <CardDescription>
                  Your loan payment breakdown and totals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : calculation ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(calculation.emi)}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          Monthly Payment (EMI)
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(calculation.total_amount)}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Total Amount Payable
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Principal Amount
                        </span>
                        <span className="font-semibold">{formatCurrency(calculation.principal)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Total Interest
                        </span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(calculation.total_interest)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Loan Term
                        </span>
                        <span className="font-semibold">
                          {calculation.term_months} months ({Math.round(calculation.term_months / 12)} years)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Effective Interest Rate
                        </span>
                        <span className="font-semibold">
                          {formatPercentage(calculation.effective_interest_rate)}
                        </span>
                      </div>
                    </div>

                    {/* Interest vs Principal Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Principal ({((calculation.principal / calculation.total_amount) * 100).toFixed(1)}%)</span>
                        <span>Interest ({((calculation.total_interest / calculation.total_amount) * 100).toFixed(1)}%)</span>
                      </div>
                      <Progress 
                        value={(calculation.principal / calculation.total_amount) * 100} 
                        className="h-3"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Enter loan parameters to see calculation results
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Amortization Schedule</CardTitle>
              <CardDescription>
                Detailed payment breakdown for each installment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculation?.amortization_schedule ? (
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
                      {calculation.amortization_schedule.slice(0, 12).map((payment, index) => (
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
                            {new Date(payment.due_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {calculation.amortization_schedule.length > 12 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Showing first 12 payments of {calculation.amortization_schedule.length} total payments
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Generate calculation to see payment schedule
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {chartData.length > 0 ? (
            <>
              {/* Payment Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Breakdown Over Time</CardTitle>
                  <CardDescription>
                    Principal vs Interest payments throughout the loan term
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.slice(0, 24)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="payment" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="principalPayment" stackId="a" fill="#3b82f6" name="Principal" />
                      <Bar dataKey="interestPayment" stackId="a" fill="#f59e0b" name="Interest" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Balance Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Loan Balance Over Time</CardTitle>
                  <CardDescription>
                    See how your loan balance decreases with each payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="payment" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="remainingBalance" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Remaining Balance"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cumulative Payments */}
              <Card>
                <CardHeader>
                  <CardTitle>Cumulative Payments</CardTitle>
                  <CardDescription>
                    Track total principal and interest paid over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="payment" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativePrincipal" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Total Principal Paid"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativeInterest" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Total Interest Paid"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">
                  Generate calculation to see visualizations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Comparison Tool</CardTitle>
              <CardDescription>
                Compare different loan scenarios side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Comparison tool coming soon</p>
                <p className="text-sm">
                  This feature will allow you to compare multiple loan options simultaneously
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 