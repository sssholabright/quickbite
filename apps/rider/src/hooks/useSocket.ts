import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { useRiderStore } from '../stores/rider';
import { DeliveryJob, useRealtimeStore } from '../stores/realtime';
import notificationService from '../services/notificationService';

const API_SOCKET_URL = process.env.EXPO_PUBLIC_API_SOCKET_URL;

// Rider-specific Socket events
interface RiderSocketEvents {
    // Delivery job events - FIXED: Match backend structure
    delivery_job: (data: {
        orderId: string;
        vendorId: string;
        vendorName: string;
        customerId: string;
        customerName: string;
        pickupAddress: string;
        deliveryAddress: string;
        deliveryFee: number;
        orderNumber: string;
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
    const { isOnline } = useRiderStore();
    const { addDeliveryJob, removeDeliveryJob, updateOrderStatus, updateOrderRider, updateOrderETA } = useRealtimeStore();
    const queryClient = useQueryClient();
    
    const listenersAdded = useRef(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = useRef(1000);
    const socketCreationInProgress = useRef(false);
    const socketInstanceRef = useRef<Socket | null>(null); // 🚀 NEW: Track socket instance

    // 🚀 FIXED: Simplified token validation
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

        try {
            socketCreationInProgress.current = true;
            console.log('🔑 Starting socket creation process...');
            
            const token = await getValidToken();
            if (!token) {
                console.log('❌ No valid token available');
                return null;
            }

            console.log('🔑 Creating socket connection...');
            
            const socketInstance = io(API_SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true, // 🚀 FIXED: Enable reconnection
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                forceNew: true
            });

            console.log('📡 Socket instance created');
            
            // 🚀 FIXED: Set up listeners immediately
            setupSocketListeners(socketInstance);
            
            console.log('✅ Socket instance created successfully');
            return socketInstance;
        } catch (error) {
            console.error('❌ Failed to create socket:', error);
            return null;
        } finally {
            socketCreationInProgress.current = false;
        }
    }, [getValidToken]);

