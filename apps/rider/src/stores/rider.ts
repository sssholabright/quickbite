import { create } from 'zustand';
import riderService from '../services/riderService';

interface RiderState {
    isOnline: boolean;
    isAvailable: boolean;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setOnlineStatus: (isOnline: boolean) => Promise<void>;
    setAvailability: (isAvailable: boolean) => Promise<void>;
    toggleOnlineStatus: () => Promise<void>;
    updateRiderStatus: (data: { isOnline?: boolean; isAvailable?: boolean }) => Promise<void>;
}

export const useRiderStore = create<RiderState>((set, get) => ({
    isOnline: false,
    isAvailable: false,
    isLoading: false,
    error: null,

    setOnlineStatus: async (isOnline: boolean) => {
        try {
            set({ isLoading: true, error: null });
            
            await riderService.updateRiderStatus({ isOnline });
            
            set({ 
                isOnline,
                isLoading: false 
            });
        } catch (error: any) {
            set({ 
                error: error.message || 'Failed to update online status',
                isLoading: false 
            });
            throw error;
        }
    },

    setAvailability: async (isAvailable: boolean) => {
        try {
            set({ isLoading: true, error: null });
            
            await riderService.updateRiderStatus({ isAvailable });
            
            set({ 
                isAvailable,
                isLoading: false 
            });
        } catch (error: any) {
            set({ 
                error: error.message || 'Failed to update availability',
                isLoading: false 
            });
            throw error;
        }
    },

    toggleOnlineStatus: async () => {
        const { isOnline } = get();
        await get().setOnlineStatus(!isOnline);
    },

    updateRiderStatus: async (data: { isOnline?: boolean; isAvailable?: boolean }) => {
        try {
            set({ isLoading: true, error: null });
            
            await riderService.updateRiderStatus(data);
            
            set({ 
                ...data,
                isLoading: false 
            });
        } catch (error: any) {
            set({ 
                error: error.message || 'Failed to update rider status',
                isLoading: false 
            });
            throw error;
        }
    },
}));
