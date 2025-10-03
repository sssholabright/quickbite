import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '../services/paymentsService';
import { PaymentFilters, PaymentSort, RefundRequest, RetryPaymentRequest } from '../types/payments';

export const paymentsKeys = {
    all: ['payments'] as const,
    lists: () => [...paymentsKeys.all, 'list'] as const,
    list: (params: any) => [...paymentsKeys.lists(), params] as const,
    details: () => [...paymentsKeys.all, 'detail'] as const,
    detail: (id: string) => [...paymentsKeys.details(), id] as const,
};

// Get payments list
export const usePaymentsList = (page: number, limit: number, filters: PaymentFilters, sort: PaymentSort) => {
    return useQuery({
        queryKey: paymentsKeys.list({ page, limit, filters, sort }),
        queryFn: () => paymentsService.getPaymentsList(page, limit, filters, sort),
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Get payment details
export const usePaymentDetails = (paymentId: string) => {
    return useQuery({
        queryKey: paymentsKeys.detail(paymentId),
        queryFn: () => paymentsService.getPaymentDetails(paymentId),
        enabled: !!paymentId,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
};

// Process refund
export const useProcessRefund = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ paymentId, request }: { paymentId: string; request: RefundRequest }) =>
            paymentsService.processRefund(paymentId, request),
        onSuccess: (data, variables) => {
            // Invalidate and refetch payments list and details
            queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: paymentsKeys.detail(variables.paymentId) });
        },
    });
};

// Retry payment
export const useRetryPayment = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ paymentId, request }: { paymentId: string; request: RetryPaymentRequest }) =>
            paymentsService.retryPayment(paymentId, request),
        onSuccess: (data, variables) => {
            // Invalidate and refetch payments list and details
            queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: paymentsKeys.detail(variables.paymentId) });
        },
    });
};