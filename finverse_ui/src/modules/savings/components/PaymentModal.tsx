import { useState } from 'react'
import { CreditCard, DollarSign, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoanResponse, LoanPaymentRequest, PaymentType } from '@/types/loan'
import { useMakePayment } from '@/hooks/useLoan'

interface PaymentModalProps {
  loan: LoanResponse
  onSuccess: () => void
  onCancel: () => void
}

interface PaymentFormData {
  amount: number
  payment_type: PaymentType
  notes: string
  payment_method: string
}

export function PaymentModal({ loan, onSuccess, onCancel }: PaymentModalProps) {
  const [step, setStep] = useState<'amount' | 'method' | 'confirm'>('amount')
  const makePaymentMutation = useMakePayment()

  const [formData, setFormData] = useState<PaymentFormData>({
    amount: loan.emi || loan.emi_amount || 1000,
    payment_type: PaymentType.REGULAR,
    notes: '',
    payment_method: 'card'
  })

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({
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

  const calculateImpact = () => {
    const regularPayment = loan.emi || loan.emi_amount || 1000
    const extraAmount = Math.max(0, formData.amount - regularPayment)
    const outstandingBalance = loan.outstanding_balance || loan.current_balance || loan.principal || 0
    
    return {
      extraAmount,
      newBalance: outstandingBalance - formData.amount,
      isExtraPayment: extraAmount > 0,
      balanceReduction: outstandingBalance > 0 ? (formData.amount / outstandingBalance) * 100 : 0
    }
  }

  const onSubmit = async () => {
    try {
      const paymentData: LoanPaymentRequest = {
        payment_amount: formData.amount,
        payment_date: new Date().toISOString(),
        payment_type: formData.payment_type.toString(),
        notes: formData.notes,
        is_simulated: false
      }

      await makePaymentMutation.mutateAsync({
        loanId: loan.id,
        payment: paymentData
      })
      
      onSuccess()
    } catch (error) {
      console.error('Payment failed:', error)
    }
  }

  const impact = calculateImpact()

  const renderAmountStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Amount
          </CardTitle>
          <CardDescription>
            Choose how much you want to pay towards your loan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', Number(e.target.value))}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select 
              value={formData.payment_type} 
              onValueChange={(value) => handleInputChange('payment_type', value as PaymentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentType.REGULAR}>Regular Payment</SelectItem>
                <SelectItem value={PaymentType.EXTRA}>Extra Payment</SelectItem>
                <SelectItem value={PaymentType.PREPAYMENT}>Prepayment</SelectItem>
                <SelectItem value={PaymentType.PARTIAL}>Partial Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any notes about this payment..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Amount Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Amounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleInputChange('amount', loan.emi || loan.emi_amount || 1000)}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-sm text-muted-foreground">Monthly EMI</span>
              <span className="font-semibold">{formatCurrency(loan.emi || loan.emi_amount || 1000)}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleInputChange('amount', (loan.emi || loan.emi_amount || 1000) * 2)}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-sm text-muted-foreground">Double Payment</span>
              <span className="font-semibold">{formatCurrency((loan.emi || loan.emi_amount || 1000) * 2)}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleInputChange('amount', Math.min(loan.outstanding_balance || loan.current_balance || loan.principal || 0, (loan.emi || loan.emi_amount || 1000) * 6))}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-sm text-muted-foreground">6 Months</span>
              <span className="font-semibold">
                {formatCurrency(Math.min(loan.outstanding_balance || loan.current_balance || loan.principal || 0, (loan.emi || loan.emi_amount || 1000) * 6))}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleInputChange('amount', loan.outstanding_balance || loan.current_balance || loan.principal || 0)}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-sm text-muted-foreground">Full Balance</span>
              <span className="font-semibold">
                {formatCurrency(loan.outstanding_balance || loan.current_balance || loan.principal || 0)}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Impact */}
      <Card className={impact.isExtraPayment ? 'bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Payment Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="font-semibold">
                {formatCurrency(loan.outstanding_balance || loan.current_balance || loan.principal || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">After Payment</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(Math.max(0, impact.newBalance))}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Balance Reduction</span>
              <span>{impact.balanceReduction.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(100, impact.balanceReduction)} className="h-2" />
          </div>

          {impact.isExtraPayment && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span>Extra payment of {formatCurrency(impact.extraAmount)} will reduce interest!</span>
            </div>
          )}

          {impact.newBalance <= 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <span>This payment will completely pay off your loan!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderMethodStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.payment_method === 'card' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handleInputChange('payment_method', 'card')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">Pay instantly with your card</p>
                  </div>
                </div>
                <Badge variant="outline">Instant</Badge>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.payment_method === 'bank' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handleInputChange('payment_method', 'bank')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">Direct transfer from your bank account</p>
                  </div>
                </div>
                <Badge variant="outline">1-2 days</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Confirm Payment
          </CardTitle>
          <CardDescription>
            Please review your payment details before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Payment Amount</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(formData.amount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Loan ID</p>
                <p className="font-medium">#{loan.id.toString().slice(-8).toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment Type</p>
                <p className="font-medium">
                  {formData.payment_type.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">
                  {formData.payment_method === 'card' ? 'Credit/Debit Card' : 'Bank Transfer'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Processing Time</p>
                <p className="font-medium">
                  {formData.payment_method === 'card' ? 'Instant' : '1-2 days'}
                </p>
              </div>
            </div>

            {formData.notes && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm p-2 bg-muted rounded">{formData.notes}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">New Outstanding Balance</span>
              <span className="font-semibold">
                {formatCurrency(Math.max(0, (loan.outstanding_balance || loan.current_balance || loan.principal || 0) - formData.amount))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const getCurrentStepContent = () => {
    switch (step) {
      case 'amount':
        return renderAmountStep()
      case 'method':
        return renderMethodStep()
      case 'confirm':
        return renderConfirmStep()
      default:
        return renderAmountStep()
    }
  }

  const canProceedToNext = () => {
    if (step === 'amount') {
      return formData.amount > 0
    }
    if (step === 'method') {
      return formData.payment_method
    }
    return true
  }

  const getNextStep = () => {
    if (step === 'amount') return 'method'
    if (step === 'method') return 'confirm'
    return 'confirm'
  }

  const getPrevStep = () => {
    if (step === 'confirm') return 'method'
    if (step === 'method') return 'amount'
    return 'amount'
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {['amount', 'method', 'confirm'].map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepName
                  ? 'bg-primary text-primary-foreground'
                  : ['amount', 'method', 'confirm'].indexOf(step) > index
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {['amount', 'method', 'confirm'].indexOf(step) > index ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 2 && (
              <div className={`w-12 h-0.5 mx-2 ${
                ['amount', 'method', 'confirm'].indexOf(step) > index ? 'bg-green-500' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {getCurrentStepContent()}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={step === 'amount' ? onCancel : () => setStep(getPrevStep())}
        >
          {step === 'amount' ? 'Cancel' : 'Back'}
        </Button>

        {step === 'confirm' ? (
          <Button 
            onClick={onSubmit}
            disabled={makePaymentMutation.isLoading}
            className="min-w-32"
          >
            {makePaymentMutation.isLoading ? 'Processing...' : 'Make Payment'}
          </Button>
        ) : (
          <Button 
            onClick={() => setStep(getNextStep())}
            disabled={!canProceedToNext()}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  )
} 