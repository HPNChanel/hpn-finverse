import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { useToast } from '@/hooks/use-toast';
import {
  savingsApi,
  SavingsPlan,
  SavingsPlanDetail,
  SavingsSummary,
  CreateSavingsPlanRequest,
  UpdateSavingsPlanRequest,
  SavingsCalculationRequest,
  SavingsCalculationResponse,
  SavingsProjection,
  } from '@/services/savingsApi';
import { useAuth } from '@/hooks/useAuth';

// Query keys for React Query
export const SAVINGS_QUERY_KEYS = {
  all: ['savings'] as const,
  plans: () => [...SAVINGS_QUERY_KEYS.all, 'plans'] as const,
  plan: (id: number) => [...SAVINGS_QUERY_KEYS.all, 'plan', id] as const,
  projections: (id: number) => [...SAVINGS_QUERY_KEYS.all, 'projections', id] as const,
  summary: () => [...SAVINGS_QUERY_KEYS.all, 'summary'] as const,
  calculation: (data: SavingsCalculationRequest) => [...SAVINGS_QUERY_KEYS.all, 'calculation', data] as const,
  financialAccounts: () => [...SAVINGS_QUERY_KEYS.all, 'financial-accounts'] as const,
};

/**
 * Hook to fetch all savings plans
 */
export const useSavingsPlans = (): UseQueryResult<SavingsPlan[], Error> => {
  const { toast } = useToast();

  return useQuery(
    SAVINGS_QUERY_KEYS.plans(),
    savingsApi.getSavingsPlans,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error: Error) => {
        console.error('❌ Failed to fetch savings plans:', error);
        toast({
          title: 'Error',
          description: 'Failed to load savings plans. Please try again.',
          variant: 'destructive',
        });
      },
      onSuccess: (data) => {
        console.log('✅ Savings plans loaded successfully:', data);
      },
    }
  );
};

/**
 * Hook to fetch savings plan details
 */
export const useSavingsPlanDetail = (planId: number): UseQueryResult<SavingsPlanDetail, Error> => {
  const { toast } = useToast();

  return useQuery(
    SAVINGS_QUERY_KEYS.plan(planId),
    () => savingsApi.getSavingsPlanDetail(planId),
    {
      enabled: !!planId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error: Error) => {
        console.error(`❌ Failed to fetch savings plan ${planId}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load plan details. Please try again.',
          variant: 'destructive',
        });
      },
      onSuccess: (data) => {
        console.log(`✅ Savings plan ${planId} loaded successfully:`, data);
      },
    }
  );
};

/**
 * Hook to fetch savings plan projections
 */
export const useSavingsPlanProjections = (planId: number): UseQueryResult<SavingsProjection[], Error> => {
  const { toast } = useToast();

  return useQuery(
    SAVINGS_QUERY_KEYS.projections(planId),
    () => savingsApi.getSavingsPlanProjections(planId),
    {
      enabled: !!planId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error: Error) => {
        console.error(`❌ Failed to fetch projections for plan ${planId}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load projections. Please try again.',
          variant: 'destructive',
        });
      },
      onSuccess: (data) => {
        console.log(`✅ Projections for plan ${planId} loaded successfully:`, data);
      },
    }
  );
};

/**
 * Hook to fetch savings summary
 */
export const useSavingsSummary = (): UseQueryResult<SavingsSummary, Error> => {
  const { toast } = useToast();

  return useQuery(
    SAVINGS_QUERY_KEYS.summary(),
    savingsApi.getSavingsSummary,
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error: Error) => {
        console.error('❌ Failed to fetch savings summary:', error);
        toast({
          title: 'Error',
          description: 'Failed to load savings summary. Please try again.',
          variant: 'destructive',
        });
      },
      onSuccess: (data) => {
        console.log('✅ Savings summary loaded successfully:', data);
      },
    }
  );
};

/**
 * Hook to create a savings plan
 */
