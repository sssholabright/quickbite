import { create } from 'zustand';

// Real-time overlay data (ephemeral, not persisted)
export interface RealtimeOrderUpdate {
    orderId: string;
    status?: string;
    timestamp: number;
    rider?: {
        id: string;
        name: string;
        location?: {
            latitude: number;
            longitude: number;
        };
        eta?: number; // minutes
    };
    estimatedDeliveryTime?: Date;
}

interface RealtimeState {
    // Real-time overlays for instant updates
    orderUpdates: Record<string, RealtimeOrderUpdate>;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    lastUpdateTime: number;
    
    // Actions
    updateOrderStatus: (orderId: string, status: string) => void;
    updateOrderRider: (orderId: string, rider: RealtimeOrderUpdate['rider']) => void;
    updateOrderETA: (orderId: string, estimatedDeliveryTime: Date) => void;
    setConnectionStatus: (status: RealtimeState['connectionStatus']) => void;
    clearOrderUpdate: (orderId: string) => void;
    clearAllUpdates: () => void;
    
    // Getters
    getOrderUpdate: (orderId: string) => RealtimeOrderUpdate | null;
    hasUpdate: (orderId: string) => boolean;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
    // Initial state
    orderUpdates: {},
    connectionStatus: 'disconnected',
    lastUpdateTime: 0,
    
    // Update order status
    updateOrderStatus: (orderId, status) => set((state) => ({
        orderUpdates: {
            ...state.orderUpdates,
            [orderId]: {
                ...state.orderUpdates[orderId],
                orderId,
                status,
                timestamp: Date.now(),
            }
        },
        lastUpdateTime: Date.now(),
    })),
    
    // Update rider info
    updateOrderRider: (orderId, rider) => set((state) => ({
        orderUpdates: {
            ...state.orderUpdates,
            [orderId]: {
                ...state.orderUpdates[orderId],
                orderId,
                rider,
                timestamp: Date.now(),
            }
        },
        lastUpdateTime: Date.now(),
    })),
    
    // Update ETA
    updateOrderETA: (orderId, estimatedDeliveryTime) => set((state) => ({
        orderUpdates: {
            ...state.orderUpdates,
            [orderId]: {
                ...state.orderUpdates[orderId],
                orderId,
                estimatedDeliveryTime,
                timestamp: Date.now(),
            }
        },
        lastUpdateTime: Date.now(),
    })),
    
    // Set connection status
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    
    // Clear specific order update
    clearOrderUpdate: (orderId) => set((state) => {
        const { [orderId]: removed, ...rest } = state.orderUpdates;
        return { orderUpdates: rest };
    }),
    
    // Clear all updates
    clearAllUpdates: () => set({ orderUpdates: {}, lastUpdateTime: Date.now() }),
    
    // Get order update
    getOrderUpdate: (orderId) => {
        const update = get().orderUpdates[orderId];
        return update || null;
    },
    
    // Check if order has real-time update
    hasUpdate: (orderId) => {
        return orderId in get().orderUpdates;
    },
}));
