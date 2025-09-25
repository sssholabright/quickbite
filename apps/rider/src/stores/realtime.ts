import { create } from 'zustand';

// Delivery job data structure
export interface DeliveryJob {
    orderId: string;
    vendor: {
        id: string;
        name: string;
        address: string;
        lat: number;
        lng: number;
    };
    customer: {
        id: string;
        name: string;
        phone: string;
        address: string;
        lat: number;
        lng: number;
    };
    deliveryAddress: any;
    deliveryFee: number;
    estimatedDistance: number;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    createdAt: string;
    expiresIn: number; // seconds
}

// Real-time order update
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
    // Delivery jobs (incoming orders)
    deliveryJobs: Record<string, DeliveryJob>;
    
    // Real-time overlays for instant updates
    orderUpdates: Record<string, RealtimeOrderUpdate>;
    
    // Connection status
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    lastUpdateTime: number;
    
    // Actions
    addDeliveryJob: (job: DeliveryJob) => void;
    removeDeliveryJob: (orderId: string) => void;
    updateOrderStatus: (orderId: string, status: string) => void;
    updateOrderRider: (orderId: string, rider: RealtimeOrderUpdate['rider']) => void;
    updateOrderETA: (orderId: string, estimatedDeliveryTime: Date) => void;
    setConnectionStatus: (status: RealtimeState['connectionStatus']) => void;
    clearOrderUpdate: (orderId: string) => void;
    clearAllUpdates: () => void;
    
    // Getters
    getDeliveryJob: (orderId: string) => DeliveryJob | null;
    getOrderUpdate: (orderId: string) => RealtimeOrderUpdate | null;
    hasDeliveryJob: (orderId: string) => boolean;
    hasUpdate: (orderId: string) => boolean;
    getActiveDeliveryJobs: () => DeliveryJob[];
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
    // Initial state
    deliveryJobs: {},
    orderUpdates: {},
    connectionStatus: 'disconnected',
    lastUpdateTime: 0,
    
    // Add delivery job with deduplication
    addDeliveryJob: (job) => {
        console.log('🔄 Adding delivery job to store:', job);
        console.log('🔄 Current jobs before add:', Object.keys(get().deliveryJobs));
        
        // 🚀 NEW: Check if job already exists
        if (get().deliveryJobs[job.orderId]) {
            console.log('⚠️ Job already exists, skipping duplicate:', job.orderId);
            return;
        }
        
        set((state) => ({
            deliveryJobs: {
                ...state.deliveryJobs,
                [job.orderId]: job
            },
            lastUpdateTime: Date.now(),
        }));
        
        console.log('✅ Delivery job added to store');
        console.log('✅ Current jobs after add:', Object.keys(get().deliveryJobs));
        console.log('✅ Active delivery jobs:', get().getActiveDeliveryJobs().length);
    },
    
    // Remove delivery job
    removeDeliveryJob: (orderId) => {
        console.log('🗑️ removeDeliveryJob called with orderId:', orderId);
        console.log('🗑️ Current jobs before removal:', Object.keys(get().deliveryJobs));
        
        set((state) => {
            const { [orderId]: removed, ...rest } = state.deliveryJobs;
            console.log('🗑️ Removed job:', removed);
            console.log('🗑️ Remaining jobs:', Object.keys(rest));
            return { 
                deliveryJobs: rest,
                lastUpdateTime: Date.now()
            };
        });
        
        console.log('🗑️ Jobs after removal:', Object.keys(get().deliveryJobs));
        console.log('🗑️ Active delivery jobs after removal:', get().getActiveDeliveryJobs().length);
    },
    
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
    clearAllUpdates: () => set({ 
        deliveryJobs: {}, 
        orderUpdates: {}, 
        lastUpdateTime: Date.now() 
    }),
    
    // Get delivery job
    getDeliveryJob: (orderId) => {
        const job = get().deliveryJobs[orderId];
        return job || null;
    },
    
    // Get order update
    getOrderUpdate: (orderId) => {
        const update = get().orderUpdates[orderId];
        return update || null;
    },
    
    // Check if delivery job exists
    hasDeliveryJob: (orderId) => {
        return orderId in get().deliveryJobs;
    },
    
    // Check if order has real-time update
    hasUpdate: (orderId) => {
        return orderId in get().orderUpdates;
    },
    
    // Get all active delivery jobs
    getActiveDeliveryJobs: () => {
        const jobs = Object.values(get().deliveryJobs);
        return jobs.filter(job => {
            // Filter out expired jobs (if needed)
            const createdAt = new Date(job.createdAt);
            const now = new Date();
            const timeDiff = (now.getTime() - createdAt.getTime()) / 1000; // seconds
            return timeDiff < job.expiresIn;
        });
    },
}));