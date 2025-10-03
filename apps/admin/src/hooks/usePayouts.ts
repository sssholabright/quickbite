import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsService } from '../services/payoutsService';
import { PayoutFilters, PayoutSort, CreatePayoutRequest } from '../types/payouts';

export const payoutsKeys = {
    all: ['payouts'] as const,
    lists: () => [...payoutsKeys.all, 'list'] as const,
    list: (params: any) => [...payoutsKeys.lists(), params] as const,
    wallets: () => [...payoutsKeys.all, 'wallets'] as const,
    walletsList: (params: any) => [...payoutsKeys.wallets(), params] as const,
    details: () => [...payoutsKeys.all, 'detail'] as const,
    detail: (id: string) => [...payoutsKeys.details(), id] as const,
};

// Get payouts list
export const usePayoutsList = (page: number, limit: number, filters: PayoutFilters, sort: PayoutSort) => {
    return useQuery({
        queryKey: payoutsKeys.list({ page, limit, filters, sort }),
        queryFn: () => payoutsService.getPayoutsList(page, limit, filters, sort),
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Get wallets list
export const useWalletsList = (page: number, limit: number, recipientType?: 'VENDOR' | 'RIDER', filters?: any, sort?: any) => {
    return useQuery({
        queryKey: payoutsKeys.walletsList({ page, limit, recipientType, filters, sort }),
        queryFn: () => payoutsService.getWalletsList(page, limit, recipientType, filters, sort),
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Get payout details
export const usePayoutDetails = (payoutId: string) => {
    return useQuery({
        queryKey: payoutsKeys.detail(payoutId),
        queryFn: () => payoutsService.getPayoutDetails(payoutId),
        enabled: !!payoutId,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Create payout
export const useCreatePayout = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (request: CreatePayoutRequest) => payoutsService.createPayout(request),
        onSuccess: () => {
            // Invalidate and refetch payouts and wallets lists
            queryClient.invalidateQueries({ queryKey: payoutsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: payoutsKeys.wallets() });
        },
    });
};

// Update payout
export const useUpdatePayout = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ payoutId, request }: { payoutId: string; request: any }) =>
            payoutsService.updatePayout(payoutId, request),
        onSuccess: (data, variables) => {
            // Invalidate and refetch payouts list and details
            queryClient.invalidateQueries({ queryKey: payoutsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: payoutsKeys.detail(variables.payoutId) });
        },
    });
};