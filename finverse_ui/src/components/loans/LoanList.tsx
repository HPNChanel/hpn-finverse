import { useState } from 'react'
import { Eye, DollarSign, Calendar, TrendingUp, MoreHorizontal, CreditCard, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { LoanResponse, LoanStatus, LoanType } from '@/types/loan'
import { useLoans } from '@/hooks/useLoan'
import { LoanDetailsModal } from './LoanDetailsModal'
import { PaymentModal } from './PaymentModal'

interface LoanListProps {
  status?: 'active' | 'completed' | 'all'
}

export function LoanList({ status = 'all' }: LoanListProps) {
  const [selectedLoan, setSelectedLoan] = useState<LoanResponse | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: loans, isLoading, error } = useLoans({
    status: status !== 'all' ? status : undefined,
    loan_type: filterType !== 'all' ? filterType as LoanType : undefined,
    search: searchTerm || undefined
  })

  const getStatusBadge = (loanStatus: LoanStatus) => {
    const statusConfig = {
      [LoanStatus.ACTIVE]: { variant: 'default' as const, label: 'Active' },
      [LoanStatus.PENDING]: { variant: 'secondary' as const, label: 'Pending' },
      [LoanStatus.APPROVED]: { variant: 'default' as const, label: 'Approved' },
      [LoanStatus.REJECTED]: { variant: 'destructive' as const, label: 'Rejected' },
      [LoanStatus.COMPLETED]: { variant: 'outline' as const, label: 'Completed' },
      [LoanStatus.DEFAULTED]: { variant: 'destructive' as const, label: 'Defaulted' },
      [LoanStatus.CLOSED]: { variant: 'secondary' as const, label: 'Closed' }
    }

    const config = statusConfig[loanStatus]
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const getLoanTypeBadge = (loanType: LoanType) => {
    const typeConfig = {
      [LoanType.PERSONAL]: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Personal' },
      [LoanType.MORTGAGE]: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Mortgage' },
      [LoanType.AUTO]: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Auto' },
      [LoanType.EDUCATION]: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Education' },
      [LoanType.BUSINESS]: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Business' },
      [LoanType.EMERGENCY]: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Emergency' }
    }

    const config = typeConfig[loanType]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateProgress = (loan: LoanResponse) => {
    if (loan.principal === 0) return 0
    const paidAmount = loan.principal - (loan.outstanding_balance || loan.principal)
    return (paidAmount / loan.principal) * 100
  }

  const handleViewDetails = (loan: LoanResponse) => {
    setSelectedLoan(loan)
    setShowDetails(true)
  }

  const handleMakePayment = (loan: LoanResponse) => {
    setSelectedLoan(loan)
    setShowPayment(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Failed to load loans</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Loans</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage and track all your loan accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={LoanType.PERSONAL}>Personal</SelectItem>
                  <SelectItem value={LoanType.MORTGAGE}>Mortgage</SelectItem>
                  <SelectItem value={LoanType.AUTO}>Auto</SelectItem>
                  <SelectItem value={LoanType.EDUCATION}>Education</SelectItem>
                  <SelectItem value={LoanType.BUSINESS}>Business</SelectItem>
                  <SelectItem value={LoanType.EMERGENCY}>Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardContent className="p-0">
          {loans && loans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Details</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead className="text-right">EMI</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {loan.loan_type.replace('_', ' ').toUpperCase()} #{loan.id.toString().slice(-6)}
                            </span>
                            {getLoanTypeBadge(loan.loan_type)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {loan.annual_interest_rate}% • {loan.term_months} months
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Started: {new Date(loan.start_date).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatCurrency(loan.principal)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatCurrency(loan.outstanding_balance || loan.principal)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={calculateProgress(loan)} 
                            className="h-2 w-24 mx-auto"
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            {calculateProgress(loan).toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {formatCurrency(loan.emi)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {loan.repayment_frequency.toLowerCase()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(loan.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(loan)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.APPROVED) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMakePayment(loan)}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(loan)}>
                                View Details
                              </DropdownMenuItem>
                              {(loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.APPROVED) && (
                                <DropdownMenuItem onClick={() => handleMakePayment(loan)}>
                                  Make Payment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                Download Statement
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                View Payment History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No loans found</h3>
              <p className="text-muted-foreground mb-4">
                {status === 'active' 
                  ? "You don't have any active loans."
                  : status === 'completed'
                  ? "You don't have any completed loans."
                  : "You haven't applied for any loans yet."
                }
              </p>
              <Button>
                Apply for Your First Loan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedLoan && (
        <>
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Loan Details</DialogTitle>
                <DialogDescription>
                  Complete information about your loan
                </DialogDescription>
              </DialogHeader>
              <LoanDetailsModal loan={selectedLoan} />
            </DialogContent>
          </Dialog>

          <Dialog open={showPayment} onOpenChange={setShowPayment}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Make Payment</DialogTitle>
                <DialogDescription>
                  Make a payment towards your loan
                </DialogDescription>
              </DialogHeader>
              <PaymentModal 
                loan={selectedLoan} 
                onSuccess={() => {
                  setShowPayment(false)
                  setSelectedLoan(null)
                }}
                onCancel={() => {
                  setShowPayment(false)
                  setSelectedLoan(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
} 