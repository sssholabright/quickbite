import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useRealtimeStore } from '../stores/realtimeStore';
import { useNotificationStore } from '../stores/notificationStore';
import Swal from 'sweetalert2';

// Enhanced Socket event interfaces
interface SocketEvents {
    order_status_update: (data: { orderId: string; status: string; timestamp: string }) => void;
    order_updated: (data: { orderId: string; order: any; timestamp: string }) => void;
    order_cancelled: (data: { orderId: string; reason: string; timestamp: string }) => void;
    rider_assigned: (data: { orderId: string; rider: any; timestamp: string }) => void;
    no_riders_available: (data: { orderId: string; message: string; timestamp: string }) => void;
    delivery_update: (data: { orderId: string; rider: any; timestamp: string }) => void;
    
    // NEW: Notification events
    notification_received: (data: {
        id: string;
        type: 'order' | 'delivery' | 'payment' | 'system';
        title: string;
        message: string;
        data?: any;
        priority: 'low' | 'normal' | 'high' | 'urgent';
        actions?: Array<{ label: string; action: string; data?: any }>;
        timestamp: string;
        read: boolean;
        expiresAt?: string;
    }) => void;
    notification_read: (data: { notificationId: string; timestamp: string }) => void;
}

interface SocketEmitEvents {
    join_order: (orderId: string) => void;
    leave_order: (orderId: string) => void;
    typing_start: (data: { orderId: string; userName: string }) => void;
    typing_stop: (data: { orderId: string; userName: string }) => void;
    
