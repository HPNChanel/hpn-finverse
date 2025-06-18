import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  LoanCalculationRequest, 
  LoanCalculationResponse,
  LoanApplicationRequest,
  LoanCreateRequest, 
  LoanResponse, 
  LoanPortfolioResponse,
  LoanRepaymentScheduleResponse,
  LoanPaymentResponse,
  LoanPaymentRequest,
  LoanType,
  LoanStatus
} from '@/types/loan'
import { loanService } from '@/services/loanService'

// Query keys for React Query
export const loanKeys = {
  all: ['loans'] as const,
  lists: () => [...loanKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...loanKeys.lists(), filters] as const,
  details: () => [...loanKeys.all, 'detail'] as const,
  detail: (id: number) => [...loanKeys.details(), id] as const,
  portfolio: () => [...loanKeys.all, 'portfolio'] as const,
  calculations: () => [...loanKeys.all, 'calculations'] as const,
  calculation: (params: LoanCalculationRequest) => [...loanKeys.calculations(), params] as const,
  schedule: (id: number) => [...loanKeys.all, 'schedule', id] as const,
  payments: (id: number) => [...loanKeys.all, 'payments', id] as const,
  analytics: (id: number) => [...loanKeys.all, 'analytics', id] as const,
  configurations: () => [...loanKeys.all, 'configurations'] as const
}

// Loan calculation hook
export function useLoanCalculation(params: LoanCalculationRequest) {
  return useQuery({
    queryKey: loanKeys.calculation(params),
    queryFn: () => loanService.calculateLoan(params),
    enabled: !!(params.principal_amount && params.interest_rate && params.loan_term_months),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Loan simulation hook (similar to calculation but for comparison)
export function useLoanSimulation(scenarios: LoanCalculationRequest[]) {
  return useQuery({
    queryKey: [...loanKeys.calculations(), 'simulation', scenarios],
    queryFn: () => loanService.simulateLoans(scenarios),
    enabled: scenarios.length > 0 && scenarios.every(s => s.principal_amount && s.interest_rate && s.loan_term_months),
    staleTime: 5 * 60 * 1000,
  })
}

// Loans list hook with filters
interface UseLoansParams {
  status?: LoanStatus
  loan_type?: LoanType
  search?: string
  page?: number
  limit?: number
}

export function useLoans(params: UseLoansParams = {}) {
  return useQuery({
    queryKey: loanKeys.list(params as Record<string, unknown>),
    queryFn: () => loanService.getLoans(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Single loan detail hook
export function useLoan(id: number) {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: () => loanService.getLoan(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

// Loan portfolio summary hook
export function useLoanPortfolio() {
  return useQuery({
    queryKey: loanKeys.portfolio(),
    queryFn: () => loanService.getPortfolioSummary(),
    staleTime: 5 * 60 * 1000,
  })
}

// Loan repayment schedule hook
export function useLoanSchedule(loanId: number) {
  return useQuery({
    queryKey: loanKeys.schedule(loanId),
    queryFn: () => loanService.getLoanSchedule(loanId),
    enabled: !!loanId,
    staleTime: 5 * 60 * 1000,
  })
}

// Loan payments history hook
export function useLoanPayments(loanId: number) {
  return useQuery({
    queryKey: loanKeys.payments(loanId),
    queryFn: () => loanService.getLoanPayments(loanId),
    enabled: !!loanId,
    staleTime: 1 * 60 * 1000, // 1 minute for more frequent updates
  })
}

// Loan analytics hook
export function useLoanAnalytics(loanId: number) {
  return useQuery({
    queryKey: loanKeys.analytics(loanId),
    queryFn: () => loanService.getLoanAnalytics(loanId),
    enabled: !!loanId,
    staleTime: 5 * 60 * 1000,
  })
}

// Loan configurations hook (for loan types, interest rates, etc.)
export function useLoanConfigurations() {
  return useQuery({
    queryKey: loanKeys.configurations(),
    queryFn: () => loanService.getConfigurations(),
    staleTime: 30 * 60 * 1000, // 30 minutes (configurations don't change often)
  })
}

// Mutation hooks for write operations

// Create loan application mutation
export function useCreateLoan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (application: LoanCreateRequest) => loanService.createLoan(application),
    onSuccess: (newLoan) => {
      // Invalidate and refetch loan list
      queryClient.invalidateQueries(loanKeys.lists())
      queryClient.invalidateQueries(loanKeys.portfolio())
      
      // Add the new loan to the cache
      queryClient.setQueryData(loanKeys.detail(newLoan.id), newLoan)
    },
    onError: (error) => {
      console.error('Failed to create loan:', error)
    }
  })
}

// Update loan mutation
export function useUpdateLoan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<LoanResponse> }) => 
      loanService.updateLoan(id, updates),
    onSuccess: (updatedLoan) => {
      // Update the loan in cache
      queryClient.setQueryData(loanKeys.detail(updatedLoan.id), updatedLoan)
      
      // Invalidate list and portfolio queries
      queryClient.invalidateQueries(loanKeys.lists())
      queryClient.invalidateQueries(loanKeys.portfolio())
    },
    onError: (error) => {
      console.error('Failed to update loan:', error)
    }
  })
}

// Make payment mutation
export function useMakePayment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ loanId, payment }: { loanId: number; payment: LoanPaymentRequest }) =>
      loanService.makePayment(loanId, payment),
    onSuccess: (paymentResult, { loanId }) => {
      // Invalidate payment history
      queryClient.invalidateQueries(loanKeys.payments(loanId))
      
      // Invalidate loan details (to update outstanding balance)
      queryClient.invalidateQueries(loanKeys.detail(loanId))
      
      // Invalidate portfolio and list
      queryClient.invalidateQueries(loanKeys.portfolio())
      queryClient.invalidateQueries(loanKeys.lists())
      
      // Invalidate schedule if balance changed significantly
      queryClient.invalidateQueries(loanKeys.schedule(loanId))
    },
    onError: (error) => {
      console.error('Failed to make payment:', error)
    }
  })
}

