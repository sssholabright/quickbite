import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { useRealtimeStore } from '../stores/realtime';

const API_SOCKET_URL = process.env.EXPO_PUBLIC_API_SOCKET_URL

interface SocketEvents {
    // Order events
    order_status_update: (data: { orderId: string; status: string; timestamp: string; riderId?: string }) => void;
    order_updated: (data: { orderId: string; order: any; timestamp: string }) => void;
    order_cancelled: (data: { orderId: string; reason: string; timestamp: string }) => void;
    rider_assigned: (data: { orderId: string; rider: any; timestamp: string }) => void;
    no_riders_available: (data: { orderId: string; message: string; timestamp: string }) => void;
    
    // Additional events from backend
    order_ready_for_pickup: (data: { orderId: string; timestamp: string }) => void;
    order_picked_up: (data: { orderId: string; riderId: string; timestamp: string }) => void;
    order_out_for_delivery: (data: { orderId: string; riderId: string; timestamp: string }) => void;
    order_delivered: (data: { orderId: string; riderId: string; timestamp: string }) => void;
    rider_location_update: (data: { orderId: string; riderId: string; location: { lat: number; lng: number }; timestamp: string }) => void;
    eta_update: (data: { orderId: string; eta: number; timestamp: string }) => void;

    // Notification events
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
    
