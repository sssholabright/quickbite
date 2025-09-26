import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Update the notification handler to force show notifications:
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        console.log('📱 Handling notification:', notification);
        
        // Force show notification even when app is in foreground
        return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        };
    },
});

export interface NotificationData {
    title: string;
    body: string;
    data?: any;
}

class NotificationService {
    private expoPushToken: string | null = null;

    // Initialize the notification service and request permissions
    async initialize(): Promise<string | null> {
        try {
            console.log('🔔 Initializing notifications...');
            
            // Check current permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            console.log('📱 Current notification status:', existingStatus);
            
            let finalStatus = existingStatus;

            // If denied, try to request again with more context
            if (existingStatus === 'denied') {
                console.log('📱 Notifications were denied, requesting again...');
                
                // Request with more specific permissions
                const { status } = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                        allowDisplayInCarPlay: true,
                        allowCriticalAlerts: false,
                        provideAppNotificationSettings: false,
                        allowProvisional: false,
                    },
                });
                
                finalStatus = status;
                console.log('📱 Permission request result:', status);
            }

            if (finalStatus !== 'granted') {
                console.log('❌ Notification permission denied');
                console.log('💡 Please enable notifications in device settings');
                return null;
            }

            console.log('✅ Notification permission granted');

            // Get push token
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: 'e2bfe484-e58e-4529-9507-61a89a1c5936',
            });

            this.expoPushToken = token.data;
            console.log('📱 Expo push token:', this.expoPushToken);

            // Configure Android notification channel
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default Channel',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF4500",
                    sound: 'default',
                    enableVibrate: true,
                    enableLights: true,
                });
                console.log('✅ Android notification channel configured');
            }

            return this.expoPushToken;
        } catch (error) {
            console.error('Error initializing notification service:', error);
            return null;
        }
    }

    // Get the current push token
    getPushToken(): string | null {
        return this.expoPushToken;
    }

    // Schedule a local notification
    async scheduleLocalNotification(notification: NotificationData): Promise<string> {
        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.title,
                    body: notification.body,
                    data: notification.data || {},
                    sound: 'default',
                },
                trigger: null,
            });

            return notificationId;
        } catch (error) {
            console.error('Error scheduling local notification:', error);
            throw error;
        }
    }

    // Cancel a scheduled notification
    async cancelNotification(notificationId: string): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
            console.error('Error canceling notification:', error);
            throw error;
        }
    }

    // Cancel all scheduled notifications
    async cancelAllNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Error canceling all notifications:', error);
            throw error;
        }
    }

    // Add notification listener
    addNotificationListener(listener: (notification: Notifications.Notification) => void) {
        return Notifications.addNotificationReceivedListener(listener);
    }

    // Add notification response listener (when user taps notification)
    addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
        return Notifications.addNotificationResponseReceivedListener(listener);
    }

    // Remove notification listener
    removeNotificationListener(subscription: Notifications.Subscription) {
        subscription.remove();
    } 

    // Get notification permissionstatus
    async getPermissionStatus(): Promise<Notifications.NotificationPermissionsStatus> {
        return await Notifications.getPermissionsAsync();
    }

    //  Request notification permissions
    async requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
        return await Notifications.requestPermissionsAsync();
    }

    // Add this method to test push notifications:
    async testPushNotification(): Promise<void> {
        try {
            console.log('🧪 Testing push notification...');
            
            const pushToken = this.getPushToken();
            if (!pushToken) {
                console.log('❌ No push token available');
                return;
            }

            console.log('📱 Sending to token:', pushToken);

            // Send a test push notification via Expo's API
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: pushToken,
                    title: '🧪 Test Push Notification',
                    body: 'This is a test push notification from QuickBite Rider',
                    data: { 
                        test: true, 
                        timestamp: new Date().toISOString(),
                        type: 'test_push'
                    },
                    sound: 'default',
                    badge: 1,
                    priority: 'high',
                    channelId: 'default'
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Push notification sent:', result);
                
                // Check if there were any errors
                if (result.data && result.data[0]) {
                    const receipt = result.data[0];
                    if (receipt.status === 'error') {
                        console.log('❌ Push notification error:', receipt.message);
                    } else {
                        console.log('✅ Push notification delivered successfully');
                    }
                }
            } else {
                const errorText = await response.text();
                console.log('❌ Push notification failed:', errorText);
            }
        } catch (error) {
            console.error('❌ Error testing push notification:', error);
        }
    }

    // Add this method to check notification status
    async checkNotificationStatus(): Promise<void> {
        try {
            const permissions = await Notifications.getPermissionsAsync();
            console.log('📱 Current notification permissions:', permissions);
            
            if (permissions.status === 'granted') {
                console.log('✅ Notifications are enabled');
            } else if (permissions.status === 'denied') {
                console.log('❌ Notifications are disabled');
            } else {
                console.log('⚠️ Notification status unknown:', permissions.status);
            }
        } catch (error) {
            console.error('Error checking notification status:', error);
        }
    }
}
  
export default new NotificationService();