// Prepayment calculation mutation
export function usePrepaymentCalculation() {
  return useMutation({
    mutationFn: ({ loanId, amount }: { loanId: number; amount: number }) =>
      loanService.calculatePrepayment(loanId, amount),
    onError: (error) => {
      console.error('Failed to calculate prepayment:', error)
    }
  })
}

// Loan closure mutation
export function useCloseLoan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (loanId: number) => loanService.closeLoan(loanId),
    onSuccess: (closedLoan) => {
      // Update the loan status in cache
      queryClient.setQueryData(loanKeys.detail(closedLoan.id), closedLoan)
      
      // Invalidate lists and portfolio
      queryClient.invalidateQueries(loanKeys.lists())
      queryClient.invalidateQueries(loanKeys.portfolio())
    },
    onError: (error) => {
      console.error('Failed to close loan:', error)
    }
  })
}

// Loan refinancing mutation
export function useRefinanceLoan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ loanId, refinanceData }: { loanId: number; refinanceData: Record<string, unknown> }) =>
      loanService.refinanceLoan(loanId, refinanceData),
    onSuccess: () => {
      // Invalidate all loan-related queries as refinancing creates a new loan structure
      queryClient.invalidateQueries(loanKeys.all)
    },
    onError: (error) => {
      console.error('Failed to refinance loan:', error)
    }
  })
}

// Bulk operations
export function useBulkPayment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (payments: Array<{ loanId: number; payment: LoanPaymentRequest }>) =>
      loanService.bulkPayment(payments),
    onSuccess: () => {
      // Invalidate all loan-related queries for bulk operations
      queryClient.invalidateQueries(loanKeys.all)
    },
    onError: (error) => {
      console.error('Failed to process bulk payments:', error)
    }
  })
}

// Export statement mutation
export function useExportStatement() {
  return useMutation({
    mutationFn: ({ loanId, format = 'pdf', dateRange }: { 
      loanId: number; 
      format?: 'pdf' | 'excel'; 
      dateRange?: { from: string; to: string } 
    }) => loanService.exportStatement(loanId, format, dateRange),
    onError: (error) => {
      console.error('Failed to export statement:', error)
    }
  })
}

// Custom hooks for common use cases

// Hook to check if user has any loans
export function useHasLoans() {
  const { data: loans } = useLoans()
  return loans && loans.length > 0
}

// Hook to get loans by status
export function useLoansByStatus(status: LoanStatus) {
  return useLoans({ status })
}

// Hook to calculate total monthly commitment
export function useMonthlyCommitment() {
  const { data: portfolio } = useLoanPortfolio()
  return portfolio?.total_borrowed || 0
}

// Hook for loan health score - simplified version
export function useLoanHealthScore() {
  const { data: portfolio } = useLoanPortfolio()
  
  if (!portfolio) return null
  
  // Simple health score based on loan activity
  const totalLoans = portfolio.total_loans
  const activeLoans = portfolio.active_loans
  
  if (totalLoans === 0) return 100
  
  const activeRatio = activeLoans / totalLoans
  return Math.max(100 - (activeRatio * 20), 60) // Simple calculation
}

// Prefetch functions for performance optimization
export function usePrefetchLoan() {
  const queryClient = useQueryClient()
  
  return (loanId: number) => {
    queryClient.prefetchQuery({
      queryKey: loanKeys.detail(loanId),
      queryFn: () => loanService.getLoan(loanId),
      staleTime: 2 * 60 * 1000,
    })
  }
}

export function usePrefetchLoanSchedule() {
  const queryClient = useQueryClient()
  
  return (loanId: number) => {
    queryClient.prefetchQuery({
      queryKey: loanKeys.schedule(loanId),
      queryFn: () => loanService.getLoanSchedule(loanId),
      staleTime: 5 * 60 * 1000,
    })
  }
} 