    // New order events
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
    request_order_update: (orderId: string) => void;
    customer_feedback: (data: { orderId: string; rating: number; comment?: string }) => void;
}

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [socket, setSocket] = useState<Socket<SocketEvents, SocketEmitEvents> | null>(null);
    const { tokens, user, refreshToken } = useAuthStore();
    const queryClient = useQueryClient();
    
    // Real-time store actions
    const { 
        updateOrderStatus, 
        updateOrderRider, 
        updateOrderETA,
        setConnectionStatus: setStoreConnectionStatus
    } = useRealtimeStore();

    const socketInstanceRef = useRef<Socket | null>(null);
    const socketCreationInProgress = useRef(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // 🚀 FIXED: Get valid token with refresh capability
    const getValidToken = useCallback(async (): Promise<string | null> => {
        try {
            if (!tokens?.accessToken) {
                console.log('❌ No access token available');
                return null;
            }

            // Simple token check - just verify it exists and isn't empty
            if (tokens.accessToken.length < 10) {
                console.log('🔄 Token seems invalid, refreshing...');
                await refreshToken();
                const newTokens = useAuthStore.getState().tokens;
                return newTokens?.accessToken || null;
            }
            
            return tokens.accessToken;
        } catch (error) {
            console.error('❌ Failed to get valid token:', error);
            return null;
        }
    }, [tokens?.accessToken, refreshToken]);

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
            console.log('🔑 Starting mobile socket creation process...');
            
            const token = await getValidToken();
            if (!token) {
                console.log('❌ No valid token available');
                return null;
            }

            console.log('🔑 Creating mobile socket connection...');
            
            const socketInstance = io(API_SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                forceNew: true
            });

            console.log('📡 Mobile socket instance created');
            
            // Set up listeners immediately
            setupSocketListeners(socketInstance);
            
            console.log('✅ Mobile socket instance created successfully');
            return socketInstance;
        } catch (error) {
            console.error('❌ Failed to create mobile socket:', error);
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
        console.log(`🔄 Mobile reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        
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

    // 🚀 FIXED: Clean listener setup
    const setupSocketListeners = useCallback((socketInstance: Socket) => {
        console.log('🔧 Setting up mobile socket listeners for socket:', socketInstance.id);

        // Add the catch-all event listener first
        socketInstance.onAny((eventName, ...args) => {
            console.log(`🔍 Mobile received event: ${eventName}`, args);
        });

        // Connection handler
        socketInstance.on('connect', () => {
            console.log('📱 Mobile Socket connected:', socketInstance.id, 'User:', user?.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            setStoreConnectionStatus('connected');
            reconnectAttempts.current = 0;
        });

        // Disconnect handler
        socketInstance.on('disconnect', (reason) => {
            console.log('📱 Mobile Socket disconnected:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
            setStoreConnectionStatus('disconnected');
            
            // Only attempt reconnection if it's not a manual disconnect
            if (reason !== 'io client disconnect') {
                console.log('🔄 Attempting mobile reconnection...');
                attemptReconnection();
            }
        });

        // Connection error handler
        socketInstance.on('connect_error', (error) => {
            console.error('📱 Mobile Socket connection error:', error);
            setIsConnected(false);
            setConnectionStatus('reconnecting');
            setStoreConnectionStatus('reconnecting');
            
            // If it's an auth error, try to refresh token
            if (error.message.includes('Authentication') || error.message.includes('token')) {
                console.log('🔄 Auth error detected, attempting token refresh...');
                getValidToken().then(() => {
                    attemptReconnection();
                });
            } else {
                attemptReconnection();
            }
        });

        // Reconnection handler
        socketInstance.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Mobile reconnection attempt ${attemptNumber}`);
            setConnectionStatus('reconnecting');
            setStoreConnectionStatus('reconnecting');
        });

        // Order status update handler
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
            
            // Handle additional data from notification system
            if (data.rider) {
                updateOrderRider(data.orderId, data.rider);
            }
            if (data.estimatedDeliveryTime) {
                updateOrderETA(data.orderId, new Date(data.estimatedDeliveryTime));
            }
        });

        // Order updated handler
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

        // Order cancelled handler
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

        // Rider assigned handler
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

        // No riders available handler
        socketInstance.on('no_riders_available', (data) => {
            console.log('📱 No riders available for order:', data);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // Additional event handlers
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
                name: '',
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

        // Notification event handlers
        socketInstance.on('notification_received', (data) => {
            console.log('🔔 Mobile notification received:', data);
            // Handle notification logic here
        });

        socketInstance.on('new_order', (data) => {
            console.log('📱 New order received:', data);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        console.log('✅ Mobile socket listeners setup complete');
    }, [user, updateOrderStatus, updateOrderRider, updateOrderETA, setStoreConnectionStatus, queryClient, getValidToken, attemptReconnection]);

    // 🚀 FIXED: Main effect with proper cleanup - REMOVE createSocketConnection from dependencies
    useEffect(() => {
        let mounted = true;

        const initializeSocket = async () => {
            console.log('🔍 Socket initialization check:', {
                user: !!user,
                tokens: !!tokens,
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
                    console.log('🚀 Attempting to create socket connection...');
                    const socketInstance = await createSocketConnection();
                    if (socketInstance && mounted) {
                        console.log('✅ Socket created and set successfully');
                        setSocket(socketInstance);
                        socketInstanceRef.current = socketInstance;
                    } else {
                        console.log('❌ Socket creation failed or component unmounted');
                    }
                } catch (error) {
                    console.error('❌ Failed to create mobile socket:', error);
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

    // Socket utility functions
    const joinOrderRoom = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Joining order room: ${orderId}`);
            socket.emit('join_order', orderId);
        } else {
            console.warn('⚠️ Cannot join order room: socket not connected');
        }
    }, [socket, isConnected]);

    const leaveOrderRoom = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Leaving order room: ${orderId}`);
            socket.emit('leave_order', orderId);
        } else {
            console.warn('⚠️ Cannot leave order room: socket not connected');
        }
    }, [socket, isConnected]);

    const requestOrderUpdate = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Requesting order update: ${orderId}`);
            socket.emit('request_order_update', orderId);
        } else {
            console.warn('⚠️ Cannot request order update: socket not connected');
        }
    }, [socket, isConnected]);

    const sendCustomerFeedback = useCallback((orderId: string, rating: number, comment?: string) => {
        if (socket && isConnected) {
            console.log(`📱 Sending customer feedback for order: ${orderId}`);
            socket.emit('customer_feedback', { orderId, rating, comment });
        } else {
            console.warn('⚠️ Cannot send customer feedback: socket not connected');
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