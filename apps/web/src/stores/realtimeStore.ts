import { create } from 'zustand';

// 🚀 CORRECT: Only client-only state
interface RealtimeState {
    // Socket connection state
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    
    // UI flags
    isOrderTracking: boolean;
    lastUpdateTime: number;
    
    // Actions
    setConnectionStatus: (status: RealtimeState['connectionStatus']) => void;
    setOrderTracking: (isTracking: boolean) => void;
    setLastUpdateTime: (time: number) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
    // Initial state
    connectionStatus: 'disconnected',
    isOrderTracking: false,
    lastUpdateTime: 0,
    
    // Actions
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setOrderTracking: (isTracking) => set({ isOrderTracking: isTracking }),
    setLastUpdateTime: (time) => set({ lastUpdateTime: time }),
}));
