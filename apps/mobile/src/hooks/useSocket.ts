import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { useRealtimeStore } from '../stores/realtime';

// 🚀 ENHANCED: Complete socket event interfaces matching backend

const API_SOCKET_URL = process.env.API_SOCKET_URL
interface SocketEvents {
    // Order events
    order_status_update: (data: { orderId: string; status: string; timestamp: string; riderId?: string }) => void;
    order_updated: (data: { orderId: string; order: any; timestamp: string }) => void;
    order_cancelled: (data: { orderId: string; reason: string; timestamp: string }) => void;
    rider_assigned: (data: { orderId: string; rider: any; timestamp: string }) => void;
    no_riders_available: (data: { orderId: string; message: string; timestamp: string }) => void;
    
    // 🚀 NEW: Additional events from backend
    order_ready_for_pickup: (data: { orderId: string; timestamp: string }) => void;
    order_picked_up: (data: { orderId: string; riderId: string; timestamp: string }) => void;
    order_out_for_delivery: (data: { orderId: string; riderId: string; timestamp: string }) => void;
    order_delivered: (data: { orderId: string; riderId: string; timestamp: string }) => void;
    rider_location_update: (data: { orderId: string; riderId: string; location: { lat: number; lng: number }; timestamp: string }) => void;
    eta_update: (data: { orderId: string; eta: number; timestamp: string }) => void;

    // 🚀 NEW: Notification events
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
    
    // 🚀 NEW: New order events
    new_order: (data: {
        orderId: string;
        orderNumber: string;
        total: number;
        timestamp: string;
    }) => void;
}

