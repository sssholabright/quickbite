import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { useRealtimeStore } from '../stores/realtime';

// Socket event interfaces
interface SocketEvents {
    order_status_update: (data: { orderId: string; status: string; timestamp: string }) => void;
    order_updated: (data: { orderId: string; order: any; timestamp: string }) => void;
    order_cancelled: (data: { orderId: string; reason: string; timestamp: string }) => void;
    rider_assigned: (data: { orderId: string; rider: any; timestamp: string }) => void;
    no_riders_available: (data: { orderId: string; message: string; timestamp: string }) => void;
}

interface SocketEmitEvents {
    join_order: (orderId: string) => void;
    leave_order: (orderId: string) => void;
}

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket<SocketEvents, SocketEmitEvents> | null>(null);
    const { tokens } = useAuthStore();
    const queryClient = useQueryClient();
    
    // Real-time store actions
    const { 
        updateOrderStatus, 
        updateOrderRider, 
        updateOrderETA,
        setConnectionStatus 
    } = useRealtimeStore();

    useEffect(() => {
        if (!tokens?.accessToken) return;

        const socketInstance = io('http://10.48.184.234:5000', {
            auth: {
                token: tokens.accessToken
            },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('📱 Mobile Socket connected:', socketInstance.id);
            setIsConnected(true);
            setConnectionStatus('connected');
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('📱 Mobile Socket disconnected:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('📱 Mobile Socket connection error:', error);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        // Enhanced WebSocket event handlers with real-time store updates
        socketInstance.on('order_status_update', (data) => {
            console.log('📱 Order status updated:', data);
            
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
        });

        socketInstance.on('order_updated', (data) => {
            console.log('📱 Order updated:', data);
            
            // Handle comprehensive order updates
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
            console.log('📱 Order cancelled:', data);
            
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

        socketInstance.on('rider_assigned', (data) => {
            console.log('📱 Rider assigned to order:', data);
            
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
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('no_riders_available', (data) => {
            console.log('📱 No riders available for order:', data);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setConnectionStatus('disconnected');
        };
    }, [tokens?.accessToken, updateOrderStatus, updateOrderRider, updateOrderETA, setConnectionStatus, queryClient]);

    const joinOrderRoom = (orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Joining order room: ${orderId}`);
            socket.emit('join_order', orderId);
        }
    };

    const leaveOrderRoom = (orderId: string) => {
        if (socket && isConnected) {
            console.log(`📱 Leaving order room: ${orderId}`);
            socket.emit('leave_order', orderId);
        }
    };

    return {
        socket,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom
    };
};