import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services/ordersService';
import { 
    OrdersListParams, 
    ReassignRiderRequest, 
    CancelOrderRequest, 
    RefundOrderRequest 
} from '../types/orders';

// Query keys
export const ordersKeys = {
    all: ['orders'] as const,
    list: (params: OrdersListParams) => [...ordersKeys.all, 'list', params] as const,
    availableRiders: () => [...ordersKeys.all, 'available-riders'] as const,
};

// Orders list hook
export function useOrdersList(params: OrdersListParams) {
    return useQuery({
        queryKey: ordersKeys.list(params),
        queryFn: () => ordersService.getOrdersList(params),
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
    });
}

// Available riders hook
export function useAvailableRiders() {
    return useQuery({
        queryKey: ordersKeys.availableRiders(),
        queryFn: () => ordersService.getAvailableRiders(),
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchOnWindowFocus: false,
    });
}

// Reassign rider mutation
export function useReassignRider() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orderId, request }: { orderId: string; request: ReassignRiderRequest }) =>
            ordersService.reassignRider(orderId, request),
        onSuccess: () => {
            // Invalidate orders list to refresh data
            queryClient.invalidateQueries({ queryKey: ordersKeys.all });
        },
    });
}

// Cancel order mutation
export function useCancelOrder() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orderId, request }: { orderId: string; request: CancelOrderRequest }) =>
            ordersService.cancelOrder(orderId, request),
        onSuccess: () => {
            // Invalidate orders list to refresh data
            queryClient.invalidateQueries({ queryKey: ordersKeys.all });
        },
    });
}

// Refund order mutation
export function useRefundOrder() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orderId, request }: { orderId: string; request: RefundOrderRequest }) =>
            ordersService.refundOrder(orderId, request),
        onSuccess: () => {
            // Invalidate orders list to refresh data
            queryClient.invalidateQueries({ queryKey: ordersKeys.all });
        },
    });
}