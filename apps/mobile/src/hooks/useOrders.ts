import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { CreateOrderRequest, OrderFilters } from '../types/order';

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (orderData: CreateOrderRequest) => orderService.createOrder(orderData),
        onSuccess: () => {
            // Invalidate and refetch orders
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useOrders = (filters?: OrderFilters) => {
    return useQuery({
        queryKey: ['orders', filters],
        queryFn: () => orderService.getOrders(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useOrder = (orderId: string) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: () => orderService.getOrderById(orderId),
        enabled: !!orderId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orderId, statusUpdate }: { orderId: string; statusUpdate: { status: string; riderId?: string; estimatedDeliveryTime?: Date; notes?: string } }) => 
            orderService.updateOrderStatus(orderId, statusUpdate),
        onSuccess: (data) => {
            // Update the specific order in cache
            queryClient.setQueryData(['order', data.id], data);
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => 
            orderService.cancelOrder(orderId, reason),
        onSuccess: (data) => {
            // Update the specific order in cache
            queryClient.setQueryData(['order', data.id], data);
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};
