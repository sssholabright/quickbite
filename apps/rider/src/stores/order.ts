import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RiderAvailableOrder } from '../types/order';

interface OrderState {
    // Current active order
    activeOrder: RiderAvailableOrder | null;
    orderStatus: 'going_to_pickup' | 'picked_up' | 'delivering' | 'delivered';
    
    // Actions
    setActiveOrder: (order: RiderAvailableOrder | null) => void;
    setOrderStatus: (status: 'going_to_pickup' | 'picked_up' | 'delivering' | 'delivered') => void;
    clearActiveOrder: () => void;
    
    // Getters
    hasActiveOrder: () => boolean;
    canReceiveNewOrders: () => boolean;
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            // Initial state
            activeOrder: null,
            orderStatus: 'going_to_pickup',
            
            // Set active order
            setActiveOrder: (order) => {
                console.log('📦 Setting active order:', order?.id || 'null');
                set({ activeOrder: order });
            },
            
            // Set order status
            setOrderStatus: (status) => {
                console.log('📋 Setting order status:', status);
                set({ orderStatus: status });
            },
            
            // Clear active order
            clearActiveOrder: () => {
                console.log('🗑️ Clearing active order');
                set({ 
                    activeOrder: null, 
                    orderStatus: 'going_to_pickup' 
                });
            },
            
            // Check if has active order
            hasActiveOrder: () => {
                return get().activeOrder !== null;
            },
            
            // Check if can receive new orders
            canReceiveNewOrders: () => {
                const { activeOrder, orderStatus } = get();
                // Can only receive new orders if no active order or current order is delivered
                return !activeOrder || orderStatus === 'delivered';
            },
        }),
        {
            name: 'rider-order-storage',
            // Only persist active order and status
            partialize: (state) => ({
                activeOrder: state.activeOrder,
                orderStatus: state.orderStatus,
            }),
        }
    )
);