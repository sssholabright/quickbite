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
        updateOrderStatus, 
        updateOrderRider, 
        updateOrderETA,
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
            
            // Update real-time store
            updateOrderStatus(data.orderId, data.status);
            
            // Update React Query cache
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: data.status };
                }
                return oldData;
            });
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            // Add notification for status changes
            addNotification({
                id: `order-status-${data.orderId}-${Date.now()}`,
                type: 'order',
                title: 'Order Status Updated',
                message: `Order status changed to ${data.status}`,
                priority: 'normal',
                data: { orderId: data.orderId, status: data.status },
                timestamp: data.timestamp || new Date().toISOString(),
                read: false
            });
        });

        socketInstance.on('order_updated', (data) => {
            console.log('🌐 Order updated:', data);
            
            const { order } = data;
            
            // Update real-time store with relevant data
            if (order.status) {
                updateOrderStatus(order.id, order.status);
            }
            if (order.rider) {
                updateOrderRider(order.id, order.rider);
            }
            if (order.estimatedDeliveryTime) {
                updateOrderETA(order.id, new Date(order.estimatedDeliveryTime));
            }
            
            // Update React Query cache with full order data
            queryClient.setQueryData(['order', order.id], order);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('order_cancelled', (data) => {
            console.log('🌐 Order cancelled:', data);
            
            // Update status to cancelled
            updateOrderStatus(data.orderId, 'CANCELLED');
            
            // Update cache
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: 'CANCELLED' };
                }
                return oldData;
            });
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            // Add cancellation notification
            addNotification({
                id: `order-cancelled-${data.orderId}-${Date.now()}`,
                type: 'order',
                title: 'Order Cancelled',
                message: data.reason || 'Your order has been cancelled',
                priority: 'high',
                data: { orderId: data.orderId, reason: data.reason },
                timestamp: data.timestamp || new Date().toISOString(),
                read: false
            });
        });

        // Handle rider assignment with enhanced notification
        socketInstance.on('rider_assigned', (data) => {
            console.log('🌐 Rider assigned to order:', data);
            
            // Update order status to ASSIGNED
            updateOrderStatus(data.orderId, 'ASSIGNED');
            
            // Update rider info
            updateOrderRider(data.orderId, data.rider);
            
            // Update React Query cache
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { 
                        ...oldData, 
                        status: 'ASSIGNED',
                        rider: data.rider
                    };
                }
                return oldData;
            });
            
            // Enhanced notification with actions
            const notification = {
                id: `rider-assigned-${data.orderId}-${Date.now()}`,
                type: 'delivery' as const,
                title: 'Rider Assigned!',
                message: `${data.rider.name} has been assigned to your order`,
                priority: 'high' as const,
                data: { orderId: data.orderId, rider: data.rider },
                actions: [
                    { label: 'Track Order', action: 'view_order', data: { orderId: data.orderId } },
                    { label: 'Contact Rider', action: 'contact_rider', data: { riderId: data.rider.id } }
                ],
                timestamp: data.timestamp || new Date().toISOString(),
                read: false
            };

            addNotification(notification);
            showBrowserNotification(notification);
            showSweetAlertNotification(notification);
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // Handle no riders available with notification
        socketInstance.on('no_riders_available', (data) => {
            console.log('🌐 No riders available for order:', data);
            
            // Add notification
            addNotification({
                id: `no-riders-${data.orderId}-${Date.now()}`,
                type: 'delivery',
                title: 'No Riders Available',
                message: data.message,
                priority: 'normal',
                data: { orderId: data.orderId },
                timestamp: data.timestamp || new Date().toISOString(),
                read: false
            });

            // Show SweetAlert for this important message
            Swal.fire({
                title: 'No Riders Available',
                text: data.message,
                icon: 'warning',
                timer: 5000,
                showConfirmButton: true
            });
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // Handle delivery updates
        socketInstance.on('delivery_update', (data) => {
            console.log('🌐 Delivery update:', data);
            
            // Update rider info
            updateOrderRider(data.orderId, data.rider);
            
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

        // NEW: Handle notification events
        socketInstance.on('notification_received', (data) => {
            console.log('🔔 Notification received:', data);
            console.log('🔔 Notification data type:', typeof data);
            console.log('🔔 Notification timestamp:', data.timestamp);
            console.log('🔔 Notification read status:', data.read);
            
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
    }, [user, updateOrderStatus, updateOrderRider, updateOrderETA, setConnectionStatus, queryClient, addNotification, markAsRead, requestNotificationPermission, showBrowserNotification, showSweetAlertNotification]);

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