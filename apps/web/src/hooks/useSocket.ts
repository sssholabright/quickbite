import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useRealtimeStore } from '../stores/realtimeStore';
import { useQueryClient } from '@tanstack/react-query';

interface SocketEvents {
    order_updated: (data: { orderId: string; order: any; timestamp: string }) => void;
    new_order: (data: { order: any; timestamp: string }) => void;
    order_status_update: (data: { orderId: string; status: string; timestamp: string }) => void;
    order_cancelled: (data: { orderId: string; order: any; timestamp: string }) => void;
    delivery_update: (data: { orderId: string; rider: any; timestamp: string }) => void;
    user_typing: (data: { userId: string; userName: string; isTyping: boolean }) => void;
}

interface SocketEmitEvents {
    join_order: (orderId: string) => void;
    leave_order: (orderId: string) => void;
    typing_start: (data: { orderId: string; userName: string }) => void;
    typing_stop: (data: { orderId: string; userName: string }) => void;
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

    useEffect(() => {
        if (!user) return;

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        const socketInstance = io(import.meta.env.VITE_SOCKET_API_URL || 'http://localhost:5000', {
            auth: {
                token: accessToken
            },
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setIsConnected(true);
            setConnectionStatus('connected');
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        // Enhanced WebSocket event handlers with real-time store updates
        socketInstance.on('order_status_update', (data) => {
            console.log('Order status updated:', data);
            
            // 1. Update real-time store for instant UI updates
            updateOrderStatus(data.orderId, data.status);
            
            // 2. Update React Query cache to keep it in sync
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, status: data.status };
                }
                return oldData;
            });
            
            // 3. Invalidate orders list to refetch in background
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        socketInstance.on('delivery_update', (data) => {
            console.log('Delivery update:', data);
            
            // 1. Update real-time store with rider info
            updateOrderRider(data.orderId, data.rider);
            
            // 2. Update React Query cache
            queryClient.setQueryData(['order', data.orderId], (oldData: any) => {
                if (oldData) {
                    return { ...oldData, rider: data.rider };
                }
                return oldData;
            });
        });

        socketInstance.on('order_updated', (data) => {
            console.log('Order updated:', data);
            
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
            console.log('Order cancelled:', data);
            
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

        socketInstance.on('new_order', (data) => {
            console.log('New order received:', data);
            // Invalidate and refetch orders
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders', 'stats'] });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setConnectionStatus('disconnected');
        };
    }, [user, updateOrderStatus, updateOrderRider, updateOrderETA, setConnectionStatus, queryClient]);

    const joinOrderRoom = (orderId: string) => {
        if (socket) {
            socket.emit('join_order', orderId);
        }
    };

    const leaveOrderRoom = (orderId: string) => {
        if (socket) {
            socket.emit('leave_order', orderId);
        }
    };

    const emitTypingStart = (orderId: string, userName: string) => {
        if (socket) {
            socket.emit('typing_start', { orderId, userName });
        }
    };

    const emitTypingStop = (orderId: string, userName: string) => {
        if (socket) {
            socket.emit('typing_stop', { orderId, userName });
        }
    };

    return {
        socket,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom,
        emitTypingStart,
        emitTypingStop
    };
};