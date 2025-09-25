import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useRealtimeStore } from '../stores/realtimeStore';
import Swal from 'sweetalert2';

// Socket event interfaces
interface SocketEvents {
    order_status_update: (data: { orderId: string; status: string; timestamp: string }) => void;
    order_updated: (data: { orderId: string; order: any; timestamp: string }) => void;
    order_cancelled: (data: { orderId: string; reason: string; timestamp: string }) => void;
    rider_assigned: (data: { orderId: string; rider: any; timestamp: string }) => void;
    no_riders_available: (data: { orderId: string; message: string; timestamp: string }) => void;
    delivery_update: (data: { orderId: string; rider: any; timestamp: string }) => void;
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

        // 🚀 FIXED: Consistent socket URL
        const socketInstance = io(import.meta.env.VITE_SOCKET_API_URL || 'http://192.168.0.176:5000', {
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

        // Enhanced WebSocket event handlers with real-time store updates
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
        });

        socketInstance.on('order_updated', (data) => {
            console.log('🌐 Order updated:', data);
            
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
        });

        // Handle rider assignment
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
            
            // Show success notification
            if (typeof window !== 'undefined' && Swal) {
                Swal.fire({
                    title: 'Rider Assigned!',
                    text: `${data.rider.name} has been assigned to your order`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        });

        // Handle no riders available
        socketInstance.on('no_riders_available', (data) => {
            console.log('🌐 No riders available for order:', data);
            
            // Show warning notification
            if (typeof window !== 'undefined' && Swal) {
                Swal.fire({
                    title: 'No Riders Available',
                    text: data.message,
                    icon: 'warning',
                    timer: 5000,
                    showConfirmButton: true
                });
            }
            
            // Invalidate orders to refresh the list
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

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setConnectionStatus('disconnected');
        };
    }, [user, updateOrderStatus, updateOrderRider, updateOrderETA, setConnectionStatus, queryClient]);

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

    return {
        socket,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom,
        startTyping,
        stopTyping
    };
};