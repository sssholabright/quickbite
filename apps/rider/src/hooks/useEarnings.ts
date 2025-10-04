import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EarningsResponse, EarningsSummary, EarningsRange } from '../types/earnings';
import EarningsService from '../services/earningsService';

// Query keys
export const earningsKeys = {
    all: ['earnings'] as const,
    earnings: (range: EarningsRange) => [...earningsKeys.all, 'earnings', range] as const,
    summary: () => [...earningsKeys.all, 'summary'] as const,
};

// Hook to get earnings with filtering
export const useEarnings = (range: EarningsRange = 'day') => {
    return useQuery({
        queryKey: earningsKeys.earnings(range),
        queryFn: () => EarningsService.getEarnings(range),
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
};

// Hook to get earnings summary
export const useEarningsSummary = () => {
    return useQuery({
        queryKey: earningsKeys.summary(),
        queryFn: () => EarningsService.getEarningsSummary(),
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
};

// Hook to invalidate earnings queries (useful when new earnings are added)
export const useInvalidateEarnings = () => {
    const queryClient = useQueryClient();
    
    return {
        invalidateAll: () => queryClient.invalidateQueries({ queryKey: earningsKeys.all }),
        invalidateEarnings: (range?: EarningsRange) => {
            if (range) {
                queryClient.invalidateQueries({ queryKey: earningsKeys.earnings(range) });
            } else {
                queryClient.invalidateQueries({ queryKey: earningsKeys.all });
            }
        },
        invalidateSummary: () => queryClient.invalidateQueries({ queryKey: earningsKeys.summary() }),
    };
};