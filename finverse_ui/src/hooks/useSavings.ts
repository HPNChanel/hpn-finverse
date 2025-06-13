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
} from '@/services/savingsApi';

// Query keys for React Query
export const SAVINGS_QUERY_KEYS = {
  all: ['savings'] as const,
  plans: () => [...SAVINGS_QUERY_KEYS.all, 'plans'] as const,
  plan: (id: number) => [...SAVINGS_QUERY_KEYS.all, 'plan', id] as const,
  summary: () => [...SAVINGS_QUERY_KEYS.all, 'summary'] as const,
  calculation: (data: SavingsCalculationRequest) => [...SAVINGS_QUERY_KEYS.all, 'calculation', data] as const,
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
      toast({
        title: 'Error',
        description: `Failed to create savings plan "${variables.name}". Please try again.`,
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
        
        // Cancel outgoing refetches
        await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.plan(planId));
        await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.plans());
        await queryClient.cancelQueries(SAVINGS_QUERY_KEYS.summary());
      },
      onSuccess: (updatedPlan, { planId }) => {
        console.log(`✅ Savings plan ${planId} updated successfully:`, updatedPlan);
        
        // Update the specific plan query
        queryClient.setQueryData(SAVINGS_QUERY_KEYS.plan(planId), updatedPlan);
        
        // Invalidate list and summary
        queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.plans());
        queryClient.invalidateQueries(SAVINGS_QUERY_KEYS.summary());
        
        toast({
          title: 'Success',
          description: `Savings plan "${updatedPlan.name}" updated successfully!`,
        });
      },
      onError: (error: Error, { planId }) => {
        console.error(`❌ Failed to update savings plan ${planId}:`, error);
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