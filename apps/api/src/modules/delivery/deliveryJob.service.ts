import { NotificationService } from './../notifications/notification.service.js';
import { getSocketManager } from './../../config/socket.js';
import { CustomError } from './../../middlewares/errorHandler.js';
import { prisma } from './../../config/db.js';
import { logger } from './../../utils/logger.js';
import { TIMING_CONFIG } from './../../config/timing.js';

/**
 * 🚀 UPDATED: Database-Persistent FIFO Delivery Queue Service
 * 
 * Database-persistent FIFO queue system:
 * 1. Orders stored in database delivery_queue table
 * 2. Survives server restarts and crashes
 * 3. Maintains FIFO order with position field
 * 4. Full audit trail and monitoring
 */
export class DeliveryJobService {
    // 🚀 UPDATED: Remove in-memory storage
    // private static queue: QueuedOrder[] = []; // Remove this
    private static isProcessing = false;
    private static lastBroadcastTime = 0;
    private static activeTimeouts = new Map<string, NodeJS.Timeout>();
    
    // 🚀 SIMPLE: Use timing config
    private static readonly COOLDOWN_PERIOD = TIMING_CONFIG.DELIVERY_JOB_COOLDOWN;
    private static readonly JOB_TIMEOUT = TIMING_CONFIG.DELIVERY_JOB_TIMEOUT;
    private static readonly MAX_ATTEMPTS = 3;

