import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrderService } from '../services/orderService'
import { OrderFilters } from '../types/order'

// Query keys
export const orderKeys = {
    all: ['orders'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
    details: () => [...orderKeys.all, 'detail'] as const,
    detail: (id: string) => [...orderKeys.details(), id] as const,
    stats: () => [...orderKeys.all, 'stats'] as const,
}

// Get orders with filters
export const useOrders = (filters?: OrderFilters) => {
    return useQuery({
        queryKey: orderKeys.list(filters || {}),
        queryFn: () => OrderService.getOrders(filters),
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchInterval: 30000, // Auto-refresh every 30 seconds
    })
}

// Get order by ID
export const useOrder = (orderId: string) => {
    return useQuery({
        queryKey: orderKeys.detail(orderId),
        queryFn: () => OrderService.getOrderById(orderId),
        enabled: !!orderId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    })
}

// Get order statistics
export const useOrderStats = () => {
    return useQuery({
        queryKey: orderKeys.stats(),
        queryFn: () => OrderService.getOrderStats(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: 30000, // Auto-refresh every 30 seconds
    })
}

// Update order status mutation
export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ orderId, statusUpdate }: { 
            orderId: string
            statusUpdate: {
                status: string
                riderId?: string
                estimatedDeliveryTime?: Date
                notes?: string
            }
        }) => OrderService.updateOrderStatus(orderId, statusUpdate),
        onSuccess: (data) => {
            // Update the specific order in cache
            queryClient.setQueryData(orderKeys.detail(data.id), data)
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: orderKeys.stats() })
        },
    })
}

// Cancel order mutation
export const useCancelOrder = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => 
            OrderService.cancelOrder(orderId, reason),
        onSuccess: (data) => {
            // Update the specific order in cache
            queryClient.setQueryData(orderKeys.detail(data.id), data)
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: orderKeys.stats() })
        },
    })
}
