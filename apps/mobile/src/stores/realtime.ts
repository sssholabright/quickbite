import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚀 ENHANCED: Real-time overlay data with persistence
export interface RealtimeOrderUpdate {
    orderId: string;
    status?: string;
    timestamp: number;
    rider?: {
        id: string;
        name: string;
        phone?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
        eta?: number; // minutes
    };
    estimatedDeliveryTime?: Date;
    // 🚀 NEW: Additional fields
    lastLocationUpdate?: number;
    isTracking?: boolean;
}

interface RealtimeState {
    // Real-time overlays for instant updates
    orderUpdates: Record<string, RealtimeOrderUpdate>;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    lastUpdateTime: number;
    // 🚀 NEW: Additional state
    isOnline: boolean;
    lastConnectionTime: number;
    
    // Actions
    updateOrderStatus: (orderId: string, status: string) => void;
    updateOrderRider: (orderId: string, rider: RealtimeOrderUpdate['rider']) => void;
    updateOrderETA: (orderId: string, estimatedDeliveryTime: Date) => void;
    setConnectionStatus: (status: RealtimeState['connectionStatus']) => void;
    clearOrderUpdate: (orderId: string) => void;
    clearAllUpdates: () => void;
    // 🚀 NEW: Additional actions
    setOnlineStatus: (isOnline: boolean) => void;
    updateRiderLocation: (orderId: string, location: { latitude: number; longitude: number }) => void;
    setTrackingStatus: (orderId: string, isTracking: boolean) => void;
    
    // Getters
    getOrderUpdate: (orderId: string) => RealtimeOrderUpdate | null;
    hasUpdate: (orderId: string) => boolean;
    // 🚀 NEW: Additional getters
    getTrackingOrders: () => string[];
    isOrderTracking: (orderId: string) => boolean;
}

export const useRealtimeStore = create<RealtimeState>()(
    persist(
        (set, get) => ({
            // Initial state
            orderUpdates: {},
            connectionStatus: 'disconnected',
            lastUpdateTime: 0,
            isOnline: false,
            lastConnectionTime: 0,
            
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
            setConnectionStatus: (status) => set({ 
                connectionStatus: status,
                isOnline: status === 'connected',
                lastConnectionTime: status === 'connected' ? Date.now() : get().lastConnectionTime
            }),
            
            // 🚀 NEW: Set online status
            setOnlineStatus: (isOnline) => set({ 
                isOnline,
                lastConnectionTime: isOnline ? Date.now() : get().lastConnectionTime
            }),
            
            // 🚀 NEW: Update rider location
            updateRiderLocation: (orderId, location) => set((state) => ({
                orderUpdates: {
                    ...state.orderUpdates,
                    [orderId]: {
                        ...state.orderUpdates[orderId],
                        orderId,
                        rider: state.orderUpdates[orderId]?.rider ? {
                            ...state.orderUpdates[orderId].rider,
                            location,
                        } : {
                            id: '', // 🚀 FIXED: Provide default id
                            name: '',
                            location,
                        },
                        lastLocationUpdate: Date.now(),
                        timestamp: Date.now(),
                    }
                },
                lastUpdateTime: Date.now(),
            })),
            
            // 🚀 NEW: Set tracking status
            setTrackingStatus: (orderId, isTracking) => set((state) => ({
                orderUpdates: {
                    ...state.orderUpdates,
                    [orderId]: {
                        ...state.orderUpdates[orderId],
                        orderId,
                        isTracking,
                        timestamp: Date.now(),
                    }
                },
                lastUpdateTime: Date.now(),
            })),
            
            // Clear specific order update
            clearOrderUpdate: (orderId) => set((state) => {
                const { [orderId]: removed, ...rest } = state.orderUpdates;
                return { orderUpdates: rest };
            }),
            
            // Clear all updates
            clearAllUpdates: () => set({ 
                orderUpdates: {}, 
                lastUpdateTime: Date.now() 
            }),
            
            // Get order update
            getOrderUpdate: (orderId) => {
                const update = get().orderUpdates[orderId];
                return update || null;
            },
            
            // Check if order has real-time update
            hasUpdate: (orderId) => {
                return orderId in get().orderUpdates;
            },
            
            // 🚀 NEW: Get tracking orders
            getTrackingOrders: () => {
                const updates = get().orderUpdates;
                return Object.keys(updates).filter(orderId => updates[orderId].isTracking);
            },
            
            // 🚀 NEW: Check if order is being tracked
            isOrderTracking: (orderId) => {
                const update = get().orderUpdates[orderId];
                return update?.isTracking || false;
            },
        }),
        {
            name: 'mobile-realtime-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Only persist essential data
                isOnline: state.isOnline,
                lastConnectionTime: state.lastConnectionTime,
            }),
        }
    )
);
