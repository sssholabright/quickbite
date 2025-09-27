import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import riderService from '../services/riderService';
import notificationService from '../services/notificationService';

interface RiderState {
    isOnline: boolean;
    isLoading: boolean;
    error: string | null;
    socket: any;
    pushToken: string | null;
    notificationsEnabled: boolean;
    
    // Actions
    setOnlineStatus: (isOnline: boolean) => Promise<void>;
    updateRiderStatus: (data: { isOnline?: boolean; isAvailable?: boolean }) => Promise<void>; // 🚀 NEW
    toggleOnlineStatus: () => Promise<void>;
    initializeNotifications: () => Promise<void>;
    sendTestNotification: () => Promise<void>;
    
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
            pushToken: null,
            notificationsEnabled: false,

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

            updateRiderStatus: async (data: { isOnline?: boolean; isAvailable?: boolean }) => {
                try {
                    set({ isLoading: true, error: null });
                    
                    console.log(`🔄 Updating rider status:`, data);
                    
                    await riderService.updateRiderStatus(data);
                    
                    console.log(`✅ Database updated, rider status:`, data);
                    
                    // 🚀 NEW: Emit socket event
                    const { socket } = get();
                    if (socket) {
                        socket.emit('rider_status_change', { 
                            isOnline: data.isOnline !== undefined ? data.isOnline : get().isOnline,
                            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true
                        });
                        console.log(`📡 Emitted rider_status_change:`, data);
                    } else {
                        console.error('❌ Socket is null, cannot emit rider_status_change');
                    }
                    
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

            setSocket: (socket) => set({ socket }),
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