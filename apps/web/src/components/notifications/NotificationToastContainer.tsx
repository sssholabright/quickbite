import React, { useEffect, useState, useRef } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import NotificationToast from './NotificationToast';

const NotificationToastContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotificationStore();
    const [activeToasts, setActiveToasts] = useState<string[]>([]);
    const processedNotifications = useRef<Set<string>>(new Set());

    useEffect(() => {
        console.log('🔔 Toast Container: Notifications changed:', notifications.length);
        console.log('🔔 Toast Container: All notifications:', notifications);
        
        // Show new notifications as toasts
        const unreadNotifications = notifications.filter(n => !n.read);
        console.log('🔔 Toast Container: Unread notifications:', unreadNotifications.length);
        console.log('🔔 Toast Container: Unread notifications:', unreadNotifications);
        
        const newNotificationIds = unreadNotifications
            .map(n => n.id)
            .filter(id => !activeToasts.includes(id) && !processedNotifications.current.has(id));
    
        console.log('🔔 Toast Container: New notification IDs:', newNotificationIds);
        console.log('🔔 Toast Container: Active toasts:', activeToasts);
    
        if (newNotificationIds.length > 0) {
            // Mark as processed
            newNotificationIds.forEach(id => processedNotifications.current.add(id));
            
            // Add to active toasts
            setActiveToasts(prev => {
                const newToasts = [...prev, ...newNotificationIds];
                console.log('🔔 Toast Container: Setting active toasts:', newToasts);
                return newToasts;
            });
        }
    }, [notifications]);

    const handleToastClose = (notificationId: string) => {
        setActiveToasts(prev => prev.filter(id => id !== notificationId));
        removeNotification(notificationId);
        
        // Remove from processed set when closed
        processedNotifications.current.delete(notificationId);
    };

    const handleToastAction = (action: string, data?: any) => {
        console.log('Toast action:', action, data);
        // Handle actions here
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {activeToasts.map((notificationId, index) => {
                const notification = notifications.find(n => n.id === notificationId);
                if (!notification) return null;

                return (
                    <div
                        key={`toast-${notificationId}-${index}`} // More unique key
                        style={{ transform: `translateY(${index * 10}px)` }}
                    >
                        <NotificationToast
                            notification={notification}
                            onClose={() => handleToastClose(notificationId)}
                            onAction={handleToastAction}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default NotificationToastContainer;