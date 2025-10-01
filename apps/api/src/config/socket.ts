import { FCMService } from './../services/fcm.service.js';
import { EventManagerService } from './../services/eventManager.service.js';
import { logger } from './../utils/logger.js';
import { JWTPayload } from './../types/jwt.js';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { env } from './env.js';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
    vendorId?: string;
    customerId?: string;
    riderId?: string | null;
}

export class SocketService {
    private io: SocketIOServer;
    private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]
    private connectedRiders: Map<string, string[]> = new Map(); // riderId -> socketIds[]
    private static debugCounter = 0;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: env.NODE_ENV === 'production' 
                    ? ['https://quickbite-roan.vercel.app'] 
                    : [
                        'http://localhost:3000', 
                        'http://localhost:5173', 
                        'https://quickbite-roan.vercel.app',
                        'http://192.168.0.176:5000',
                        'http://192.168.0.176:8081',
                        'http://192.168.0.176:8082',
                        'http://10.249.44.234:8081',
                        'http://10.249.44.234:8082'
                    ], 
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
        });

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth.token;
                console.log('=== Socket Auth Debug ===');
                console.log('Token received:', token ? 'Token present' : 'No token');
                console.log('Token length:', token?.length);
                console.log('Token preview:', token?.substring(0, 20) + '...');
                
                if (!token) {
                    logger.warn('Socket connection attempted without token');
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;

                // Get entity-specific IDs
                if (decoded.role === 'VENDOR') {
                    const vendor = await prisma.vendor.findUnique({
                        where: { userId: decoded.userId },
                        select: { id: true }
                    });
                    socket.vendorId = vendor?.id || '';
                } else if (decoded.role === 'CUSTOMER') {
                    const customer = await prisma.customer.findUnique({
                        where: { userId: decoded.userId },
                        select: { id: true }
                    });
                    socket.customerId = customer?.id || '';
                } else if (decoded.role === 'RIDER') {
                    const rider = await prisma.rider.findUnique({
                        where: { userId: decoded.userId },
                        select: { id: true }
                    });
                    socket.riderId = rider?.id || '';
                }
                next();
            } catch (error) {
                logger.error({ error }, 'Socket authentication failed');
                next(new Error('Invalid authentication token'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', async (socket: AuthenticatedSocket) => {
            SocketService.debugCounter++;
            console.log(`🔍 DEBUG: Socket connection #${SocketService.debugCounter} - ID: ${socket.id}, User: ${socket.userId}, Role: ${socket.userRole}`);
    
            // 🚀 CLEAN: Join role-specific rooms (authentication only)
            if (socket.userRole === 'VENDOR' && socket.vendorId) {
                socket.join(`vendor:${socket.vendorId}`);
                socket.join('vendors');
                socket.join(`vendor_orders:${socket.vendorId}`);
                logger.info(`Vendor ${socket.vendorId} joined vendor rooms`);
                
                // 🚀 DELIVER PENDING NOTIFICATIONS (Web users only)
                try {
                    const { notificationQueueService } = await import('../services/notificationQueue.service.js');
                    await notificationQueueService.deliverPendingNotifications('vendor', socket.vendorId);
                    logger.info(`📬 Pending notifications check completed for vendor ${socket.vendorId}`);
                } catch (error) {
                    logger.error({ error }, 'Failed to deliver pending notifications to vendor');
                }
                
            } else if (socket.userRole === 'CUSTOMER' && socket.customerId) {
                socket.join(`customer:${socket.customerId}`);
                socket.join('customers');
                logger.info(`Customer ${socket.customerId} joined customer rooms`);
                
                // 🚀 REMOVED: No pending notifications for mobile users (they use direct socket events)
                logger.info(`📱 Customer ${socket.customerId} connected - using direct socket events`);
                
            } else if (socket.userRole === 'RIDER' && socket.riderId) {
                // 🚀 CRITICAL FIX: Check if rider already has active connections
                const existingSockets = this.connectedRiders.get(socket.riderId) || [];
                console.log(`🔍 DEBUG: Processing rider connection for ${socket.riderId}`);
                console.log(`🔍 DEBUG: Existing sockets for rider ${socket.riderId}: ${existingSockets.length}`);
                console.log(`🔍 DEBUG: Current connectedRiders Map:`, Array.from(this.connectedRiders.entries()));
                
                if (existingSockets.length > 0) {
                    logger.warn(`🚫 Rider ${socket.riderId} already has ${existingSockets.length} active connections, disconnecting duplicate`);
                    // 🚀 CRITICAL: Disconnect the duplicate socket immediately
                    socket.disconnect(true);
                    return;
                }
                
                // Add to connected riders FIRST
                if (!this.connectedRiders.has(socket.riderId)) {
                    this.connectedRiders.set(socket.riderId, []);
                }
                this.connectedRiders.get(socket.riderId)!.push(socket.id);
                console.log(`🔍 DEBUG: Added socket ${socket.id} to connectedRiders for rider ${socket.riderId}`);
                
                socket.join(`rider:${socket.riderId}`);
                socket.join('riders');
                logger.info(`Rider ${socket.riderId} joined rider rooms`);
            } else if (socket.userRole === 'ADMIN') {
                socket.join('admins');
                logger.info(`Admin ${socket.userId} joined admin room`);
            }

            // 🚀 CLEAN: Handle rider status changes - delegate to EventManager
            socket.on('rider_status_change', async (data) => {
                try {
                    const { isOnline } = data;

                    if (socket.userRole === 'RIDER' && socket.riderId) {
                        logger.info(`📡 Socket: Rider ${socket.riderId} status change - Online: ${isOnline}`);
                        
                        // 🚀 DELEGATE: All business logic goes to EventManager
                        await EventManagerService.handleRiderStatusChange(socket.riderId, isOnline);
                        
                        // 🚀 CLEAN: Only handle room management here
                        if (!isOnline) {
                            socket.leave('riders');
                            logger.info(`Rider ${socket.riderId} left 'riders' room due to going offline`);
                        } else {
                            socket.join('riders');
                            logger.info(`Rider ${socket.riderId} joined 'riders' room due to coming online`);
                        }
                    }
                } catch (error) {
                    logger.error({ error }, 'Error handling rider status change');
                }
            });

            // 🚀 CLEAN: Handle order events - delegate to EventManager
            socket.on('order_status_change', async (data) => {
                try {
                    const { orderId, status, riderId } = data;
                    
                    if (socket.userRole === 'RIDER' && socket.riderId) {
                        logger.info(`📡 Socket: Order ${orderId} status change - Status: ${status}`);
                        
                        // 🚀 DELEGATE: All business logic goes to EventManager
                        await EventManagerService.handleOrderStatusChange(orderId, status, riderId);
                    }
                } catch (error) {
                    logger.error({ error }, 'Error handling order status change');
                }
            });

            // 🚀 CLEAN: Handle rider job acceptance/rejection - delegate to EventManager
            socket.on('delivery_job_response', async (data) => {
                try {
                    const { orderId, response, riderId } = data; // response: 'accept' | 'reject'
                    
                    if (socket.userRole === 'RIDER' && socket.riderId) {
                        logger.info(`📡 Socket: Rider ${riderId} ${response}ed order ${orderId}`);
                        
                        // 🚀 DELEGATE: All business logic goes to EventManager
                        if (response === 'accept') {
                            await EventManagerService.handleRiderAcceptsOrder(orderId, riderId);
                        } else if (response === 'reject') {
                            await EventManagerService.handleRiderRejectsOrder(orderId, riderId);
                        }
                    }
                } catch (error) {
                    logger.error({ error }, 'Error handling delivery job response');
                }
            });

            // 🚀 CLEAN: Handle disconnect - only update connection tracking
            socket.on('disconnect', async () => {
                logger.info(`Socket disconnected: ${socket.id}`);
                
                // 🚀 CLEAN: Only handle connection cleanup
                if (socket.userRole === 'RIDER' && socket.riderId) {
                    try {
                        // Set rider as offline when they disconnect
                        await prisma.rider.update({
                            where: { id: socket.riderId },
                            data: { isOnline: false }
                        });
                        
                        logger.info(`Rider ${socket.riderId} marked as offline due to disconnect`);
                    } catch (error) {
                        logger.error({ error, riderId: socket.riderId }, 'Error updating rider status on disconnect');
                    }
                }
                
                // Clean up connection tracking
                if (socket.userId) {
                    const userSockets = this.connectedUsers.get(socket.userId) || [];
                    const updatedSockets = userSockets.filter(id => id !== socket.id);
                    
                    if (updatedSockets.length === 0) {
                        this.connectedUsers.delete(socket.userId);
                    } else {
                        this.connectedUsers.set(socket.userId, updatedSockets);
                    }
                }
                
                if (socket.riderId) {
                    const riderSockets = this.connectedRiders.get(socket.riderId) || [];
                    const updatedSockets = riderSockets.filter(id => id !== socket.id);
                    
                    if (updatedSockets.length === 0) {
                        this.connectedRiders.delete(socket.riderId);
                    } else {
                        this.connectedRiders.set(socket.riderId, updatedSockets);
                    }
                }
            });
        });
    }

    // 🚀 CLEAN: Socket utility methods only
    emitToVendor(vendorId: string, event: string, data: any): void {
        this.io.to(`vendor:${vendorId}`).emit(event, data);
    }

    emitToCustomer(customerId: string, event: string, data: any): void {
        this.io.to(`customer:${customerId}`).emit(event, data);
    }

    emitToRider(riderId: string, event: string, data: any): void {
        console.log(`🔍 DEBUG: emitToRider called - riderId: ${riderId}, event: ${event}`);
        const room = `rider:${riderId}`;
        const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
        console.log(`🔍 DEBUG: Sockets in room ${room}:`, socketsInRoom ? Array.from(socketsInRoom) : 'none');
        this.io.to(room).emit(event, data);
        console.log(`🔍 DEBUG: Event ${event} emitted to room ${room}`);
    }

    emitToAllRiders(event: string, data: any): void {
        this.io.to('riders').emit(event, data);

        // FCM push notification to rider
        // if (data.rider) {
        //     try {
        //         FCMService.sendOrderNotification(data.orderId, {
        //         title: 'New Order!',
        //         body: `New order #${data.orderNumber} received`,
        //         data: { orderId: data.orderId }
        //         }, 'RIDER');
        //     } catch (error) {
        //         logger.error({ error, orderId: data.orderId }, 'Failed to send push notification to rider');
        //     }

        //     logger.info(`Push notification sent to rider for order ${data.orderId}`);
        // }
    }

    emitToAllVendors(event: string, data: any): void {
        this.io.to('vendors').emit(event, data);
    }

    emitToAllCustomers(event: string, data: any): void {
        this.io.to('customers').emit(event, data);
    }

    emitToOrder(orderId: string, event: string, data: any): void {
        this.io.to(`order:${orderId}`).emit(event, data);
    }

    getIO(): SocketIOServer {
        return this.io;
    }

    getConnectedRidersCount(): number {
        const ridersRoom = this.io.sockets.adapter.rooms.get('riders');
        return ridersRoom ? ridersRoom.size : 0;
    }

    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }
}

// 🚀 CLEAN: Simple initialization function
export const initializeSocket = (server: HTTPServer): SocketService => {
    const socketManager = new SocketService(server);
    return socketManager;
};

// 🚀 CLEAN: Simple getter function
let socketManager: SocketService | null = null;

export const getSocketManager = (): SocketService => {
    if (!socketManager) {
        throw new Error('Socket manager not initialized');
    }
    return socketManager;
};

export const setSocketManager = (manager: SocketService): void => {
    socketManager = manager;
};