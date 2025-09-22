import { useMemo } from 'react';
import { useOrders } from './useOrders';
import { useRealtimeStore } from '../stores/realtimeStore';
import { OrderFilters } from '../types/order';

export const useEnhancedOrders = (filters?: OrderFilters) => {
    const { data: ordersData, isLoading, error, refetch } = useOrders(filters);
    const { orderUpdates } = useRealtimeStore();
    
    const enhancedOrders = useMemo(() => {
        if (!ordersData?.orders) return [];
        
        return ordersData.orders.map(order => {
            const realtimeUpdate = orderUpdates[order.id];
            
            if (!realtimeUpdate) {
                return { ...order, isRealtime: false };
            }
            
            return {
                ...order,
                ...(realtimeUpdate.status && { status: realtimeUpdate.status }),
                ...(realtimeUpdate.rider && { rider: realtimeUpdate.rider }),
                ...(realtimeUpdate.estimatedDeliveryTime && { 
                    estimatedDeliveryTime: realtimeUpdate.estimatedDeliveryTime 
                }),
                isRealtime: true,
                lastUpdated: realtimeUpdate.timestamp,
            };
        });
    }, [ordersData?.orders, orderUpdates]);
    
    return {
        data: ordersData ? { ...ordersData, orders: enhancedOrders } : undefined,
        isLoading,
        error,
        refetch,
    };
};