    /**
     * 🚀 UPDATED: Add order to database queue
     */
    public static async addOrderToQueue(orderId: string): Promise<void> {
        try {
            logger.info(`📋 Adding order ${orderId} to database FIFO queue`);

            // Check if already in queue
            const existingQueueItem = await prisma.deliveryQueue.findUnique({
                where: { orderId }
            });

            if (existingQueueItem) {
                logger.warn(`Order ${orderId} already in queue`);
                return;
            }

            // Get order details
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    vendor: { include: { user: true } },
                    customer: { include: { user: true } },
                    items: { include: { menuItem: true } }
                }
            });

            if (!order || order.status !== 'READY_FOR_PICKUP') {
                logger.warn(`Order ${orderId} not found or not ready for pickup`);
                return;
            }

            // Get next position in queue
            const lastPosition = await prisma.deliveryQueue.findFirst({
                orderBy: { position: 'desc' },
                select: { position: true }
            });
            const nextPosition = (lastPosition?.position || 0) + 1;

            // Create queue entry in database
            await prisma.deliveryQueue.create({
                data: {
                    orderId: order.id,
                    status: 'QUEUED',
                    attempts: 0,
                    position: nextPosition,
                    expiresAt: new Date(Date.now() + this.JOB_TIMEOUT)
                }
            });

            logger.info(`✅ Order ${orderId} added to database queue (position ${nextPosition})`);

            // 🚀 FIXED: Only start processing if this is the first order in queue
            const queueLength = await this.getQueueLength();
            if (queueLength === 1) {
                logger.info(`🚀 Starting queue processing for first order ${orderId}`);
                this.processQueue();
            } else {
                logger.info(`⏳ Order ${orderId} queued, waiting for previous orders to complete`);
            }

        } catch (error) {
            logger.error(`❌ Error adding order ${orderId} to queue: ${error}`);
            throw new CustomError('Failed to add order to queue', 500);
        }
    }

    /**
     * 🚀 UPDATED: Process database queue
     */
    private static async processQueue(): Promise<void> {
        if (this.isProcessing) {
            logger.info(`⏸️ Already processing queue`);
            return;
        }

        const queueLength = await this.getQueueLength();
        if (queueLength === 0) {
            logger.info(`📭 Queue is empty`);
            return;
        }

        // Check cooldown
        const now = Date.now();
        const timeSinceLastBroadcast = now - this.lastBroadcastTime;
        if (timeSinceLastBroadcast < this.COOLDOWN_PERIOD) {
            const remainingCooldown = this.COOLDOWN_PERIOD - timeSinceLastBroadcast;
            logger.info(`⏳ Cooldown active: ${remainingCooldown}ms remaining`);
            setTimeout(() => this.processQueue(), remainingCooldown);
            return;
        }

        this.isProcessing = true;
        logger.info(`🚀 Processing database FIFO queue (${queueLength} orders)`);

        try {
            // 🚀 FIXED: Only process if no order is currently broadcasting
            const broadcastingOrder = await prisma.deliveryQueue.findFirst({
                where: { status: 'BROADCASTING' }
            });

            if (broadcastingOrder) {
                logger.info(`⏳ Order ${broadcastingOrder.orderId} already broadcasting, waiting for completion...`);
                this.isProcessing = false;
                return;
            }

            // Get next order from front of queue (lowest position)
            const nextQueueItem = await prisma.deliveryQueue.findFirst({
                where: {
                    status: { in: ['QUEUED', 'REJECTED'] }
                },
                orderBy: { position: 'asc' },
                include: {
                    order: {
                        include: {
                            vendor: { include: { user: true } },
                            customer: { include: { user: true } },
                            items: { include: { menuItem: true } }
                        }
                    }
                }
            });

            if (!nextQueueItem) {
                this.isProcessing = false;
                return;
            }

            // Find available riders
            const availableRiders = await this.findAvailableRiders();
            if (availableRiders.length === 0) {
                logger.info(`No riders available, waiting...`);
                this.isProcessing = false;
                setTimeout(() => this.processQueue(), 10000);
                return;
            }

            // Broadcast to available riders
            await this.broadcastToRiders(nextQueueItem, availableRiders);

            // Update status in database
            await prisma.deliveryQueue.update({
                where: { id: nextQueueItem.id },
                data: {
                    status: 'BROADCASTING',
                    attempts: { increment: 1 },
                    expiresAt: new Date(Date.now() + this.JOB_TIMEOUT)
                }
            });

            this.lastBroadcastTime = now;

            // Set timeout
            const timeoutId = setTimeout(() => {
                this.handleJobTimeout(nextQueueItem.orderId);
            }, this.JOB_TIMEOUT);
            this.activeTimeouts.set(nextQueueItem.orderId, timeoutId);

            logger.info(`✅ Order ${nextQueueItem.orderId} broadcasted to ${availableRiders.length} riders`);

        } catch (error) {
            logger.error(`❌ Error processing queue: ${error}`);
            this.isProcessing = false;
            setTimeout(() => this.processQueue(), 1000);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 🚀 NEW: Get queue length from database
     */
    private static async getQueueLength(): Promise<number> {
        return await prisma.deliveryQueue.count({
            where: {
                status: { in: ['QUEUED', 'BROADCASTING', 'REJECTED'] }
            }
        });
    }

    /**
     * 🚀 UPDATED: Handle rider acceptance
     */
    public static async handleRiderAcceptsOrder(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`✅ Rider ${riderId} accepted order ${orderId}`);

            // Find order in queue
            const queueItem = await prisma.deliveryQueue.findUnique({
                where: { orderId }
            });

            if (!queueItem) {
                logger.warn(`Order ${orderId} not found in queue`);
                return;
            }

            // Clear timeout
            const timeoutId = this.activeTimeouts.get(orderId);
            if (timeoutId) {
                clearTimeout(timeoutId);
                this.activeTimeouts.delete(orderId);
            }

            // Update order in database
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'ASSIGNED',
                    riderId: riderId
                }
            });

            // Remove from queue
            await prisma.deliveryQueue.update({
                where: { id: queueItem.id },
                data: { status: 'COMPLETED' }
            });

            logger.info(`✅ Order ${orderId} assigned to rider ${riderId}, removed from queue`);

            // Process next order after cooldown
            setTimeout(() => this.processQueue(), this.COOLDOWN_PERIOD);

        } catch (error) {
            logger.error({ error, orderId, riderId }, 'Error handling rider acceptance');
            throw new CustomError('Failed to handle rider acceptance', 500);
        }
    }

    /**
     * 🚀 UPDATED: Handle rider rejection
     */
    public static async handleRiderRejectsOrder(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`❌ Rider ${riderId} rejected order ${orderId}`);

            // Find order in queue
            const queueItem = await prisma.deliveryQueue.findUnique({
                where: { orderId }
            });

            if (!queueItem) {
                logger.warn(`Order ${orderId} not found in queue`);
                return;
            }

            // Mark as rejected (stays in queue for other riders)
            await prisma.deliveryQueue.update({
                where: { id: queueItem.id },
                data: { status: 'REJECTED' }
            });

            logger.info(`❌ Order ${orderId} marked as rejected, staying in queue for other riders`);

        } catch (error) {
            logger.error({ error, orderId, riderId }, 'Error handling rider rejection');
            throw new CustomError('Failed to handle rider rejection', 500);
        }
    }

    /**
     * 🚀 UPDATED: Handle job timeout
     */
    private static async handleJobTimeout(orderId: string): Promise<void> {
        try {
            logger.info(`⏰ Order ${orderId} timed out`);

            // Find order in queue
            const queueItem = await prisma.deliveryQueue.findUnique({
                where: { orderId }
            });

            if (!queueItem) {
                logger.warn(`Order ${orderId} not found in queue`);
                return;
            }

            // Clear timeout
            this.activeTimeouts.delete(orderId);

            if (queueItem.attempts < this.MAX_ATTEMPTS) {
                // Move to back of queue
                const lastPosition = await prisma.deliveryQueue.findFirst({
                    orderBy: { position: 'desc' },
                    select: { position: true }
                });
                const newPosition = (lastPosition?.position || 0) + 1;

                await prisma.deliveryQueue.update({
                    where: { id: queueItem.id },
                    data: {
                        status: 'QUEUED',
                        attempts: { increment: 1 },
                        position: newPosition,
                        expiresAt: new Date(Date.now() + this.JOB_TIMEOUT)
                    }
                });

                logger.info(`🔄 Order ${orderId} moved to back of queue (attempt ${queueItem.attempts + 1}/${this.MAX_ATTEMPTS})`);
            } else {
                // Remove from queue after max attempts
                await prisma.deliveryQueue.update({
                    where: { id: queueItem.id },
                    data: { status: 'COMPLETED' }
                });
                logger.warn(`🚫 Order ${orderId} removed from queue after max attempts`);
            }

            // Process next order after cooldown
            setTimeout(() => this.processQueue(), this.COOLDOWN_PERIOD);

        } catch (error) {
            logger.error({ error, orderId }, 'Error handling job timeout');
        }
    }

    /**
     * 🚀 NEW: Load queue from database on startup
     */
    public static async loadQueueFromDatabase(): Promise<void> {
        try {
            logger.info(`🔄 Loading delivery queue from database...`);

            // Get all active queue items
            const activeQueueItems = await prisma.deliveryQueue.findMany({
                where: {
                    status: { in: ['QUEUED', 'BROADCASTING', 'REJECTED'] }
                },
                orderBy: { position: 'asc' },
                include: {
                    order: {
                        include: {
                            vendor: { include: { user: true } },
                            customer: { include: { user: true } },
                            items: { include: { menuItem: true } }
                        }
                    }
                }
            });

            logger.info(`📋 Loaded ${activeQueueItems.length} orders from database queue`);

            // Restart processing if there are queued orders
            if (activeQueueItems.length > 0) {
                logger.info(`🚀 Restarting queue processing after server restart`);
                this.processQueue();
            }

        } catch (error) {
            logger.error(`❌ Error loading queue from database: ${error}`);
        }
    }

    /**
     * 🚀 UPDATED: Get queue status from database
     */
    public static async getStatus(): Promise<any> {
        const queueItems = await prisma.deliveryQueue.findMany({
            where: {
                status: { in: ['QUEUED', 'BROADCASTING', 'REJECTED'] }
            },
            orderBy: { position: 'asc' },
            select: {
                orderId: true,
                status: true,
                attempts: true,
                position: true,
                expiresAt: true,
                order: {
                    select: {
                        orderNumber: true
                    }
                }
            }
        });

        return {
            queueLength: queueItems.length,
            isProcessing: this.isProcessing,
            lastBroadcastTime: this.lastBroadcastTime,
            cooldownPeriod: this.COOLDOWN_PERIOD,
            activeTimeouts: this.activeTimeouts.size,
            orders: queueItems.map((item: any) => ({
                orderId: item.orderId,
                orderNumber: item.order.orderNumber,
                status: item.status,
                attempts: item.attempts,
                position: item.position,
                expiresAt: item.expiresAt
            }))
        };
    }

    /**
     * 🚀 DEBUG: Log current state
     */
    public static debugStatus(): void {
        this.getStatus().then(status => {
            logger.info(`🔍 FIFO DELIVERY QUEUE STATUS:`, status);
        });
    }

    /**
     * 🚀 HELPER: Find available riders (online and not assigned)
    */
    private static async findAvailableRiders(): Promise<any[]> {
        try {
            const riders = await prisma.rider.findMany({
                where: {
                    isOnline: true,
                    currentLat: { not: null },
                    currentLng: { not: null },
                    orders: {
                        none: {
                            status: {
                                in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY']
                            }
                        }
                    }
                },
                include: {
                    user: { select: { id: true, name: true, phone: true } }
                }
            });

            // Double-check socket connectivity
            const socketManager = getSocketManager();
            const io = socketManager.getIO();
            const ridersRoom = io.sockets.adapter.rooms.get('riders');

            if (!ridersRoom || ridersRoom.size === 0) {
                return [];
            }

            const connectedRiderIds: string[] = [];
            ridersRoom.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId) as any;
                if (socket && socket.userRole === 'RIDER' && socket.riderId) {
                    connectedRiderIds.push(socket.riderId);
                }
            });

            return riders.filter((rider: any) => connectedRiderIds.includes(rider.id));
        } catch (error) {
            logger.error(`❌ Error finding available riders: ${error}`);
            return [];
        }
    }

    /**
     * 🚀 HELPER: Broadcast order to available riders
     */
    private static async broadcastToRiders(queueItem: any, riders: any[]): Promise<void> {
        try {
            const order = queueItem.order;
            const riderIds = riders.map(rider => rider.id);
            
            // Use NotificationService for consistent delivery
            await NotificationService.notifyDeliveryJob(riderIds, {
                orderId: order.id,
                vendorId: order.vendorId,
                vendorName: order.vendor.businessName,
                customerId: order.customerId,
                customerName: order.customer.user.name,
                pickupAddress: order.vendor.businessAddress || '',
                deliveryAddress: order.deliveryAddress as string,
                deliveryFee: order.deliveryFee,
                totalAmount: order.total || 0,
                items: order.items.map((item: any) => ({
                    id: item.id,
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    specialInstructions: item.specialInstructions || ''
                })),
                createdAt: order.createdAt,
                expiresAt: queueItem.expiresAt,
                timer: 30, // This will need to be dynamic based on the order's timer
                attempts: queueItem.attempts
            });

            logger.info(`📡 Order ${order.id} broadcasted to ${riderIds.length} riders`);

        } catch (error) {
            logger.error({ error, orderId: queueItem.orderId }, 'Error broadcasting to riders');
        }
    }

    /**
     * 🚀 MAIN: Trigger queue processing when rider comes online
     */
    public static async onRiderComesOnline(): Promise<void> {
        logger.info(`🚀 Rider came online, triggering queue processing`);
        this.processQueue();
    }

    /**
     * 🚀 LEGACY: Keep for backward compatibility
     */
    public static async broadcastDeliveryJob(jobData: any, socketManager?: any): Promise<void> {
        // Convert to new system
        await this.addOrderToQueue(jobData.orderId);
    }
}