    // 🚀 FIXED: Simplified reconnection
    const attemptReconnection = useCallback(async () => {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            return;
        }

        reconnectAttempts.current++;
        console.log(`🔄 Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        
        setTimeout(async () => {
            if (isOnline && !socket) {
                const socketInstance = await createSocketConnection();
                if (socketInstance) {
                    setSocket(socketInstance);
                    socketInstanceRef.current = socketInstance;
                }
            }
        }, reconnectDelay.current);
    }, [isOnline, socket, createSocketConnection]);

    // 🚀 FIXED: Clean listener setup
    const setupSocketListeners = useCallback((socketInstance: Socket) => {
        console.log('🔧 Setting up socket listeners for socket:', socketInstance.id);
        
        // 🚀 FIXED: Reset listeners flag for new socket
        listenersAdded.current = false;

        console.log('📡 Adding event listeners...');
        listenersAdded.current = true;

        // Add the catch-all event listener first
        socketInstance.onAny((eventName, ...args) => {
            console.log(`🔍 Received event: ${eventName}`, args);
        });

        // 🚀 FIXED: Connection handler
        socketInstance.on('connect', () => {
            console.log('🚀 Rider Socket connected:', socketInstance.id);
            setIsConnected(true);
            setConnectionStatus('connected');
            reconnectAttempts.current = 0;
            reconnectDelay.current = 1000;
            
            const { user } = useAuthStore.getState();
            const { isOnline } = useRiderStore.getState();
            
            if (user?.id) {
                console.log(`📡 Emitting rider_online with status: ${isOnline}`);
                socketInstance.emit('rider_online', { isOnline });
                console.log(`✅ Emitted rider_online event with status: ${isOnline}`);
            }
        });

        // 🚀 FIXED: Disconnect handler
        socketInstance.on('disconnect', (reason) => {
            console.log('❌ Rider Socket disconnected:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
            
            // Only attempt reconnection if rider is online and it's not a manual disconnect
            if (isOnline && reason !== 'io client disconnect') {
                console.log('🔄 Attempting reconnection...');
                attemptReconnection();
            }
        });

        // 🚀 FIXED: Connection error handler
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

        // 🚀 FIXED: Reconnection handler
        socketInstance.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnection attempt ${attemptNumber}`);
            setConnectionStatus('reconnecting');
        });

        // 🚀 FIXED: Single delivery job event handler with proper duplicate detection
        socketInstance.on('delivery_job', (data) => {
            console.log('📦 Received delivery job event:', data);
            try {
                if (!data || !data.orderId) {
                    console.error('❌ Invalid delivery job data:', data);
                    return;
                }

                // 🚀 FIXED: Check if we're currently showing this job in the modal
                const { getActiveDeliveryJobs } = useRealtimeStore.getState();
                const isCurrentlyShowing = getActiveDeliveryJobs().some((job: DeliveryJob) => job.orderId === data.orderId);
                
                if (isCurrentlyShowing) {
                    console.log('⚠️ Job already being shown in modal, skipping duplicate:', data.orderId);
                    return;
                }

                console.log('📦 Data:', JSON.stringify(data, null, 2));

                // Transform data to match frontend format
                const transformedJob: DeliveryJob = {
                    orderId: data.orderId,
                    id: data.orderId,
                    orderNumber: data.orderNumber,
                    payout: data.deliveryFee || 0,
                    distanceKm: data.distance || 0,
                    vendor: {
                        id: data.vendorId,
                        name: data.vendorName,
                        pickupLocation: data.pickupAddress || '',
                        address: data.pickupAddress || '',
                        lat: 0,
                        lng: 0
                    },
                    customer: {
                        id: data.customerId,
                        name: data.customerName,
                        phone: '',
                        address: typeof data.deliveryAddress === 'string' 
                            ? JSON.parse(data.deliveryAddress).address 
                            : data.deliveryAddress?.address || '',
                        dropoffAddress: typeof data.deliveryAddress === 'string' 
                            ? JSON.parse(data.deliveryAddress).address 
                            : data.deliveryAddress?.address || '',
                        dropoffLat: typeof data.deliveryAddress === 'string'
                            ? JSON.parse(data.deliveryAddress).coordinates?.lat || 0
                            : data.deliveryAddress?.coordinates?.lat || 0,
                        dropoffLng: typeof data.deliveryAddress === 'string'
                            ? JSON.parse(data.deliveryAddress).coordinates?.lng || 0
                            : data.deliveryAddress?.coordinates?.lng || 0,
                        lat: typeof data.deliveryAddress === 'string'
                            ? JSON.parse(data.deliveryAddress).coordinates?.lat || 0
                            : data.deliveryAddress?.coordinates?.lat || 0,
                        lng: typeof data.deliveryAddress === 'string'
                            ? JSON.parse(data.deliveryAddress).coordinates?.lng || 0
                            : data.deliveryAddress?.coordinates?.lng || 0
                    },
                    deliveryAddress: data.deliveryAddress,
                    deliveryFee: data.deliveryFee || 0,
                    estimatedDistance: data.distance || 0,
                    items: data.items || [],
                    createdAt: new Date().toISOString(),
                    expiresIn: data.timer || 30,
                    timer: data.timer || 30
                };

                console.log('📦 Transformed delivery job:', transformedJob);

                // Add to store (this will show the modal)
                addDeliveryJob(transformedJob);
                
                console.log('✅ Delivery job added to store');
            } catch (error) {
                console.error('❌ Error handling delivery job:', error);
            }
        });

        // 🚀 IMPROVED: Delivery job removal with better error handling
        socketInstance.on('delivery_job_removed', (data) => {
            try {
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
            // Remove from delivery jobs
            removeDeliveryJob(data.orderId);
            
            // Update rider status to unavailable (NOT offline)
            const { updateRiderStatus } = useRiderStore.getState();
            updateRiderStatus({ 
                isOnline: true,      // Keep online
                isAvailable: false   // Make unavailable for new orders
            });
        });

        // 🚀 NEW: Handle delivery job rejection confirmation
        socketInstance.on('delivery_job_rejected', (data) => {
            // Remove from delivery jobs
            removeDeliveryJob(data.orderId);
        });

        console.log('✅ Socket listeners setup complete');
    }, [isOnline, addDeliveryJob, removeDeliveryJob, getValidToken, attemptReconnection, updateOrderStatus, updateOrderRider, updateOrderETA, queryClient]);

    // 🚀 FIXED: Main effect with proper cleanup
    useEffect(() => {
        let mounted = true;

        const initializeSocket = async () => {
            if (!isOnline) {
                console.log('❌ Rider is offline, disconnecting socket');
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                    socketInstanceRef.current = null;
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                }
                return;
            }

            // Only create socket if we don't have one and rider is online
            if (!socket && mounted) {
                try {
                    const socketInstance = await createSocketConnection();
                    if (socketInstance && mounted) {
                        setSocket(socketInstance);
                        socketInstanceRef.current = socketInstance;
                    }
                } catch (error) {
                    console.error('❌ Failed to create socket:', error);
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
    }, [isOnline, createSocketConnection]);

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

    return {
        socket,
        isConnected,
        connectionStatus,
        joinOrderRoom,
        leaveOrderRoom,
        sendLocationUpdate,
        markOrderPickedUp,
        markOrderDelivered
    };
};