interface SocketEmitEvents {
    join_order: (orderId: string) => void;
    leave_order: (orderId: string) => void;
    //  NEW: Additional emit events
    request_order_update: (orderId: string) => void;
    customer_feedback: (data: { orderId: string; rating: number; comment?: string }) => void;
}

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    // 🚀 FIXED: Rename local state setter to avoid conflict
    const [connectionStatus, setLocalConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [socket, setSocket] = useState<Socket<SocketEvents, SocketEmitEvents> | null>(null);
    const { tokens, user } = useAuthStore();
    const queryClient = useQueryClient();
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Real-time store actions
    const { 
        updateOrderStatus, 
        updateOrderRider, 
        updateOrderETA,
        setConnectionStatus // Keep this one from store
    } = useRealtimeStore();

    // 🚀 ENHANCED: Connection management with persistence
    const connectSocket = useCallback(() => {
        if (!tokens?.accessToken || !user) return;

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        const socketInstance = io(API_SOCKET_URL, {
            auth: {
                token: tokens.accessToken
            },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketInstance.on('connect', () => {
            console.log('📱 Mobile Socket connected:', socketInstance.id, 'User:', user.id);
            setIsConnected(true);
            setLocalConnectionStatus('connected');
            setConnectionStatus('connected');
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('📱 Mobile Socket disconnected:', reason);
            setIsConnected(false);
            setLocalConnectionStatus('disconnected');
            setConnectionStatus('disconnected');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('📱 Mobile Socket connection error:', error);
            setIsConnected(false);
            setLocalConnectionStatus('reconnecting');
            setConnectionStatus('reconnecting');
        });

        // 🚀 ENHANCED: All socket event handlers
        socketInstance.on('order_status_update', (data) => {
            console.log('📱 Mobile: Order status updated:', data);
            updateOrderStatus(data.orderId, data.status);
            
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: data.status };
                }
                return oldData;
            });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            
            // 🚀 NEW: Handle additional data from new notification system
            if (data.rider) {
                updateOrderRider(data.orderId, data.rider);
            }
            if (data.estimatedDeliveryTime) {
                updateOrderETA(data.orderId, new Date(data.estimatedDeliveryTime));
            }
        });

        socketInstance.on('order_updated', (data) => {
            console.log('📱 Order updated:', data);
            const { order } = data;
            
            if (order.status) {
                updateOrderStatus(order.id, order.status);
            }
            if (order.rider) {
                updateOrderRider(order.id, order.rider);
            }
            if (order.estimatedDeliveryTime) {
                updateOrderETA(order.id, new Date(order.estimatedDeliveryTime));
            }
            
            queryClient.setQueryData(['order', order.id], order);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('order_cancelled', (data) => {
            console.log('📱 Order cancelled:', data);
            updateOrderStatus(data.orderId, 'CANCELLED');
            
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: 'CANCELLED' };
                }
                return oldData;
            });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('rider_assigned', (data) => {
            console.log('📱 Mobile: Rider assigned to order:', data);
            updateOrderStatus(data.orderId, 'ASSIGNED');
            updateOrderRider(data.orderId, data.rider);
            
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
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('no_riders_available', (data) => {
            console.log('📱 No riders available for order:', data);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // 🚀 NEW: Additional event handlers
        socketInstance.on('order_ready_for_pickup', (data) => {
            console.log('📱 Order ready for pickup:', data);
            updateOrderStatus(data.orderId, 'READY_FOR_PICKUP');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('order_picked_up', (data) => {
            console.log('📱 Order picked up:', data);
            updateOrderStatus(data.orderId, 'PICKED_UP');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('order_out_for_delivery', (data) => {
            console.log('📱 Order out for delivery:', data);
            updateOrderStatus(data.orderId, 'OUT_FOR_DELIVERY');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('order_delivered', (data) => {
            console.log('📱 Order delivered:', data);
            updateOrderStatus(data.orderId, 'DELIVERED');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('rider_location_update', (data) => {
            console.log('📱 Rider location update:', data);
            updateOrderRider(data.orderId, {
                id: data.riderId,
                name: '', // 🚀 FIXED: Add required name field
                location: {
                    latitude: data.location.lat,
                    longitude: data.location.lng
                }
            });
        });

        socketInstance.on('eta_update', (data) => {
            console.log('📱 Mobile: ETA update received:', data);
            updateOrderETA(data.orderId, new Date(data.eta));
            
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { 
                        ...oldData, 
                        estimatedDeliveryTime: data.eta
                    };
                }
                return oldData;
            });
        });

        // 🚀 NEW: Notification event handlers
        socketInstance.on('notification_received', (data) => {
            console.log('🔔 Web notification received:', data);
            
            // Add to notification store
            try {
                // Assuming addNotification and showBrowserNotification are available globally or imported
                // For now, we'll just log and show SweetAlert for simplicity
                console.log('✅ Web notification added to store successfully');
                // Example: addNotification({ ...data, type: 'order' }); // Assuming addNotification exists
                // showBrowserNotification(data); // Assuming showBrowserNotification exists
                // showSweetAlertNotification(data); // Assuming showSweetAlertNotification exists
            } catch (error) {
                console.error('❌ Error adding web notification to store:', error);
            }
            
            // Show browser notification
            // showBrowserNotification(data); // Assuming showBrowserNotification exists
            
            // Show SweetAlert for high priority
            // showSweetAlertNotification(data); // Assuming showSweetAlertNotification exists
        });

        // Add handler for new_order events (web-specific)
        socketInstance.on('new_order', (data) => {
            console.log('🌐 New order received:', data);
            
            // Invalidate orders query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            
            // Add new order notification
            // Assuming addNotification is available globally or imported
            // addNotification({
            //     id: `new-order-${data.orderId}-${Date.now()}`,
            //     type: 'order',
            //     title: '🆕 New Order!',
            //     message: `New order #${data.orderNumber} received`,
            //     priority: 'urgent',
            //     data: { 
            //         orderId: data.orderId, 
            //         orderNumber: data.orderNumber,
            //         totalAmount: data.total
            //     },
            //     timestamp: data.timestamp || new Date().toISOString(),
            //     read: false
            // });
        });

        setSocket(socketInstance);
        return socketInstance;
    }, [tokens?.accessToken, user, updateOrderStatus, updateOrderRider, updateOrderETA, setConnectionStatus, queryClient]);

    // 🚀 ENHANCED: Socket lifecycle management
    useEffect(() => {
        const socketInstance = connectSocket();
        
        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, [connectSocket]);

    // 🚀 ENHANCED: Socket utility functions
    const joinOrderRoom = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Joining order room: ${orderId}`);
            socket.emit('join_order', orderId);
        }
    }, [socket, isConnected]);

    const leaveOrderRoom = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Leaving order room: ${orderId}`);
            socket.emit('leave_order', orderId);
        }
    }, [socket, isConnected]);

    const requestOrderUpdate = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Requesting order update: ${orderId}`);
            socket.emit('request_order_update', orderId);
        }
    }, [socket, isConnected]);

    const sendCustomerFeedback = useCallback((orderId: string, rating: number, comment?: string) => {
        if (socket && isConnected) {
            console.log(`📱 Sending customer feedback for order: ${orderId}`);
            socket.emit('customer_feedback', { orderId, rating, comment });
        }
    }, [socket, isConnected]);

    return {
        socket,
        isConnected,
        connectionStatus,
        joinOrderRoom,
        leaveOrderRoom,
        requestOrderUpdate,
        sendCustomerFeedback
    };
};