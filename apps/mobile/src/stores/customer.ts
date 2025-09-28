import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import customerService from '../services/customerService';
import notificationService from '../services/notificationService';

interface CustomerState {
    pushToken: string | null;
    notificationsEnabled: boolean;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    initializeNotifications: () => Promise<void>;
    sendTestNotification: () => Promise<void>;
    updatePushToken: (token: string) => Promise<void>;
    checkNotificationStatus: () => Promise<string>;
    debugNotifications: () => Promise<void>;
}

export const useCustomerStore = create<CustomerState>()(
    persist(
        (set, get) => ({
            pushToken: null,
            notificationsEnabled: false,
            isLoading: false,
            error: null,

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
                        await customerService.updatePushToken(token);
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
                        title: '🧪 Local Test',
                        body: 'This is a local notification test',
                        data: { type: 'local_test' }
                    });
                    
                    // Test push notification
                    await notificationService.testPushNotification();
                    
                } catch (error) {
                    console.error('❌ Error sending test notifications:', error);
                }
            },

            updatePushToken: async (token: string) => {
                try {
                    set({ isLoading: true, error: null });
                    
                    await customerService.updatePushToken(token);
                    
                    set({ 
                        pushToken: token,
                        isLoading: false 
                    });
                    
                    console.log('✅ Push token updated successfully');
                } catch (error: any) {
                    set({ 
                        error: error.message || 'Failed to update push token',
                        isLoading: false 
                    });
                    throw error;
                }
            },

            checkNotificationStatus: async () => {
                try {
                    const permissions = await notificationService.getPermissionStatus();
                    console.log('📱 Current notification permissions:', permissions);
                    
                    if (permissions.status === 'granted') {
                        console.log('✅ Notifications are enabled');
                    } else if (permissions.status === 'denied') {
                        console.log('❌ Notifications are disabled');
                    } else {
                        console.log('⚠️ Notification status unknown:', permissions.status);
                    }
                    
                    return permissions.status;
                } catch (error) {
                    console.error('Error checking notification status:', error);
                    return 'unknown';
                }
            },

            debugNotifications: async () => {
                try {
                    const permissions = await notificationService.getPermissionStatus();
                    console.log('📱 Notification permissions:', permissions);
                    
                    const token = notificationService.getPushToken();
                    console.log('📱 Push token:', token);
                    
                    // Test local notification
                    await notificationService.scheduleLocalNotification({
                        title: '🧪 Debug Test',
                        body: 'Testing notification system',
                        data: { type: 'debug_test' }
                    });
                    
                    console.log('✅ Debug notifications sent');
                } catch (error) {
                    console.error('❌ Debug error:', error);
                }
            },
        }),
        {
            name: 'customer-notification-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ 
                pushToken: state.pushToken,
                notificationsEnabled: state.notificationsEnabled
            }),
            onRehydrateStorage: () => (state) => {
                console.log('💾 Rehydrating customer store:', state);
            },
        }
    )
);
