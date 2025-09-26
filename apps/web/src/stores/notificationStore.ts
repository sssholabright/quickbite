import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand';

export interface Notification {
    id: string;
    type: 'order' | 'delivery' | 'payment' | 'system';
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    actions?: Array<{
        label: string;
        action: string;
        data?: any;
    }>;
    timestamp: string;
    read: boolean;
    expiresAt?: string;
}


interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isPermissionGranted: boolean;
    
    // Actions
    addNotification: (notification: Notification) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    removeNotification: (notificationId: string) => void;
    clearAll: () => void;
    setPermissionGranted: (granted: boolean) => void;
    
    // Getters
    getUnreadNotifications: () => Notification[];
    getNotificationsByType: (type: Notification['type']) => Notification[];
    hasUnreadNotifications: () => boolean;
}


export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isPermissionGranted: false,

            addNotification: (notification) => {
                console.log('🔔 Store: Adding notification:', notification);
                console.log('🔔 Store: Notification ID:', notification.id);
                console.log('🔔 Store: Notification read status:', notification.read);
                
                set((state) => {
                    // Check if notification already exists
                    const exists = state.notifications.find((n) => n.id === notification.id);
                    if (exists) {
                        console.log('⚠️ Store: Notification already exists, skipping');
                        return state;
                    }
            
                    // Check if notification has expired
                    if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
                        console.log('⚠️ Store: Notification expired, skipping');
                        return state;
                    }
            
                    // Add to beginning of array and limit to 50 notifications
                    const newNotifications = [notification, ...state.notifications].slice(0, 50);
                    
                    console.log('✅ Store: Notification added successfully');
                    console.log('🔔 Store: Total notifications:', newNotifications.length);
                    console.log('🔔 Store: Unread count:', state.unreadCount + 1);
                    
                    return {
                        notifications: newNotifications,
                        unreadCount: state.unreadCount + 1,
                    }
                })
            },
            
            markAsRead: (notificationId) => {
                set((state) => {
                    const notification = state.notifications.find(n => n.id === notificationId);
                    if (!notification || notification.read) return state;

                    return {
                        notifications: state.notifications.map(n =>
                            n.id === notificationId ? { ...n, read: true } : n
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1)
                    };
                });
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map(n => ({ ...n, read: true })),
                    unreadCount: 0
                }));
            },

            removeNotification: (notificationId) => {
                set((state) => {
                    const notification = state.notifications.find(n => n.id === notificationId);
                    const wasUnread = notification && !notification.read;
                    
                    return {
                        notifications: state.notifications.filter(n => n.id !== notificationId),
                        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
                    };
                });
            },

            clearAll: () => {
                set({ notifications: [], unreadCount: 0 });
            },

            setPermissionGranted: (granted) => {
                set({ isPermissionGranted: granted });
            },

            // Getters
            getUnreadNotifications: () => {
                return get().notifications.filter(n => !n.read);
            },

            getNotificationsByType: (type) => {
                return get().notifications.filter(n => n.type === type);
            },

            hasUnreadNotifications: () => {
                return get().unreadCount > 0;
            }
        }),
        {
            name: 'notification-store',
            partialize: (state) => ({
                notifications: state.notifications.slice(0, 20), // persist only last 20 notifications
                unreadCount: state.unreadCount,
                isPermissionGranted: state.isPermissionGranted,
            }),
            version: 1,
            storage: createJSONStorage(() => localStorage),
        }
    )
)