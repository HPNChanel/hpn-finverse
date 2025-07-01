import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calculator, TrendingDown, Calendar, DollarSign, Percent } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { LoanCalculationRequest, AmortizationType, RepaymentFrequency } from '@/types/loan'
import { useLoanCalculation } from '@/hooks/useLoan'
import { useDebounce } from '@/hooks/useDebounce'

export function LoanSimulator() {
  const [simulationData, setSimulationData] = useState<LoanCalculationRequest>({
    principal_amount: 50000,
    interest_rate: 8.5,
    loan_term_months: 60,
    amortization_type: AmortizationType.REDUCING_BALANCE,
    repayment_frequency: RepaymentFrequency.MONTHLY
  })

  const [activeTab, setActiveTab] = useState('calculator')
  
  // Debounce the simulation data to prevent excessive API calls during typing
  const debouncedSimulationData = useDebounce(simulationData, 300)
  
  const { data: calculation, refetch, isLoading } = useLoanCalculation(debouncedSimulationData)

  // Only trigger refetch when debounced data changes and data is valid
  useEffect(() => {
    // Only make API call if we have valid input values
    const isValidData = 
      debouncedSimulationData.principal_amount > 0 &&
      debouncedSimulationData.interest_rate > 0 &&
      debouncedSimulationData.loan_term_months > 0;
    
    if (isValidData) {
      refetch()
    }
  }, [debouncedSimulationData, refetch])

  const handleInputChange = useCallback((field: keyof LoanCalculationRequest, value: string | number | AmortizationType | RepaymentFrequency) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }, [])

  const formatPercentage = useCallback((rate: number) => {
    return `${rate.toFixed(2)}%`
  }, [])

  // Check if current input data is valid for calculations
  const isValidInput = useMemo(() => {
    return simulationData.principal_amount > 0 &&
           simulationData.interest_rate >= 0 &&
           simulationData.loan_term_months > 0;
  }, [simulationData]);

  // Generate synthetic chart data based on calculation results
  const chartData = useMemo(() => {
    if (!calculation) return []
    
    const { emi_amount, total_payment, total_interest } = calculation
    const principal = total_payment - total_interest
    const monthlyInterestRate = (debouncedSimulationData.interest_rate / 100) / 12
    
    interface ScheduleItem {
      payment: number
      principalPayment: number
      interestPayment: number
      remainingBalance: number
      cumulativePrincipal: number
      cumulativeInterest: number
    }
    
    const schedule: ScheduleItem[] = []
    let remainingBalance = principal
    
    for (let i = 1; i <= calculation.payment_count; i++) {
      const interestPayment = remainingBalance * monthlyInterestRate
      const principalPayment = Math.min(emi_amount - interestPayment, remainingBalance)
      remainingBalance = Math.max(0, remainingBalance - principalPayment)
      
      schedule.push({
        payment: i,
        principalPayment: principalPayment,
        interestPayment: interestPayment,
        remainingBalance: remainingBalance,
        cumulativePrincipal: principal - remainingBalance,
        cumulativeInterest: schedule.reduce((sum, p) => sum + p.interestPayment, 0) + interestPayment
      })
      
      if (remainingBalance <= 0) break
    }
    
    return schedule
  }, [calculation, debouncedSimulationData.interest_rate])

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
                      min="1"
                      max="10000000"
                      value={simulationData.principal_amount}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 0) {
                          handleInputChange('principal_amount', value);
                        }
                      }}
                      placeholder="50,000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest">Annual Interest Rate (%)</Label>
                    <Input
                      id="interest"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={simulationData.interest_rate}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 0 && value <= 100) {
                          handleInputChange('interest_rate', value);
                        }
                      }}
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
                      min="1"
                      max="360"
                      value={simulationData.loan_term_months}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 1 && value <= 360) {
                          handleInputChange('loan_term_months', value);
                        }
                      }}
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
                  {isLoading && (
                    <span className="inline-flex items-center ml-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
                      Calculating...
                    </span>
                  )}
                  {!isValidInput && (
                    <span className="inline-flex items-center ml-2 text-sm text-orange-600">
                      ⚠️ Enter valid values to see calculations
                    </span>
                  )}
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
                          {formatCurrency(calculation.emi_amount || calculation.monthly_payment || 0)}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          Monthly Payment (EMI)
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(calculation.total_payment || 0)}
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
                        <span className="font-semibold">{formatCurrency(simulationData.principal_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Total Interest
                        </span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(calculation.total_interest || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Loan Term
                        </span>
                        <span className="font-semibold">
                          {simulationData.loan_term_months} months ({Math.round(simulationData.loan_term_months / 12)} years)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Effective Interest Rate
                        </span>
                        <span className="font-semibold">
                          {formatPercentage(calculation.effective_interest_rate || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Interest vs Principal Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Principal ({((simulationData.principal_amount / calculation.total_payment) * 100).toFixed(1)}%)</span>
                        <span>Interest ({((calculation.total_interest / calculation.total_payment) * 100).toFixed(1)}%)</span>
                      </div>
                      <Progress 
                        value={(simulationData.principal_amount / calculation.total_payment) * 100} 
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
              {chartData.length > 0 ? (
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
                      {chartData.slice(0, 12).map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center font-medium">
                            {payment.payment}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calculation?.emi_amount || calculation?.monthly_payment || 0)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatCurrency(payment.principalPayment)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatCurrency(payment.interestPayment)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.remainingBalance)}
                          </TableCell>
                          <TableCell className="text-center">
                            {new Date(Date.now() + (payment.payment - 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {chartData.length > 12 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Showing first 12 payments of {chartData.length} total payments
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