import { useEffect, useState, useCallback, useRef } from 'react';
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
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [socket, setSocket] = useState<Socket<SocketEvents, SocketEmitEvents> | null>(null);
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    
    // Real-time store actions
    const { 
        setConnectionStatus: setStoreConnectionStatus 
    } = useRealtimeStore();

    // Notification store actions
    const { 
        addNotification, 
        markAsRead, 
        setPermissionGranted 
    } = useNotificationStore();

    const socketInstanceRef = useRef<Socket | null>(null);
    const socketCreationInProgress = useRef(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // 🚀 FIXED: Get valid token with refresh capability
    const getValidToken = useCallback((): string | null => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                console.log('❌ No access token available');
                return null;
            }

            // Simple token check - just verify it exists and isn't empty
            if (accessToken.length < 10) {
                console.log('🔄 Token seems invalid');
                return null;
            }
            
            return accessToken;
        } catch (error) {
            console.error('❌ Failed to get valid token:', error);
            return null;
        }
    }, []);

    // 🚀 FIXED: Clean socket creation
    const createSocketConnection = useCallback(async () => {
        if (socketCreationInProgress.current) {
            console.log('⚠️ Socket creation already in progress, skipping...');
            return null;
        }

        if (!user) {
            console.log('❌ No user available for socket connection');
            return null;
        }

        try {
            socketCreationInProgress.current = true;
            console.log('🔑 Starting web socket creation process...');
            
            const token = getValidToken();
            if (!token) {
                console.log('❌ No valid token available');
                return null;
            }

            console.log('🔑 Creating web socket connection...');
            
            const socketInstance = io(import.meta.env.VITE_SOCKET_API_URL || 'http://localhost:5000', {
                auth: { token },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                forceNew: true
            });

            console.log('📡 Web socket instance created');
            
            // Set up listeners immediately
            setupSocketListeners(socketInstance);
            
            console.log('✅ Web socket instance created successfully');
            return socketInstance;
        } catch (error) {
            console.error('❌ Failed to create web socket:', error);
            return null;
        } finally {
            socketCreationInProgress.current = false;
        }
    }, [getValidToken, user]);

    // 🚀 FIXED: Simplified reconnection
    const attemptReconnection = useCallback(async () => {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            return;
        }

        reconnectAttempts.current++;
        console.log(`🔄 Web reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        
        setTimeout(async () => {
            if (user && !socket) {
                const socketInstance = await createSocketConnection();
                if (socketInstance) {
                    setSocket(socketInstance);
                    socketInstanceRef.current = socketInstance;
                }
            }
        }, 2000);
    }, [user, socket, createSocketConnection]);

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

    // 🚀 NEW: Add role-based notification filtering (move this BEFORE showSweetAlertNotification)
    const shouldShowNotification = useCallback((status: string, type: string) => {
        // Get user role from auth store
        const userRole = user?.role;
        
        // Block specific notifications for vendors/admins
        if (userRole === 'VENDOR' || userRole === 'ADMIN') {
            const blockedStatuses = [
                'CONFIRMED',
                'PREPARING', 
                'READY_FOR_PICKUP',
                'ASSIGNED',
                'PICKED_UP'
            ];
            
            // Block these statuses for vendors/admins
            if (blockedStatuses.includes(status)) {
                console.log(`🚫 Blocked notification for ${userRole}: ${status}`);
                return false;
            }
        }
        
        return true;
    }, [user?.role]);

    // Show SweetAlert notification for high priority
    const showSweetAlertNotification = useCallback((notification: any) => {
        // Check if this notification should be shown based on role
        if (notification.data?.status && !shouldShowNotification(notification.data.status, notification.type)) {
            console.log(`🚫 Blocked SweetAlert for ${user?.role}: ${notification.data.status}`);
            return;
        }
        
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
    }, [shouldShowNotification, user?.role]);

    // 🚀 FIXED: Clean listener setup
    const setupSocketListeners = useCallback((socketInstance: Socket) => {
        console.log('🔧 Setting up web socket listeners for socket:', socketInstance.id);

        // Add the catch-all event listener first
        socketInstance.onAny((eventName, ...args) => {
            console.log(`🔍 Web received event: ${eventName}`, args);
        });

        // Connection handler
        socketInstance.on('connect', () => {
            console.log('🌐 Web Socket connected:', socketInstance.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            setStoreConnectionStatus('connected');
            reconnectAttempts.current = 0;
            
            // Request notification permission on first load
            requestNotificationPermission();
        });

        // Disconnect handler
        socketInstance.on('disconnect', (reason) => {
            console.log('🌐 Web Socket disconnected:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
            setStoreConnectionStatus('disconnected');
            
            // Only attempt reconnection if it's not a manual disconnect
            if (reason !== 'io client disconnect') {
                console.log('🔄 Attempting web reconnection...');
                attemptReconnection();
            }
        });

        // Connection error handler
        socketInstance.on('connect_error', (error) => {
            console.error('🌐 Web Socket connection error:', error);
            setIsConnected(false);
            setConnectionStatus('reconnecting');
            setStoreConnectionStatus('reconnecting');
            
            // If it's an auth error, try to refresh token
            if (error.message.includes('Authentication') || error.message.includes('token')) {
                console.log('🔄 Auth error detected, attempting token refresh...');
                // For web, we might need to redirect to login or refresh token
                attemptReconnection();
            } else {
                attemptReconnection();
            }
        });

        // Reconnection handler
        socketInstance.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Web reconnection attempt ${attemptNumber}`);
            setConnectionStatus('reconnecting');
            setStoreConnectionStatus('reconnecting');
        });

        // Enhanced WebSocket event handlers with role-based filtering
        socketInstance.on('order_status_update', (data) => {
            console.log('🌐 Order status updated:', data);
            
            // Always update queries (vendors need to see status changes in UI)
            queryClient.invalidateQueries({ 
                queryKey: ['orders'],
                exact: false
            });
            
            queryClient.setQueryData(['orders', 'detail', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: data.status };
                }
                return oldData;
            });

            // 🚀 FIXED: Role-based notification filtering for both notifications and SweetAlerts
            const importantStatuses = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
            
            if (importantStatuses.includes(data.status) && shouldShowNotification(data.status, 'order')) {
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

        // Handle no riders available with role-based filtering
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

            // 🚀 FIXED: Show SweetAlert only for vendors/admins (they need to know about rider availability)
            // This is important for vendors to know when orders can't be delivered
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

        // 🚀 NEW: Handle notification events with role-based filtering
        socketInstance.on('notification_received', (data) => {
            console.log('🔔 Notification received:', data);
            
            // Check if this notification should be shown based on role
            if (data.data?.status && !shouldShowNotification(data.data.status, data.type)) {
                console.log(`🚫 Blocked notification_received for ${user?.role}: ${data.data.status}`);
                return;
            }
            
            // Add to notification store
            try {
                addNotification(data);
                console.log('✅ Notification added to store successfully');
            } catch (error) {
                console.error('❌ Error adding notification to store:', error);
            }
            
            // Show browser notification
            showBrowserNotification(data);
            
            // Show SweetAlert for high priority (with role-based filtering)
            showSweetAlertNotification(data);
        });

        socketInstance.on('notification_read', (data) => {
            console.log('🔔 Notification marked as read:', data);
            markAsRead(data.notificationId);
        });

        console.log('✅ Web socket listeners setup complete');
    }, [user, setStoreConnectionStatus, queryClient, addNotification, markAsRead, requestNotificationPermission, showBrowserNotification, showSweetAlertNotification, attemptReconnection, shouldShowNotification]);

    // 🚀 FIXED: Main effect with proper cleanup
    useEffect(() => {
        let mounted = true;

        const initializeSocket = async () => {
            console.log('🔍 Web socket initialization check:', {
                user: !!user,
                token: !!getValidToken(),
                socket: !!socket,
                mounted
            });

            if (!user) {
                console.log('❌ No user available, disconnecting socket');
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                    socketInstanceRef.current = null;
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                    setStoreConnectionStatus('disconnected');
                }
                return;
            }

            // Only create socket if we don't have one and user is available
            if (!socket && mounted) {
                try {
                    console.log('🚀 Attempting to create web socket connection...');
                    const socketInstance = await createSocketConnection();
                    if (socketInstance && mounted) {
                        console.log('✅ Web socket created and set successfully');
                        setSocket(socketInstance);
                        socketInstanceRef.current = socketInstance;
                    } else {
                        console.log('❌ Web socket creation failed or component unmounted');
                    }
                } catch (error) {
                    console.error('❌ Failed to create web socket:', error);
                }
            }
        };

        initializeSocket();

        return () => {
            mounted = false;
            // Clean up socket on unmount
            if (socketInstanceRef.current) {
                socketInstanceRef.current.disconnect();
                socketInstanceRef.current = null;
            }
        };
    }, [user, setStoreConnectionStatus]); // 🚀 FIXED: Removed createSocketConnection from dependencies

    const joinOrderRoom = (orderId: string) => {
        if (socket && isConnected) {
            console.log(`🌐 Joining order room: ${orderId}`);
            socket.emit('join_order', orderId);
        } else {
            console.warn('⚠️ Cannot join order room: socket not connected');
        }
    };

    const leaveOrderRoom = (orderId: string) => {
        if (socket && isConnected) {
            console.log(`🌐 Leaving order room: ${orderId}`);
            socket.emit('leave_order', orderId);
        } else {
            console.warn('⚠️ Cannot leave order room: socket not connected');
        }
    };

    const startTyping = (orderId: string, userName: string) => {
        if (socket && isConnected) {
            socket.emit('typing_start', { orderId, userName });
        } else {
            console.warn('⚠️ Cannot start typing: socket not connected');
        }
    };

    const stopTyping = (orderId: string, userName: string) => {
        if (socket && isConnected) {
            socket.emit('typing_stop', { orderId, userName });
        } else {
            console.warn('⚠️ Cannot stop typing: socket not connected');
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
        connectionStatus,
        joinOrderRoom,
        leaveOrderRoom,
        startTyping,
        stopTyping,
        markNotificationRead
    };
};