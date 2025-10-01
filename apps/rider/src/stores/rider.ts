import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import riderService from '../services/riderService';
import notificationService from '../services/notificationService';

interface RiderState {
    isOnline: boolean;
    isLoading: boolean;
    error: string | null;
    pushToken: string | null;
    notificationsEnabled: boolean;
    
    // Actions
    setOnlineStatus: (isOnline: boolean) => Promise<void>;
    updateRiderStatus: (data: { isOnline?: boolean; isAvailable?: boolean }) => Promise<void>; // 🚀 NEW
    toggleOnlineStatus: () => Promise<void>;
    initializeNotifications: () => Promise<void>;
    sendTestNotification: () => Promise<void>;
    
    // 🚀 NEW: Socket reference for emitting events
    // ❌ REMOVE: setSocket: (socket: any) => void;
}

export const useRiderStore = create<RiderState>()(
    persist(
        (set, get) => ({
            isOnline: false,
            isLoading: false,
            error: null,
            // ❌ REMOVE: socket: null,
            pushToken: null,
            notificationsEnabled: false,

            setOnlineStatus: async (isOnline: boolean) => {
                try {
                    set({ isLoading: true, error: null });
                    
                    console.log(`🔄 Updating rider online status to: ${isOnline}`);
                    
                    await riderService.updateRiderStatus({ isOnline });
                    
                    console.log(`✅ Database updated, rider online: ${isOnline}`);
                    
                    // ✅ Get socket from context instead of state
                    // This will be handled by the socket context
                    
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

            updateRiderStatus: async (data: { isOnline?: boolean; isAvailable?: boolean }) => {
                try {
                    set({ isLoading: true, error: null });
                    
                    console.log(`🔄 Updating rider status:`, data);
                    
                    await riderService.updateRiderStatus(data);
                    
                    console.log(`✅ Database updated, rider status:`, data);
                    
                    // 🚀 FIXED: Remove socket emission since socket is not in store
                    // Socket events will be handled by the useSocket hook
                    
                    set({ 
                        ...(data.isOnline !== undefined && { isOnline: data.isOnline }),
                        isLoading: false 
                    });
                    
                    console.log(`💾 State after updateRiderStatus:`, get().isOnline);
                } catch (error: any) {
                    set({ 
                        error: error.message || 'Failed to update rider status',
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

            initializeNotifications: async () => {
                try {
                    console.log('🔔 Initializing notifications...');
                    const token = await notificationService.initialize();
                    
                    if (token) {
                        set({ 
                            pushToken: token, 
                            notificationsEnabled: true 
                        });
                        
                        // Send token to backend
                        await riderService.updatePushToken(token);
                        console.log('✅ Push token sent to backend');
                    } else {
                        set({ notificationsEnabled: false });
                        console.log('❌ Failed to get push token');
                    }
                } catch (error: any) {
                    console.error('Error initializing notifications:', error);
                    set({ 
                        error: error.message,
                        notificationsEnabled: false 
                    });
                }
            },

            sendTestNotification: async () => {
                try {
                    console.log('🧪 Sending test notifications...');
                    
                    // Test local notification
                    await notificationService.scheduleLocalNotification({
                        title: ' Local Test',
                        body: 'This is a local notification test',
                        data: { type: 'local_test' }
                    });
                    
                    // Test push notification
                    await notificationService.testPushNotification();
                    
                } catch (error) {
                    console.error('❌ Error sending test notifications:', error);
                }
            },

            // ❌ REMOVE: setSocket: (socket) => set({ socket }),
        }),
        {
            name: 'rider-status-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ 
                isOnline: state.isOnline,
                pushToken: state.pushToken,
                notificationsEnabled: state.notificationsEnabled
            }),
            onRehydrateStorage: () => (state) => {
                console.log('💾 Rehydrating rider store:', state);
            },
        }
    )
);