    // NEW: Notification emit events
    mark_notification_read: (notificationId: string) => void;
}

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket<SocketEvents, SocketEmitEvents> | null>(null);
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    
    // Real-time store actions
    const { 
        setConnectionStatus 
    } = useRealtimeStore();

    // Notification store actions
    const { 
        addNotification, 
        markAsRead, 
        setPermissionGranted 
    } = useNotificationStore();

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setPermissionGranted(permission === 'granted');
            return permission === 'granted';
        }
        return false;
    }, [setPermissionGranted]);

    // Show browser notification
    const showBrowserNotification = useCallback((notification: any) => {
        if (Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.png',
                tag: notification.id,
                data: notification
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };
        }
    }, []);

    // Show SweetAlert notification for high priority
    const showSweetAlertNotification = useCallback((notification: any) => {
        if (notification.priority === 'high' || notification.priority === 'urgent') {
            Swal.fire({
                title: notification.title,
                text: notification.message,
                icon: notification.priority === 'urgent' ? 'error' : 'warning',
                timer: notification.priority === 'urgent' ? 0 : 5000,
                showConfirmButton: notification.priority === 'urgent',
                confirmButtonText: 'OK'
            });
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        // Request notification permission on first load
        requestNotificationPermission();

        const socketInstance = io(import.meta.env.VITE_SOCKET_API_URL || 'http://localhost:5000', {
            auth: {
                token: accessToken
            },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('🌐 Web Socket connected:', socketInstance.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            
            // 🚀 DEBUG: Listen for ALL socket events
            socketInstance.onAny((eventName, ...args) => {
                console.log('🔍 Socket event received:', eventName, args);
            });
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('🌐 Web Socket disconnected:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('🌐 Web Socket connection error:', error);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        // Enhanced WebSocket event handlers with notifications
        socketInstance.on('order_status_update', (data) => {
            console.log('🌐 Order status updated:', data);
            
            // 🚀 FIXED: Invalidate ALL orders queries (including filtered ones)
            queryClient.invalidateQueries({ 
                queryKey: ['orders'],
                exact: false // This will invalidate all queries that start with ['orders']
            });
            
            // Also update individual order cache if it exists
            queryClient.setQueryData(['orders', 'detail', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: data.status };
                }
                return oldData;
            });

            // 🚀 FIXED: Only show notifications for important status changes
            const importantStatuses = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
            
            if (importantStatuses.includes(data.status)) {
                // Add notification with delay
                setTimeout(() => {
                    addNotification({
                        id: `order-status-${data.orderId}-${data.status}-${Date.now()}`,
                        type: 'order',
                        title: 'Order Status Updated',
                        message: `Order status changed to ${data.status}`,
                        priority: 'normal',
                        data: { orderId: data.orderId, status: data.status },
                        timestamp: data.timestamp || new Date().toISOString(),
                        read: false
                    });
                }, 1000);
            }
        });

        // 🚀 FIXED: Remove duplicate notification from order_updated
        socketInstance.on('order_updated', (data) => {
            console.log('🌐 Order updated:', data);
            
            const { order } = data;
            
            // 🚀 FIXED: Invalidate ALL orders queries
            queryClient.invalidateQueries({ 
                queryKey: ['orders'],
                exact: false // This will invalidate all queries that start with ['orders']
            });
            
            // Also update individual order cache
            queryClient.setQueryData(['orders', 'detail', order.id], order);
            
            // 🚀 REMOVED: No notification here - only in order_status_update
        });

        // 🚀 REMOVED: order_cancelled handler - handled by order_status_update
        // socketInstance.on('order_cancelled', ...) - REMOVE THIS ENTIRE BLOCK

        // 🚀 REMOVED: rider_assigned handler - handled by order_status_update
        // socketInstance.on('rider_assigned', ...) - REMOVE THIS ENTIRE BLOCK

        // Handle no riders available with batched notification
        socketInstance.on('no_riders_available', (data) => {
            console.log('🌐 No riders available for orders:', data);
            
            // 🚀 NEW: Handle both single order and batched notifications
            const orderIds = data.orderIds || [data.orderId];
            const orderCount = orderIds.length;
            
            // Add single notification for all orders
            addNotification({
                id: `no-riders-${orderIds.join('-')}-${Date.now()}`,
                type: 'delivery',
                title: 'No Riders Available',
                message: data.message,
                priority: 'normal',
                data: { orderIds: orderIds },
                timestamp: data.timestamp || new Date().toISOString(),
                read: false
            });

            // Show SweetAlert only once for all orders
            if (orderCount > 1) {
                Swal.fire({
                    title: 'No Riders Available',
                    text: `No riders are currently available for ${orderCount} orders. They will be broadcast when riders come online.`,
                    icon: 'warning',
                    timer: 5000,
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    title: 'No Riders Available',
                    text: data.message,
                    icon: 'warning',
                    timer: 5000,
                    showConfirmButton: true
                });
            }
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // Handle delivery updates
        socketInstance.on('delivery_update', (data) => {
            console.log('🌐 Delivery update:', data);
            
            // Update React Query cache
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, rider: data.rider };
                }
                return oldData;
            });
        });

        // socketInstance.on('new_order', (data) => {
        //     console.log('🌐 New order received:', data);
            
        //     // Invalidate orders query to refresh the list
        //     queryClient.invalidateQueries({ queryKey: ['orders'] });
            
        //     // Add new order notification
        //     addNotification({
        //         id: `new-order-${data.order.id}-${Date.now()}`,
        //         type: 'order',
        //         title: 'New Order Received',
        //         message: `Order ${data.order.orderNumber} has been placed with a total of $${data.order.total}`,
        //         priority: 'high',
        //         data: { 
        //             orderId: data.order.id, 
        //             orderNumber: data.order.orderNumber,
        //             totalAmount: data.order.total
        //         },
        //         timestamp: data.timestamp || new Date().toISOString(),
        //         read: false
        //     });
        // });

        // 🚀 NEW: Handle notification events
        socketInstance.on('notification_received', (data) => {
            console.log('🔔 Notification received:', data);
            
            // Add to notification store
            try {
                addNotification(data);
                console.log('✅ Notification added to store successfully');
            } catch (error) {
                console.error('❌ Error adding notification to store:', error);
            }
            
            // Show browser notification
            showBrowserNotification(data);
            
            // Show SweetAlert for high priority
            showSweetAlertNotification(data);
        });

        socketInstance.on('notification_read', (data) => {
            console.log('🔔 Notification marked as read:', data);
            markAsRead(data.notificationId);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setConnectionStatus('disconnected');
        };
    }, [user, setConnectionStatus, queryClient, addNotification, markAsRead, requestNotificationPermission, showBrowserNotification, showSweetAlertNotification]);

    const joinOrderRoom = (orderId: string) => {
        if (socket && isConnected) {
            console.log(`🌐 Joining order room: ${orderId}`);
            socket.emit('join_order', orderId);
        }
    };

    const leaveOrderRoom = (orderId: string) => {
        if (socket && isConnected) {
            console.log(`🌐 Leaving order room: ${orderId}`);
            socket.emit('leave_order', orderId);
        }
    };

    const startTyping = (orderId: string, userName: string) => {
        if (socket && isConnected) {
            socket.emit('typing_start', { orderId, userName });
        }
    };

    const stopTyping = (orderId: string, userName: string) => {
        if (socket && isConnected) {
            socket.emit('typing_stop', { orderId, userName });
        }
    };

    // NEW: Notification actions
    const markNotificationRead = (notificationId: string) => {
        if (socket && isConnected) {
            socket.emit('mark_notification_read', notificationId);
        }
        markAsRead(notificationId);
    };

    return {
        socket,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom,
        startTyping,
        stopTyping,
        markNotificationRead
    };
};