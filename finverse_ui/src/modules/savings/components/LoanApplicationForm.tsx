import { useState } from 'react'
import { ChevronRight, ChevronLeft, User, DollarSign, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { LoanCreateRequest, LoanType, InterestType, AmortizationType, RepaymentFrequency } from '@/types/loan'
import { useCreateLoan } from '@/hooks/useLoan'

interface LoanApplicationFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  loan_name: string
  loan_type: LoanType
  principal_amount: number
  interest_rate: number
  loan_term_months: number
  interest_type: InterestType
  amortization_type: AmortizationType
  repayment_frequency: RepaymentFrequency
  purpose: string
  employment_type: string
  monthly_income: number
  existing_debts: number
  collateral_value: number
}

const STEPS = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Basic details about you',
    icon: User
  },
  {
    id: 2,
    title: 'Loan Details',
    description: 'Loan amount and terms',
    icon: DollarSign
  },
  {
    id: 3,
    title: 'Financial Information',
    description: 'Income and employment details',
    icon: FileText
  },
  {
    id: 4,
    title: 'Review & Submit',
    description: 'Review your application',
    icon: CheckCircle
  }
]

export function LoanApplicationForm({ onSuccess, onCancel }: LoanApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const createLoanMutation = useCreateLoan()

  const [formData, setFormData] = useState<FormData>({
    loan_name: '',
    loan_type: LoanType.PERSONAL,
    principal_amount: 10000,
    interest_rate: 8.5,
    loan_term_months: 12,
    interest_type: InterestType.FIXED,
    amortization_type: AmortizationType.REDUCING_BALANCE,
    repayment_frequency: RepaymentFrequency.MONTHLY,
    purpose: '',
    employment_type: 'full_time',
    monthly_income: 5000,
    existing_debts: 0,
    collateral_value: 0
  })

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onSubmit = async () => {
    try {
      const loanApplication: LoanCreateRequest = {
        loan_name: formData.loan_name || `${formData.loan_type} Loan`,
        loan_type: formData.loan_type,
        principal_amount: formData.principal_amount,
        interest_rate: formData.interest_rate,
        loan_term_months: formData.loan_term_months,
        interest_type: formData.interest_type,
        amortization_type: formData.amortization_type,
        repayment_frequency: formData.repayment_frequency,
        purpose: formData.purpose,
        start_date: new Date().toISOString().split('T')[0],
        is_simulation: false
      }

      await createLoanMutation.mutateAsync(loanApplication)
      onSuccess()
    } catch (error) {
      console.error('Failed to submit loan application:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateEstimatedEMI = () => {
    const P = formData.principal_amount || 0
    const r = (formData.interest_rate || 0) / 100 / 12
    const n = formData.loan_term_months || 1
    
    if (P === 0 || r === 0) return 0
    
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    return emi
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(value) => handleInputChange('employment_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time Employee</SelectItem>
                    <SelectItem value="part_time">Part-time Employee</SelectItem>
                    <SelectItem value="self_employed">Self-employed</SelectItem>
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_income">Monthly Income ($)</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  value={formData.monthly_income}
                  onChange={(e) => handleInputChange('monthly_income', Number(e.target.value))}
                  placeholder="5,000"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Loan Type</Label>
                <Select 
                  value={formData.loan_type} 
                  onValueChange={(value) => handleInputChange('loan_type', value as LoanType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LoanType.PERSONAL}>Personal Loan</SelectItem>
                    <SelectItem value={LoanType.MORTGAGE}>Mortgage</SelectItem>
                    <SelectItem value={LoanType.AUTO}>Auto Loan</SelectItem>
                    <SelectItem value={LoanType.EDUCATION}>Education Loan</SelectItem>
                    <SelectItem value={LoanType.BUSINESS}>Business Loan</SelectItem>
                    <SelectItem value={LoanType.EMERGENCY}>Emergency Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal_amount">Loan Amount ($)</Label>
                  <Input
                    id="principal_amount"
                    type="number"
                    value={formData.principal_amount}
                    onChange={(e) => handleInputChange('principal_amount', Number(e.target.value))}
                    placeholder="10,000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan_term_months">Loan Term (Months)</Label>
                  <Input
                    id="loan_term_months"
                    type="number"
                    value={formData.loan_term_months}
                    onChange={(e) => handleInputChange('loan_term_months', Number(e.target.value))}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.1"
                  value={formData.interest_rate}
                  onChange={(e) => handleInputChange('interest_rate', Number(e.target.value))}
                  placeholder="8.5"
                />
              </div>
            </div>

            {/* EMI Estimate */}
            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Estimated EMI</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(calculateEstimatedEMI())}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Monthly
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="existing_debts">Existing Monthly Debt Payments ($)</Label>
                <Input
                  id="existing_debts"
                  type="number"
                  value={formData.existing_debts}
                  onChange={(e) => handleInputChange('existing_debts', Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Loan</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  placeholder="Describe how you plan to use this loan..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Summary</CardTitle>
                <CardDescription>
                  Please review your loan application details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Loan Type</Label>
                    <p className="font-medium">
                      {formData.loan_type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Loan Amount</Label>
                    <p className="font-medium">{formatCurrency(formData.principal_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Term</Label>
                    <p className="font-medium">{formData.loan_term_months} months</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Interest Rate</Label>
                    <p className="font-medium">{formData.interest_rate}%</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Monthly Income</Label>
                    <p className="font-medium">{formatCurrency(formData.monthly_income)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Estimated EMI</Label>
                    <p className="font-medium text-green-600">
                      {formatCurrency(calculateEstimatedEMI())}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Purpose</Label>
                  <p className="font-medium">{formData.purpose}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep - 1].description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
        </div>
        
        <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
        
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center text-xs ${
                  step.id <= currentStep 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step.id <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="hidden sm:block">{step.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={nextStep} className="flex items-center gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={onSubmit}
            disabled={createLoanMutation.isLoading}
            className="flex items-center gap-2"
          >
            {createLoanMutation.isLoading ? 'Submitting...' : 'Submit Application'}
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
} 