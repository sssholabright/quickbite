import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { useRiderStore } from '../stores/rider';
import { DeliveryJob, useRealtimeStore } from '../stores/realtime';

// Rider-specific Socket events
interface RiderSocketEvents {
    // Delivery job events - FIXED: Match backend structure
    new_delivery_job: (data: {
        orderId: string;
        vendorId: string;
        vendorName: string;
        customerId: string;
        customerName: string;
        pickupAddress: string;
        deliveryAddress: string;
        deliveryFee: number;
        distance: number;
        items: Array<{
            id: string;
            name: string;
            quantity: number;
            price: number;
        }>;
        expiresAt: Date;
        timer: number; // seconds
        retryCount: number;
    }) => void;
    
    // 🚀 NEW: Delivery job removal
    delivery_job_removed: (data: {
        orderId: string;
        reason: string;
        timestamp?: string;
    }) => void;
    
    // Order status updates
    order_status_update: (data: { 
        orderId: string; 
        status: string; 
        timestamp: string;
        riderId?: string;
    }) => void;
    
    // Order updates
    order_updated: (data: { 
        orderId: string; 
        order: any; 
        timestamp: string;
    }) => void;
    
    // Location update commands
    location_update_request: (data: {
        orderId: string;
        frequency: number; // seconds between updates
    }) => void;
    
    // ETA updates
    eta_update: (data: {
        orderId: string;
        eta: number; // minutes
        distance: number; // km
        estimatedArrival: string;
        riderLocation: {
            lat: number;
            lng: number;
        };
        timestamp: string;
    }) => void;
    
    // Order cancellation
    order_cancelled: (data: { 
        orderId: string; 
        reason: string;
        timestamp: string;
    }) => void;
}

// Events the rider can emit
interface RiderSocketEmitEvents {
    // Join/leave order rooms
    join_order: (orderId: string) => void;
    leave_order: (orderId: string) => void;
    
    // Location updates
    location_update: (data: {
        orderId: string;
        latitude: number;
        longitude: number;
        timestamp: string;
    }) => void;
    
    // Order actions
    order_picked_up: (orderId: string) => void;
    order_delivered: (orderId: string) => void;
}

