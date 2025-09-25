import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import riderService from '../services/riderService';

interface RiderState {
    isOnline: boolean;
    isLoading: boolean;
    error: string | null;
    socket: any;
    
    // Actions
    setOnlineStatus: (isOnline: boolean) => Promise<void>;
    toggleOnlineStatus: () => Promise<void>;
    
    // 🚀 NEW: Socket reference for emitting events
    setSocket: (socket: any) => void;
}

export const useRiderStore = create<RiderState>()(
    persist(
        (set, get) => ({
            isOnline: false,
            isLoading: false,
            error: null,
            socket: null,

            setOnlineStatus: async (isOnline: boolean) => {
                try {
                    set({ isLoading: true, error: null });
                    
                    console.log(`🔄 Updating rider online status to: ${isOnline}`);
                    
                    await riderService.updateRiderStatus({ isOnline });
                    
                    console.log(`✅ Database updated, rider online: ${isOnline}`);
                    
                    // 🚀 NEW: Emit socket event
                    const { socket } = get();
                    if (socket) {
                        socket.emit('rider_status_change', { 
                            isOnline, 
                            isAvailable: true
                        });
                        console.log(`📡 Emitted rider_status_change: isOnline=${isOnline}`);
                    } else {
                        console.error('❌ Socket is null, cannot emit rider_status_change');
                    }
                    
                    set({ 
                        isOnline,
                        isLoading: false 
                    });
                    
                    console.log(`💾 State after setOnlineStatus:`, get().isOnline);
                } catch (error: any) {
                    set({ 
                        error: error.message || 'Failed to update online status',
                        isLoading: false 
                    });
                    throw error;
                }
            },

            toggleOnlineStatus: async () => {
                const { isOnline } = get();
                console.log(`🔄 Toggling from ${isOnline} to ${!isOnline}`);
                await get().setOnlineStatus(!isOnline);
            },

            setSocket: (socket) => set({ socket }),
        }),
        {
            name: 'rider-status-storage',
            storage: createJSONStorage(() => AsyncStorage), // 🚀 FIX: Use AsyncStorage
            partialize: (state) => ({ isOnline: state.isOnline }),
            onRehydrateStorage: () => (state) => {
                console.log('💾 Rehydrating rider store:', state);
            },
        }
    )
);