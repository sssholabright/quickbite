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

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: env.NODE_ENV === 'production' 
                    ? ['https://yourdomain.com'] 
                    : [
                        'http://localhost:3000', 
                        'http://localhost:5173', 
                        'http://192.168.0.176:5000',
                        'http://192.168.0.176:8081',
                        'http://192.168.0.176:8082',
                        'http://10.48.184.234:8081',
                        'http://10.48.184.234:8082'
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
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                console.log('=== Socket Auth Debug ===');
                console.log('Token received:', token ? 'Token present' : 'No token');
                console.log('Token length:', token?.length);
                console.log('Token preview:', token?.substring(0, 20) + '...');
                
                if (!token) {
                    console.log('No token provided');
                    return next(new Error('Authentication token is required'));
                }

                const decoded = jwt.verify(token, env.JWT_SECRET!) as JWTPayload;
                console.log('Token decoded successfully:', { userId: decoded.userId, role: decoded.role });
                
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;

                // Set role-specific IDs
                if (decoded.role === 'VENDOR') {
                    socket.vendorId = decoded.userId;
                } else if (decoded.role === 'CUSTOMER') {
                    socket.customerId = decoded.userId;
                } else if (decoded.role === 'RIDER') {
                    // Get actual rider ID from database
                    const rider = await prisma.rider.findUnique({
                        where: { userId: decoded.userId },
                        select: { id: true }
                    });
                    socket.riderId = rider?.id || null;
                }

                next();
            } catch (error) {
                console.log('Socket authentication error:', error);
                logger.error({ error }, 'Socket authentication failed');
                next(new Error('Invalid authentication token'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            logger.info(`Socket connected: ${socket.id}, User: ${socket.userId}, Role: ${socket.userRole}`);

            // Join role-specific rooms
            if (socket.userRole === 'VENDOR' && socket.vendorId) {
                socket.join(`vendor:${socket.vendorId}`);
                socket.join('vendors');
            } else if (socket.userRole === 'CUSTOMER' && socket.customerId) {
                socket.join(`customer:${socket.customerId}`);
            } else if (socket.userRole === 'RIDER' && socket.riderId) {
                socket.join(`rider:${socket.riderId}`);
                socket.join('riders');
                
                // Track connected riders
                if (!this.connectedRiders.has(socket.riderId)) {
                    this.connectedRiders.set(socket.riderId, []);
                }
                this.connectedRiders.get(socket.riderId)!.push(socket.id);
            } else if (socket.userRole === 'ADMIN') {
                socket.join('admins');
            }

            // Track connected users
            if (socket.userId) {
                if (!this.connectedUsers.has(socket.userId)) {
                    this.connectedUsers.set(socket.userId, []);
                }
                this.connectedUsers.get(socket.userId)!.push(socket.id);
            }

            // 🚀 NEW: Handle rider status changes
            socket.on('rider_status_change', async (data) => {
                try {
                    if (socket.userRole === 'RIDER' && socket.riderId) {
                        const { isOnline } = data;
                        
                        // If rider goes offline, remove from riders room
                        if (!isOnline) {
                            socket.leave('riders');
                            logger.info(`Rider ${socket.riderId} left 'riders' room due to going offline`);
                        } else {
                            // If rider comes back online, rejoin riders room
                            socket.join('riders');
                            logger.info(`Rider ${socket.riderId} joined 'riders' room due to coming online`);
                        }
                    }
                } catch (error) {
                    logger.error({ error }, 'Error handling rider status change');
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
                
                // 🚀 CRITICAL FIX: Remove rider from 'riders' room on disconnect
                if (socket.userRole === 'RIDER' && socket.riderId) {
                    socket.leave('riders');
                    logger.info(`Rider ${socket.riderId} left 'riders' room due to disconnect`);
                }
                
                if (socket.userId) {
                    const userSockets = this.connectedUsers.get(socket.userId);
                    if (userSockets) {
                        const index = userSockets.indexOf(socket.id);
                        if (index > -1) {
                            userSockets.splice(index, 1);
                            if (userSockets.length === 0) {
                                this.connectedUsers.delete(socket.userId);
                            }
                        }
                    }
                }

                if (socket.riderId) {
                    const riderSockets = this.connectedRiders.get(socket.riderId);
                    if (riderSockets) {
                        const index = riderSockets.indexOf(socket.id);
                        if (index > -1) {
                            riderSockets.splice(index, 1);
                            if (riderSockets.length === 0) {
                                this.connectedRiders.delete(socket.riderId);
                            }
                        }
                    }
                }
            });

            // Handle join order room (for real-time order updates)
            socket.on('join_order', (orderId: string) => {
                socket.join(`order:${orderId}`);
                logger.info(`User ${socket.userId} joined order room: ${orderId}`);
            });

            // Handle leave order room
            socket.on('leave_order', (orderId: string) => {
                socket.leave(`order:${orderId}`);
                logger.info(`User ${socket.userId} left order room: ${orderId}`);
            });

            // Handle typing indicators for chat (future feature)
            socket.on('typing_start', (data) => {
                socket.to(`order:${data.orderId}`).emit('user_typing', {
                    userId: socket.userId,
                    userName: data.userName,
                    isTyping: true
                });
            });

            socket.on('typing_stop', (data) => {
                socket.to(`order:${data.orderId}`).emit('user_typing', {
                    userId: socket.userId,
                    userName: data.userName,
                    isTyping: false
                });
            });

            // 🚀 NEW: When rider comes online, automatically broadcast existing ready orders
            socket.on('rider_online', async (data) => {
                try {
                    logger.info(`Rider ${socket.riderId} came online, checking for waiting orders`);
                    
                    // Import here to avoid circular dependencies
                    const { DeliveryJobService } = await import('../modules/delivery/deliveryJob.service.js');
                    await DeliveryJobService.checkWaitingOrders();
                    
                    logger.info(`✅ Checked for waiting orders after rider ${socket.riderId} came online`);
                } catch (error) {
                    logger.error({ error, riderId: socket.riderId }, 'Error checking waiting orders on rider online');
                }
            });
        });
    }

    // CORE WEBSOCKET METHODS - Use these consistently throughout the app

    /**
     * Emit to all riders
     */
    public emitToAllRiders(event: string, data: any): void {
        this.io.to('riders').emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emit to specific rider
     */
    public emitToRider(riderId: string, event: string, data: any): void {
        this.io.to(`rider:${riderId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emit to specific customer
     */
    public emitToCustomer(customerId: string, event: string, data: any): void {
        this.io.to(`customer:${customerId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emit to specific vendor
     */
    public emitToVendor(vendorId: string, event: string, data: any): void {
        this.io.to(`vendor:${vendorId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emit to order room (all participants)
     */
    public emitToOrder(orderId: string, event: string, data: any): void {
        this.io.to(`order:${orderId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Emit order cancellation to all relevant parties
     */
    public emitOrderCancellation(orderId: string, orderData: any, reason?: string): void {
        const cancellationData = {
            orderId,
            order: orderData,
            reason: reason || 'Order cancelled',
            timestamp: new Date().toISOString()
        };

        // Emit to order room (all participants)
        this.emitToOrder(orderId, 'order_cancelled', cancellationData);
        
        // Emit to customer
        if (orderData.customer?.id) {
            this.emitToCustomer(orderData.customer.id, 'order_status_update', {
                orderId,
                status: 'CANCELLED',
                timestamp: new Date().toISOString()
            });
        }
        
        // Emit to vendor
        if (orderData.vendor?.id) {
            this.emitToVendor(orderData.vendor.id, 'order_status_update', {
                orderId,
                status: 'CANCELLED',
                timestamp: new Date().toISOString()
            });
        }
        
        // Emit to rider if assigned
        if (orderData.rider?.id) {
            this.emitToRider(orderData.rider.id, 'order_cancelled', cancellationData);
        }
    }

    // Get connected users count
    public getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    // Get connected riders count
    public getConnectedRidersCount(): number {
        return this.connectedRiders.size;
    }

    // Get connected vendors count
    public getConnectedVendorsCount(): number {
        return Array.from(this.connectedUsers.entries())
            .filter(([userId, socketIds]) => {
                return socketIds.length > 0;
            }).length;
    }

    public getIO(): SocketIOServer {
        return this.io;
    }
}

let socketManager: SocketService;

export const initializeSocket = (server: HTTPServer): SocketService => {
    socketManager = new SocketService(server);
    return socketManager;
};

export const getSocketManager = (): SocketService => {
    if (!socketManager) {
        throw new Error('Socket manager not initialized');
    }
    return socketManager;
};