// 🚀 CRITICAL FIX: Remove isOnline parameter to prevent socket recreation
export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [socket, setSocket] = useState<Socket | null>(null);
    
    const { tokens, refreshToken } = useAuthStore();
    const { isOnline } = useRiderStore(); // Get isOnline from store instead of parameter
    const { addDeliveryJob, removeDeliveryJob, updateOrderStatus, updateOrderRider, updateOrderETA } = useRealtimeStore();
    const queryClient = useQueryClient();
    
    const listenersAdded = useRef(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = useRef(1000); // Start with 1 second

    // 🚀 NEW: Get fresh token with refresh capability
    const getValidToken = useCallback(async (): Promise<string | null> => {
        try {
            if (!tokens?.accessToken) {
                console.log('❌ No access token available');
                return null;
            }

            // Try to use current token first
            try {
                // Simple validation - if token is malformed, it will fail
                const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);
                
                // If token expires in less than 5 minutes, refresh it
                if (payload.exp - now < 300) {
                    console.log('🔄 Token expires soon, refreshing...');
                    await refreshToken();
                    // Get the new token after refresh
                    const newTokens = useAuthStore.getState().tokens;
                    return newTokens?.accessToken || null;
                }
                
                return tokens.accessToken;
            } catch (error) {
                console.log('🔄 Token validation failed, refreshing...');
                await refreshToken();
                const newTokens = useAuthStore.getState().tokens;
                return newTokens?.accessToken || null;
            }
        } catch (error) {
            console.error('❌ Failed to get valid token:', error);
            return null;
        }
    }, [tokens?.accessToken, refreshToken]);

    // 🚀 IMPROVED: Create socket connection with retry logic
    const createSocketConnection = useCallback(async () => {
        try {
            const token = await getValidToken();
            if (!token) {
                console.log('❌ No valid token available for socket connection');
                return null;
            }

            console.log('🔑 Creating socket connection for rider...');
            
            const socketInstance = io('http://10.48.184.234:5000', {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: false, // We'll handle reconnection manually
                forceNew: true // Force new connection
            });

            return socketInstance;
        } catch (error) {
            console.error('❌ Failed to create socket connection:', error);
            return null;
        }
    }, [getValidToken]);

    // 🚀 IMPROVED: Reconnection logic with exponential backoff
    const attemptReconnection = useCallback(async () => {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            setConnectionStatus('disconnected');
            return;
        }

        reconnectAttempts.current++;
        setConnectionStatus('reconnecting');
        
        console.log(`🔄 Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        
        // Clear existing timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        // Exponential backoff delay
        const delay = Math.min(reconnectDelay.current * Math.pow(2, reconnectAttempts.current - 1), 30000);
        console.log(`⏳ Waiting ${delay}ms before reconnection...`);

        reconnectTimeoutRef.current = setTimeout(async () => {
            try {
                const newSocket = await createSocketConnection();
                if (newSocket) {
                    setupSocketListeners(newSocket);
                    setSocket(newSocket);
                    reconnectAttempts.current = 0; // Reset on successful connection
                    reconnectDelay.current = 1000; // Reset delay
                } else {
                    attemptReconnection();
                }
            } catch (error) {
                console.error('❌ Reconnection failed:', error);
                attemptReconnection();
            }
        }, delay);
    }, [createSocketConnection]);

    // �� IMPROVED: Setup socket listeners with better error handling
    const setupSocketListeners = useCallback((socketInstance: Socket) => {
        if (listenersAdded.current) {
            console.log('⚠️ Listeners already added, skipping...');
            return;
        }

        console.log('📡 Adding event listeners...');
        listenersAdded.current = true;

        socketInstance.on('connect', () => {
            console.log('🚀 Rider Socket connected:', socketInstance.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            reconnectAttempts.current = 0; // Reset on successful connection
            reconnectDelay.current = 1000; // Reset delay
            
            // 🚀 NEW: Emit rider_online event when connected
            const { user } = useAuthStore.getState();
            if (user?.id) {
                socketInstance.emit('rider_online', {
                    riderId: user.id,
                    isOnline: useRiderStore.getState().isOnline, // 🚀 Use current status instead of hardcoded true
                });
                console.log(`📡 Emitted rider_online event with status: ${useRiderStore.getState().isOnline}`);
            }
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('❌ Rider Socket disconnected:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
            
            // Only attempt reconnection if rider is online
            if (isOnline && reason !== 'io client disconnect') {
                attemptReconnection();
            }
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            setIsConnected(false);
            setConnectionStatus('disconnected');
            
            // If it's an auth error, try to refresh token
            if (error.message.includes('Authentication') || error.message.includes('token')) {
                console.log('🔄 Auth error detected, attempting token refresh...');
                getValidToken().then(() => {
                    attemptReconnection();
                });
            } else if (isOnline) {
                attemptReconnection();
            }
        });

        // 🚀 IMPROVED: Delivery job event with better error handling
        socketInstance.on('new_delivery_job', (data) => {
            try {
                console.log('📦 New delivery job received:', data);
                
                if (!data || !data.orderId) {
                    console.error('❌ Invalid delivery job data:', data);
                    return;
                }

                // Transform data to match frontend format
                const transformedJob: DeliveryJob = {
                    orderId: data.orderId,
                    vendor: {
                        id: data.vendorId,
                        name: data.vendorName,
                        address: data.pickupAddress || '',
                        lat: 0, // Will be updated from vendor location
                        lng: 0  // Will be updated from vendor location
                    },
                    customer: {
                        id: data.customerId,
                        name: data.customerName,
                        phone: '', // Will be updated from customer data
                        address: typeof data.deliveryAddress === 'string' 
                            ? JSON.parse(data.deliveryAddress).address 
                            : data.deliveryAddress?.address || '',
                        lat: typeof data.deliveryAddress === 'string'
                            ? JSON.parse(data.deliveryAddress).coordinates?.lat || 0
                            : data.deliveryAddress?.coordinates?.lat || 0,
                        lng: typeof data.deliveryAddress === 'string'
                            ? JSON.parse(data.deliveryAddress).coordinates?.lng || 0
                            : data.deliveryAddress?.coordinates?.lng || 0
                    },
                    deliveryAddress: typeof data.deliveryAddress === 'string' 
                        ? JSON.parse(data.deliveryAddress) 
                        : data.deliveryAddress,
                    deliveryFee: data.deliveryFee,
                    estimatedDistance: data.distance,
                    items: data.items,
                    createdAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : new Date().toISOString(),
                    expiresIn: data.timer
                };
                
                addDeliveryJob(transformedJob);
                console.log('✅ Delivery job added to store');
            } catch (error) {
                console.error('❌ Error processing delivery job:', error);
            }
        });

        // 🚀 IMPROVED: Delivery job removal with better error handling
        socketInstance.on('delivery_job_removed', (data) => {
            try {
                console.log('🗑️ Delivery job removed:', data);
                
                if (!data || !data.orderId) {
                    console.error('❌ Invalid delivery job removal data:', data);
                    return;
                }
                
                removeDeliveryJob(data.orderId);
                
                if (data.reason === 'accepted_by_another_rider') {
                    console.log(`📦 Order ${data.orderId} was accepted by another rider`);
                } else if (data.reason === 'already_assigned') {
                    console.log(`📦 Order ${data.orderId} was already assigned`);
                }
            } catch (error) {
                console.error('❌ Error processing delivery job removal:', error);
            }
        });

        // Handle order status updates
        socketInstance.on('order_status_update', (data) => {
            console.log('📋 Order status updated:', data);
            
            // Update real-time store
            updateOrderStatus(data.orderId, data.status);
            
            // Update React Query cache
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: data.status };
                }
                return oldData;
            });
            
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // Handle comprehensive order updates
        socketInstance.on('order_updated', (data) => {
            console.log('📋 Order updated:', data);
            
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
            
            // Update React Query cache
            queryClient.setQueryData(['order', order.id], order);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // 🚀 NEW: Handle location update requests
        socketInstance.on('location_update_request', (data) => {
            console.log('📍 Location update requested for order:', data.orderId);
            
            // This will trigger the location monitoring system
            // The location monitor will start sending updates every data.frequency seconds
            // You can implement this in the location monitor hook
        });

        // Handle ETA updates
        socketInstance.on('eta_update', (data) => {
            console.log('⏱️ ETA update:', data);
            
            // Update ETA in real-time store
            updateOrderETA(data.orderId, new Date(data.estimatedArrival));
            
            // Update React Query cache
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { 
                        ...oldData, 
                        estimatedDeliveryTime: new Date(data.estimatedArrival),
                        eta: data.eta,
                        distance: data.distance
                    };
                }
                return oldData;
            });
        });

        // Handle order cancellation
        socketInstance.on('order_cancelled', (data) => {
            console.log('❌ Order cancelled:', data);
            
            // Remove from delivery jobs if it was pending
            removeDeliveryJob(data.orderId);
            
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
        });

        // 🚀 NEW: Handle delivery job acceptance confirmation
        socketInstance.on('delivery_job_accepted', (data) => {
            console.log('✅ Delivery job accepted:', data);
            
            // Remove from delivery jobs
            removeDeliveryJob(data.orderId);
            
            // Update rider status to unavailable
            const { setOnlineStatus } = useRiderStore.getState();
            setOnlineStatus(false);
            
            // Show success message
            // Alert.alert('Job Accepted', 'You have successfully accepted this delivery job'); // This line was removed from the original file
        });

        // 🚀 NEW: Handle delivery job rejection confirmation
        socketInstance.on('delivery_job_rejected', (data) => {
            console.log('❌ Delivery job rejected:', data);
            
            // Remove from delivery jobs
            removeDeliveryJob(data.orderId);
            
            // Show rejection message
            // Alert.alert('Job Rejected', 'You have rejected this delivery job'); // This line was removed from the original file
        });

        // Add this before the specific event handlers
        socketInstance.onAny((eventName, ...args) => {
            console.log(`🔍 Received event: ${eventName}`, args);
        });
        
    }, [isOnline, addDeliveryJob, removeDeliveryJob, getValidToken, attemptReconnection, updateOrderStatus, updateOrderRider, updateOrderETA, queryClient, useRiderStore.getState().setSocket]);

    // 🚀 CRITICAL FIX: Main effect with proper dependency management
    useEffect(() => {
        if (!isOnline) {
            console.log('❌ Rider is offline, not connecting socket');
            return;
        }

        let mounted = true;

        const initializeSocket = async () => {
            try {
                const socketInstance = await createSocketConnection();
                if (socketInstance && mounted) {
                    setupSocketListeners(socketInstance);
                    setSocket(socketInstance);
                }
            } catch (error) {
                console.error('❌ Failed to initialize socket:', error);
                if (mounted) {
                    attemptReconnection();
                }
            }
        };

        initializeSocket();

        return () => {
            mounted = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socket) {
                console.log('🧹 Cleaning up socket connection');
                listenersAdded.current = false;
                socket.removeAllListeners();
                socket.disconnect();
                setConnectionStatus('disconnected');
            }
        };
    }, [isOnline, createSocketConnection, setupSocketListeners, attemptReconnection]);

    // 🚀 IMPROVED: Socket actions with better error handling
    const joinOrderRoom = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`🔌 Joining order room: ${orderId}`);
            socket.emit('join_order', orderId);
        } else {
            console.warn('⚠️ Cannot join order room: socket not connected');
        }
    }, [socket, isConnected]);

    const leaveOrderRoom = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`🔌 Leaving order room: ${orderId}`);
            socket.emit('leave_order', orderId);
        } else {
            console.warn('⚠️ Cannot leave order room: socket not connected');
        }
    }, [socket, isConnected]);

    const sendLocationUpdate = useCallback((data: { orderId: string; latitude: number; longitude: number; timestamp: string }) => {
        if (socket && isConnected) {
            console.log(`📍 Sending location update for order ${data.orderId}`);
            socket.emit('location_update', data);
        } else {
            console.warn('⚠️ Cannot send location update: socket not connected');
        }
    }, [socket, isConnected]);

    const markOrderPickedUp = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`�� Marking order as picked up: ${orderId}`);
            socket.emit('order_picked_up', orderId);
        } else {
            console.warn('⚠️ Cannot mark order as picked up: socket not connected');
        }
    }, [socket, isConnected]);

    const markOrderDelivered = useCallback((orderId: string) => {
        if (socket && isConnected) {
            console.log(`✅ Marking order as delivered: ${orderId}`);
            socket.emit('order_delivered', orderId);
        } else {
            console.warn('⚠️ Cannot mark order as delivered: socket not connected');
        }
    }, [socket, isConnected]);

    useEffect(() => {
        if (socket && isConnected) {
            // 🚀 NEW: Provide socket reference to rider store
            const { setSocket } = useRiderStore.getState();
            setSocket(socket);
            console.log('📡 Socket reference provided to rider store');
        }
    }, [socket, isConnected]);

    return {
        socket,
        isConnected,
        connectionStatus,
        joinOrderRoom,
        leaveOrderRoom,
        sendLocationUpdate,
        markOrderPickedUp,
        markOrderDelivered,
        setSocket: useRiderStore.getState().setSocket // 🚀 NEW: Expose setSocket
    };
};