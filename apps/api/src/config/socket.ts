import { logger } from './../utils/logger.js';
import { JWTPayload } from './../types/jwt.js';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { env } from './env.js';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
    vendorId?: string;
    customerId?: string;
}

export class SocketService {
    private io: SocketIOServer;
    private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: env.NODE_ENV === 'production' 
                    ? ['https://yourdomain.com'] 
                    : ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.0.176:8081', 'http://localhost:5173', 'http://10.213.134.234:8081', 'http://10.213.134.234:8082'], 
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
        this.io.use((socket: AuthenticatedSocket, next) => {
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
                    socket.vendorId = decoded.userId; // Use userId instead of vendorId
                } else if (decoded.role === 'CUSTOMER') {
                    socket.customerId = decoded.userId; // Use userId instead of customerId
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
            } else if (socket.userRole === 'RIDER') {
                socket.join('riders');
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

            // Handle disconnect
            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
                
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
        });
    }

    // Emit order updates to relevant parties
    public emitOrderUpdate(orderId: string, orderData: any) {
        this.io.to(`order:${orderId}`).emit('order_updated', {
            orderId,
            order: orderData,
            timestamp: new Date().toISOString()
        });
    }

    // Emit new order to vendors
    public emitNewOrder(orderData: any) {
        this.io.to('vendors').emit('new_order', {
            order: orderData,
            timestamp: new Date().toISOString()
        });
    }

    // Emit order status update to customer
    public emitOrderStatusUpdate(orderId: string, customerId: string, status: string) {
        this.io.to(`customer:${customerId}`).emit('order_status_update', {
            orderId,
            status,
            timestamp: new Date().toISOString()
        });
    }

    // Emit order cancellation
    public emitOrderCancellation(orderId: string, orderData: any) {
        this.io.to(`order:${orderId}`).emit('order_cancelled', {
            orderId,
            order: orderData,
            timestamp: new Date().toISOString()
        });
    }

    // Emit delivery updates to customer
    public emitDeliveryUpdate(orderId: string, customerId: string, riderData: any) {
        this.io.to(`customer:${customerId}`).emit('delivery_update', {
            orderId,
            rider: riderData,
            timestamp: new Date().toISOString()
        });
    }

    // Get connected users count
    public getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    // Get connected vendors count
    public getConnectedVendorsCount(): number {
        return Array.from(this.connectedUsers.entries())
            .filter(([userId, socketIds]) => {
                // This would need to be enhanced to track vendor status
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