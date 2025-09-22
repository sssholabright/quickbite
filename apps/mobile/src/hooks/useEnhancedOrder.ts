import { useMemo } from 'react';
import { useOrder } from './useOrders';
import { useRealtimeStore } from '../stores/realtime';
import { OrderResponse } from '../types/order';

// Enhanced order that combines React Query cache with real-time updates
export interface EnhancedOrder extends Omit<OrderResponse, 'rider'> {
    // Real-time flags
    isRealtime?: boolean;
    lastUpdated?: number;
    // Enhanced rider with optional real-time data
    rider?: {
        id: string;
        name: string;
        phone: string;
        vehicleType: string;
        // Real-time additions
        location?: {
            latitude: number;
            longitude: number;
        };
        eta?: number;
    };
}

export const useEnhancedOrder = (orderId: string) => {
    const { data: cachedOrder, isLoading, error } = useOrder(orderId);
    const { getOrderUpdate, hasUpdate } = useRealtimeStore();
    
    const enhancedOrder: EnhancedOrder | undefined = useMemo(() => {
        if (!cachedOrder) return undefined;
        
        const realtimeUpdate = getOrderUpdate(orderId);
        
        if (!realtimeUpdate) {
            return {
                ...cachedOrder,
                isRealtime: false,
            };
        }
        
        // Merge cached data with real-time updates
        return {
            ...cachedOrder,
            // Override with real-time data if available
            ...(realtimeUpdate.status && { status: realtimeUpdate.status }),
            ...(realtimeUpdate.rider && cachedOrder.rider && { 
                rider: {
                    // Keep required properties from cache
                    // name: cachedOrder.rider.name,
                    phone: cachedOrder.rider.phone,
                    vehicleType: cachedOrder.rider.vehicleType,
                    // Add real-time properties
                    ...realtimeUpdate.rider
                }
            }),
            ...(realtimeUpdate.estimatedDeliveryTime && { 
                estimatedDeliveryTime: realtimeUpdate.estimatedDeliveryTime 
            }),
            // Real-time metadata
            isRealtime: true,
            lastUpdated: realtimeUpdate.timestamp,
        };
    }, [cachedOrder, getOrderUpdate, orderId]);
    
    return {
        data: enhancedOrder,
        isLoading,
        error,
        hasRealtimeUpdate: hasUpdate(orderId),
    };
};