export const useCreateSavingsPlan = (): UseMutationResult<SavingsPlanDetail, Error, CreateSavingsPlanRequest> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(savingsApi.createSavingsPlan, {
    onMutate: async (newPlan) => {
      console.log('🔄 Creating savings plan:', newPlan);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.plans());
      await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.summary());
    },
    onSuccess: (data, variables) => {
      console.log('✅ Savings plan created successfully:', data);
      
      // Add optimistic update to plans list
      queryClient.setQueryData<SavingsPlan[]>(SAVINGS_QUERY_KEYS.plans(), (oldPlans) => {
        const newPlan: SavingsPlan = {
          id: data.id,
          source_account_id: data.source_account_id,
          name: data.name,
          initial_amount: data.initial_amount,
          monthly_contribution: data.monthly_contribution,
          interest_rate: data.interest_rate,
          duration_months: data.duration_months,
          interest_type: data.interest_type,
          created_at: data.created_at,
          updated_at: data.updated_at,
          source_account_name: data.source_account_name,
          source_account_balance: data.source_account_balance,
        };
        return oldPlans ? [newPlan, ...oldPlans] : [newPlan];
      });
      
      // Set the detailed plan data
      queryClient.setQueryData(SAVINGS_QUERY_KEYS.plan(data.id), data);
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.plans());
      queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.summary());
      
      toast({
        title: 'Success',
        description: `Savings plan "${variables.name}" created successfully!`,
      });
    },
    onError: (error: Error, variables) => {
      console.error('❌ Failed to create savings plan:', error);
      
      // Extract error message from API response
      let errorMessage = `Failed to create savings plan "${variables.name}". Please try again.`;
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a savings plan
 */
export const useUpdateSavingsPlan = (): UseMutationResult<SavingsPlanDetail, Error, { planId: number; data: UpdateSavingsPlanRequest }> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(
    ({ planId, data }) => savingsApi.updateSavingsPlan(planId, data),
    {
      onMutate: async ({ planId, data }) => {
        console.log(`🔄 Updating savings plan ${planId}:`, data);
        
        // Cancel outgoing refetches to prevent race conditions
        await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.plan(planId));
        await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.plans());
        await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.projections(planId));
        await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.summary());

        // Get current data for rollback
        const previousPlanDetail = queryClient.getQueryData<SavingsPlanDetail>(SAVINGS_QUERY_KEYS.plan(planId));
        const previousPlans = queryClient.getQueryData<SavingsPlan[]>(SAVINGS_QUERY_KEYS.plans());

        // Optimistic update for plan detail
        if (previousPlanDetail) {
          const optimisticPlanDetail: SavingsPlanDetail = {
            ...previousPlanDetail,
            ...data,
            updated_at: new Date().toISOString(),
          };
          queryClient.setQueryData(SAVINGS_QUERY_KEYS.plan(planId), optimisticPlanDetail);
        }

        // Optimistic update for plans list
        if (previousPlans) {
          const optimisticPlans = previousPlans.map(plan => 
            plan.id === planId 
              ? { ...plan, ...data, updated_at: new Date().toISOString() }
              : plan
          );
          queryClient.setQueryData(SAVINGS_QUERY_KEYS.plans(), optimisticPlans);
        }

        return { previousPlanDetail, previousPlans };
      },
      onSuccess: (updatedPlan, { planId }) => {
        console.log(`✅ Savings plan ${planId} updated successfully:`, updatedPlan);
        
        // Update the specific plan query with server response
        queryClient.setQueryData(SAVINGS_QUERY_KEYS.plan(planId), updatedPlan);
        
        // Update plans list with server response
        queryClient.setQueryData<SavingsPlan[]>(SAVINGS_QUERY_KEYS.plans(), (oldPlans) => {
          if (!oldPlans) return [];
          return oldPlans.map(plan => 
            plan.id === planId 
              ? {
                  id: updatedPlan.id,
                  source_account_id: updatedPlan.source_account_id,
                  name: updatedPlan.name,
                  initial_amount: updatedPlan.initial_amount,
                  monthly_contribution: updatedPlan.monthly_contribution,
                  interest_rate: updatedPlan.interest_rate,
                  duration_months: updatedPlan.duration_months,
                  interest_type: updatedPlan.interest_type,
                  created_at: updatedPlan.created_at,
                  updated_at: updatedPlan.updated_at,
                  source_account_name: updatedPlan.source_account_name,
                  source_account_balance: updatedPlan.source_account_balance,
                }
              : plan
          );
        });
        
        // Invalidate and refetch all related queries to ensure fresh data
        queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.plans());
        queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.plan(planId));
        queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.projections(planId));
        queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.summary());
        
        toast({
          title: 'Success',
          description: `Plan "${updatedPlan.name}" updated successfully!`,
        });
      },
      onError: (error: Error, { planId }, context) => {
        console.error(`❌ Failed to update savings plan ${planId}:`, error);
        
        // Rollback optimistic updates
        if (context?.previousPlanDetail) {
          queryClient.setQueryData(SAVINGS_QUERY_KEYS.plan(planId), context.previousPlanDetail);
        }
        if (context?.previousPlans) {
          queryClient.setQueryData(SAVINGS_QUERY_KEYS.plans(), context.previousPlans);
        }
        
        toast({
          title: 'Error',
          description: 'Failed to update savings plan. Please try again.',
          variant: 'destructive',
        });
      },
    }
  );
};

/**
 * Hook to delete a savings plan
 */
export const useDeleteSavingsPlan = (): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(savingsApi.deleteSavingsPlan, {
    onMutate: async (planId) => {
      console.log(`🔄 Deleting savings plan ${planId}`);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.plans());
      await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.summary());
      
      // Optionally remove from cache immediately
      queryClient.removeQueries(SAVINGS_QUERY_KEYS.plan(planId));
    },
    onSuccess: (_, planId) => {
      console.log(`✅ Savings plan ${planId} deleted successfully`);
      
      // Invalidate and refetch
      queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.plans());
      queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.summary());
      
      toast({
        title: 'Success',
        description: 'Savings plan deleted successfully!',
      });
    },
    onError: (error: Error, planId) => {
      console.error(`❌ Failed to delete savings plan ${planId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete savings plan. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to calculate savings projections (preview)
 */
export const useSavingsCalculation = (): UseMutationResult<SavingsCalculationResponse, Error, SavingsCalculationRequest> => {
  const { toast } = useToast();

  return useMutation(savingsApi.calculateSavings, {
    onMutate: (calculationData) => {
      console.log('🔄 Calculating savings projections:', calculationData);
    },
    onSuccess: (result) => {
      console.log('✅ Savings calculation completed:', result);
    },
    onError: (error: Error) => {
      console.error('❌ Failed to calculate savings:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate savings projections. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to get user balance
 */
export const useUserBalance = (): UseQueryResult<{ user_id: number; total_balance: number; currency: string; last_updated: string }, Error> => {
  return useQuery(
    ['user-balance'],
    savingsApi.getUserBalance,
    {
      staleTime: 30000, // 30 seconds
      cacheTime: 60000, // 1 minute
      onSuccess: (data) => {
        console.log('✅ User balance fetched:', data);
      },
      onError: (error: Error) => {
        console.error('❌ Failed to fetch user balance:', error);
      },
    }
  );
};

/**
 * Hook to sync user balance from financial accounts
 */
export const useSyncUserBalance = (): UseMutationResult<{ user_id: number; total_balance: number; currency: string; last_updated: string }, Error, void> => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation(savingsApi.syncUserBalance, {
    onMutate: () => {
      console.log('🔄 Syncing user balance...');
    },
    onSuccess: (data) => {
      console.log('✅ User balance synced successfully:', data);
      
      // Update the user balance query cache
      queryClient.setQueryData(['user-balance'], data);
      
      toast({
        title: 'Success',
        description: `Balance synced successfully! Available: $${data.total_balance.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Failed to sync user balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync balance. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to fetch financial accounts for account selection
 */
export function useFinancialAccounts() {
  const { isAuthenticated } = useAuth();
  
  console.log('🔐 useFinancialAccounts - isAuthenticated:', isAuthenticated);
  
  return useQuery({
    queryKey: SAVINGS_QUERY_KEYS.financialAccounts(),
    queryFn: () => savingsApi.getFinancialAccounts(),
    enabled: isAuthenticated, // Only run query if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry authentication errors
      const axiosError = error as { response?: { status: number } };
      if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error: unknown) => {
      console.error('❌ Failed to fetch financial accounts:', error);
      
      // Handle authentication errors specifically
      const axiosError = error as { response?: { status: number; data?: unknown } };
      if (axiosError?.response?.status === 401) {
        console.log('🔐 Authentication required for financial accounts');
      } else if (axiosError?.response?.status === 422) {
        console.error('🔧 Request validation error for financial accounts:', axiosError?.response?.data);
      }
    }
  });
} 