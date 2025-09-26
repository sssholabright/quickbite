import { logger } from '../../utils/logger.js';
import { prisma } from '../../config/db.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { getSocketManager } from '../../config/socket.js';
import { DeliveryJobData } from '../../types/queue.js';
import { DeliveryJobBroadcast as DeliveryJobBroadcastType } from '../../types/delivery.js';
import { queueService } from '../queues/queue.service.js';
import redisService from '../../config/redis.js';
import { Socket } from 'socket.io';
import { FCMService } from '../../services/fcm.service.js';

export class DeliveryJobService {
    private static activeJobs = new Map<string, any>();
    private static jobQueue: string[] = [];
    private static isProcessing = false;

    /**
     * Industry Standard: Send ONE delivery request at a time
     */
    public static async broadcastDeliveryJob(jobData: DeliveryJobData, socketManager?: any): Promise<void> {
        try {
            logger.info(`📡 Broadcasting delivery job for order ${jobData.orderId}`);
            
            // Add to queue instead of immediate broadcast
            this.jobQueue.push(jobData.orderId);
            this.activeJobs.set(jobData.orderId, {
                jobData,
                socketManager,
                createdAt: new Date(),
                status: 'QUEUED',
                rejectedRiders: new Set<string>(), // Track rejected riders
                attempts: 0 // Track retry attempts
            });

            logger.info(`📋 Added order ${jobData.orderId} to delivery queue (position: ${this.jobQueue.length})`);
            
            // Start processing if not already running
            if (!this.isProcessing) {
                this.processJobQueue();
            }

        } catch (error) {
            logger.error({ error, orderId: jobData.orderId }, 'Error broadcasting delivery job');
        }
    }

    /**
     * Process jobs one at a time with delays
     */
    private static async processJobQueue(): Promise<void> {
        if (this.isProcessing || this.jobQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        logger.info(`🔄 Starting job queue processing (${this.jobQueue.length} jobs pending)`);

        while (this.jobQueue.length > 0) {
            const orderId = this.jobQueue.shift();
            if (!orderId) continue;

            const jobInfo = this.activeJobs.get(orderId);
            if (!jobInfo) continue;

            try {
                await this.processSingleJob(jobInfo);
                
                // Wait 5 seconds before next job
                if (this.jobQueue.length > 0) {
                    console.log(`⏳ Waiting 5 seconds before next order...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            } catch (error) {
                logger.error({ error, orderId }, 'Error processing single job');
            }
        }

        this.isProcessing = false;
        logger.info(`✅ Job queue processing completed`);
    }

    /**
     * Process ONE job with 60-second timeout
     */
    private static async processSingleJob(jobInfo: any): Promise<void> {
        const { jobData, socketManager, rejectedRiders } = jobInfo;
        
        logger.info(`🎯 Processing order ${jobData.orderId} (attempt ${jobInfo.attempts + 1})`);

        // Find available riders (excluding rejected ones)
        const availableRiders = await this.findAvailableRiders(jobData, rejectedRiders);
        
        if (!availableRiders || availableRiders.length === 0) {
            logger.warn(`🚫 No available riders for order ${jobData.orderId} - keeping in queue for later`);
            
            // 🚀 FIXED: Don't cancel - just remove from active processing and keep in queue
            jobInfo.status = 'WAITING_FOR_RIDERS';
            this.activeJobs.delete(jobData.orderId);
            
            // Notify vendor that no riders are currently available
            const socketManager = getSocketManager();
            socketManager.emitToVendor(jobData.vendorId, 'no_riders_available', {
                orderId: jobData.orderId,
                message: 'No riders are currently available. Order will be broadcast when riders come online.',
                status: 'waiting_for_riders'
            });
            
            return; // Keep order in READY_FOR_PICKUP status
        }

        // Update job status
        jobInfo.status = 'ACTIVE';
        jobInfo.startedAt = new Date();
        jobInfo.availableRiders = availableRiders;
        jobInfo.attempts++;

        // Create broadcast data
        const broadcastData: DeliveryJobBroadcastType = {
            orderId: jobData.orderId,
            vendorId: jobData.vendorId,
            vendorName: jobData.vendorName,
            customerId: jobData.customerId,
            customerName: jobData.customerName,
            pickupAddress: jobData.pickupAddress,
            deliveryAddress: jobData.deliveryAddress,
            deliveryFee: jobData.deliveryFee,
            distance: jobData.distance,
            items: jobData.items,
            expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds timeout
            timer: 60,
            retryCount: jobInfo.attempts,
        };

        // Broadcast to riders
        await this.broadcastToRiders(broadcastData, availableRiders, socketManager);

        // Set timeout for rider response
        setTimeout(async () => {
            await this.handleJobTimeout(jobData.orderId);
        }, 60000); // 60 seconds timeout

        logger.info(`⏰ Order ${jobData.orderId} sent to ${availableRiders.length} riders with 60-second timeout`);
    }

    /**
     * Handle rider rejection - track rejection and continue with other riders
     */
    public static async handleRiderRejection(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`❌ Rider ${riderId} rejected order ${orderId}`);

            const jobInfo = this.activeJobs.get(orderId);
            if (!jobInfo) {
                logger.warn(`Job ${orderId} not found in active jobs`);
                return;
            }

            // Add rider to rejected list
            jobInfo.rejectedRiders.add(riderId);
            
            // Store rejection in Redis for persistence
            const rejectionKey = `rejected_riders:${orderId}`;
            const rejectedRiders = Array.from(jobInfo.rejectedRiders);
            await redisService.set(rejectionKey, JSON.stringify(rejectedRiders), 3600); // 1 hour TTL

            // Check if we still have available riders
            const remainingRiders = jobInfo.availableRiders.filter((rider: any) => 
                !jobInfo.rejectedRiders.has(rider.id)
            );

            if (remainingRiders.length === 0) {
                logger.warn(`No more riders available for order ${orderId} after rejections - keeping in queue`);
                
                // 🚀 FIXED: Don't cancel - just remove from active processing
                jobInfo.status = 'WAITING_FOR_RIDERS';
                this.activeJobs.delete(orderId);
                
                // Notify vendor
                const socketManager = getSocketManager();
                socketManager.emitToVendor(jobInfo.jobData.vendorId, 'no_riders_available', {
                    orderId: orderId,
                    message: 'All available riders rejected this order. Will retry when more riders come online.',
                    status: 'waiting_for_riders'
                });
            } else {
                logger.info(`Order ${orderId} still has ${remainingRiders.length} riders available after rejection`);
                // Job continues with remaining riders
            }

        } catch (error) {
            logger.error({ error, orderId: orderId }, 'Error handling rider rejection');
        }
    }

    /**
     * Handle rider acceptance - remove from queue and process next
     */
    public static async handleRiderAcceptance(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`✅ Rider ${riderId} accepted order ${orderId}`);

            // Remove from active jobs and queue
            this.activeJobs.delete(orderId);
            const queueIndex = this.jobQueue.indexOf(orderId);
            if (queueIndex > -1) {
                this.jobQueue.splice(queueIndex, 1);
            }

            // Update order in database
            const updateResult = await prisma.order.updateMany({
                where: { 
                    id: orderId,
                    status: 'READY_FOR_PICKUP',
                    riderId: null
                },
                data: {
                    riderId: riderId,
                    status: 'ASSIGNED'
                }
            });

            if (updateResult.count === 0) {
                logger.warn(`Order ${orderId} was already assigned or not ready for pickup`);
                throw new CustomError('Order already assigned to another rider', 400);
            }

            // 🚀 NEW: Update rider status to unavailable (they now have an assigned order)
            await prisma.rider.update({
                where: { id: riderId },
                data: { isAvailable: false }
            });

            logger.info(`🚫 Rider ${riderId} marked as unavailable (has assigned order ${orderId})`);

            // Remove job from all riders
            const socketManager = getSocketManager();
            socketManager.emitToAllRiders('delivery_job_removed', {
                orderId: orderId,
                reason: 'accepted_by_another_rider'
            });

            // Notify accepting rider
            socketManager.emitToRider(riderId, 'delivery_job_accepted', {
                orderId: orderId,
                message: 'You have successfully accepted this delivery job'
            });

            logger.info(`🎯 Order ${orderId} assigned to rider ${riderId}, processing next job...`);

            // Continue processing queue
            this.processJobQueue();

        } catch (error) {
            logger.error({ error, orderId: orderId }, 'Error handling rider acceptance');
            throw new CustomError('Failed to handle rider acceptance', 500);
        }
    }

    /**
     * Handle job timeout - retry or wait for more riders
     */
    private static async handleJobTimeout(orderId: string): Promise<void> {
        try {
            logger.info(`⏰ Order ${orderId} timed out - no rider accepted within 60 seconds`);

            const jobInfo = this.activeJobs.get(orderId);
            if (!jobInfo) {
                logger.warn(`Job ${orderId} not found in active jobs`);
                return;
            }

            // Check if we should retry (max 3 attempts)
            if (jobInfo.attempts < 3) {
                logger.info(` Retrying order ${orderId} (attempt ${jobInfo.attempts + 1}/3)`);
                
                // Add back to queue for retry
                this.jobQueue.unshift(orderId); // Add to front of queue
                jobInfo.status = 'QUEUED';
                
                // Continue processing
                this.processJobQueue();
                return;
            }

            // Max attempts reached - keep in queue for when riders come online
            logger.warn(`🚫 Order ${orderId} reached max retry attempts (3), keeping in queue for when riders come online`);
            
            // 🚀 FIXED: Don't cancel - just remove from active processing
            jobInfo.status = 'WAITING_FOR_RIDERS';
            this.activeJobs.delete(orderId);
            
            // Notify vendor
            const socketManager = getSocketManager();
            socketManager.emitToVendor(jobInfo.jobData.vendorId, 'order_waiting_for_riders', {
                orderId: orderId,
                message: 'Order is waiting for riders to come online. Will automatically broadcast when riders become available.',
                status: 'waiting_for_riders'
            });

        } catch (error) {
            logger.error({ error, orderId }, 'Error handling job timeout');
        }
    }

    /**
     *  NEW: Check for waiting orders when riders come online
     * Real-world: When riders come online, automatically broadcast waiting orders
     */
    public static async checkWaitingOrders(): Promise<void> {
        try {
            logger.info(` Checking for orders waiting for riders...`);

            // Find orders that are READY_FOR_PICKUP but not assigned
            const waitingOrders = await prisma.order.findMany({
                where: {
                    status: 'READY_FOR_PICKUP',
                    riderId: null,
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Only orders from last 24 hours
                    }
                },
                include: {
                    vendor: {
                        include: { user: true }
                    },
                    customer: {
                        include: { user: true }
                    },
                    items: {
                        include: {
                            menuItem: true,
                            addOns: {
                                include: { addOn: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'asc' } // Oldest orders first
            });

            if (waitingOrders.length === 0) {
                logger.info(`✅ No orders waiting for riders`);
                return;
            }

            logger.info(`📋 Found ${waitingOrders.length} orders waiting for riders`);

            // Queue each waiting order
            for (const order of waitingOrders) {
                const deliveryJobData: DeliveryJobData = {
                    orderId: order.id,
                    vendorId: order.vendorId,
                    customerId: order.customerId,
                    customerName: order.customer.user.name,
                    vendorName: order.vendor.businessName,
                    pickupAddress: order.vendor.businessAddress || 'Vendor Address',
                    deliveryAddress: JSON.stringify(order.deliveryAddress),
                    deliveryFee: order.deliveryFee,
                    distance: 0, // Will be calculated
                    items: order.items.map((item: any) => ({
                        id: item.id,
                        name: item.menuItem.name,
                        quantity: item.quantity,
                        price: item.unitPrice
                    })),
                    createdAt: order.createdAt,
                    expiresAt: new Date(Date.now() + 60 * 1000),
                };

                // Add to queue
                this.jobQueue.push(order.id);
                this.activeJobs.set(order.id, {
                    jobData: deliveryJobData,
                    socketManager: null,
                    createdAt: new Date(),
                    status: 'QUEUED',
                    rejectedRiders: new Set<string>(),
                    attempts: 0
                });
            }

            logger.info(`✅ Queued ${waitingOrders.length} waiting orders for broadcast`);

            // Start processing if not already running
            if (!this.isProcessing) {
                this.processJobQueue();
            }

        } catch (error) {
            logger.error({ error }, 'Error checking waiting orders');
        }
    }

    /**
     * Find available riders excluding rejected ones and those with assigned orders
     */
    private static async findAvailableRiders(jobData: DeliveryJobData, rejectedRiders?: Set<string>): Promise<any[]> {
        try {
            logger.info(`🔍 Finding available riders for order ${jobData.orderId}`);
            
            // Get rejected riders from Redis
            const rejectionKey = `rejected_riders:${jobData.orderId}`;
            const rejectedRiderIds = await redisService.get(rejectionKey) || [];
            
            // Combine with current rejected riders
            const allRejectedRiders = [
                ...rejectedRiderIds,
                ...(rejectedRiders ? Array.from(rejectedRiders) : [])
            ];

            // 🚀 FIXED: Get available riders from database with proper filtering
            const availableRidersFromDB = await prisma.rider.findMany({
                where: {
                    isOnline: true,                    // Must be online
                    currentLat: { not: null },         // Must have location
                    currentLng: { not: null },         // Must have location
                    id: { notIn: allRejectedRiders },  // Not rejected for this order
                    // 🚀 CRITICAL: No assigned orders
                    orders: {
                        none: {
                            status: {
                                in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] // No active orders
                            }
                        }
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        }
                    },
                    // 🚀 NEW: Include orders to verify no active assignments
                    orders: {
                        where: {
                            status: {
                                in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY']
                            }
                        },
                        select: {
                            id: true,
                            status: true,
                            orderNumber: true
                        }
                    }
                }
            });

            logger.info(`🔍 Found ${availableRidersFromDB.length} available riders in database (excluding those with assigned orders)`);

            // Check which riders are connected via socket
            const socketManager = getSocketManager();
            const io = socketManager.getIO();
            const ridersRoom = io.sockets.adapter.rooms.get('riders');
            
            if (!ridersRoom || ridersRoom.size === 0) {
                logger.warn(`🔍 No riders connected via socket`);
                return [];
            }

            const connectedRiderIds: string[] = [];
            ridersRoom.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId) as Socket & { userRole?: string; riderId?: string };
                if (socket && socket.userRole === 'RIDER' && socket.riderId) {
                    connectedRiderIds.push(socket.riderId);
                }
            });

            // Filter to only include riders who are:
            // 1. Available in DB
            // 2. Connected via socket
            // 3. Have no assigned orders
            const actuallyAvailableRiders = availableRidersFromDB.filter(rider => {
                const isConnected = connectedRiderIds.includes(rider.id);
                const hasNoAssignedOrders = rider.orders.length === 0;
                
                if (!isConnected) {
                    logger.warn(`🚫 Rider ${rider.id} is available in DB but not connected via socket`);
                }
                if (!hasNoAssignedOrders) {
                    logger.warn(`🚫 Rider ${rider.id} has ${rider.orders.length} assigned orders: ${rider.orders.map(o => o.orderNumber).join(', ')}`);
                }
                
                return isConnected && hasNoAssignedOrders;
            });

            logger.info(`🔍 Final count: ${actuallyAvailableRiders.length} riders who are available, connected, and have no assigned orders`);

            // Log details for debugging
            actuallyAvailableRiders.forEach(rider => {
                logger.info(`✅ Available rider: ${rider.id} (${rider.user.name}) - No assigned orders`);
            });

            return actuallyAvailableRiders.slice(0, 5); // Limit to 5 riders
            
        } catch (error) {
            logger.error({ error, orderId: jobData.orderId }, 'Error finding available riders');
            return [];
        }
    }

    /**
     * Broadcast delivery job to riders via WebSocket
     * Real-world: Sends popup notification to rider apps
     */
    private static async broadcastToRiders(broadcastData: DeliveryJobBroadcastType, riders: any[], socketManager?: any): Promise<void> {
        try {
            // Get socket manager - either passed in or get from global instance
            let manager = socketManager;
            if (!manager) {
                try {
                    manager = getSocketManager();
                } catch (error) {
                    logger.warn('Socket manager not available, skipping WebSocket broadcast');
                    return; // Skip WebSocket broadcast but don't fail
                }
            }
            
            if (!manager) {
                logger.warn('No socket manager available, skipping WebSocket broadcast');
                return; // Skip WebSocket broadcast but don't fail
            }
            
            // 🔍 DEBUG: Check connected riders
            const connectedRiders = manager.getConnectedRidersCount();
            logger.info(`🔍 Connected riders: ${connectedRiders}`);
            
            // 🔍 DEBUG: Check if we have riders in the 'riders' room
            const io = manager.getIO();
            const ridersRoom = io.sockets.adapter.rooms.get('riders');
            logger.info(`🔍 Riders in 'riders' room: ${ridersRoom ? ridersRoom.size : 0}`);
            
            // 🚀 NEW: Log the broadcast data
            logger.info(`🔍 Broadcasting data: ${JSON.stringify(broadcastData, null, 2)}`);
            
            // Use the existing socket manager to broadcast to all riders
            manager.emitToAllRiders('new_delivery_job', broadcastData);
            
            // 🚀 NEW: Also try emitting to individual rider rooms
            riders.forEach(rider => {
                logger.info(`🔍 Emitting to rider:${rider.id}`);
                manager.emitToRider(rider.id, 'new_delivery_job', broadcastData);
            });

            // 🚀 NEW: Send FCM push notification to all available riders
            const fcmPromises = riders.map(async (rider) => {
                try {
                    await FCMService.sendToRider(rider.id, {
                        title: '🚚 New Delivery Job Available!',
                        body: `Order from ${broadcastData.vendorName} - ${broadcastData.deliveryFee} delivery fee`,
                        data: {
                            orderId: broadcastData.orderId,
                            type: 'new_delivery_job',
                            vendorName: broadcastData.vendorName,
                            deliveryFee: broadcastData.deliveryFee,
                            expiresAt: broadcastData.expiresAt.toISOString()
                        }
                    }, {
                        orderId: broadcastData.orderId,
                        riderId: rider.id
                    })

                    logger.info(`🔍 Sent FCM push notification to rider:${rider.id}`);
                } catch (error) {
                    logger.error({ error, riderId: rider.id }, 'Error sending FCM push notification');
                }
            })

            // Wait for all FCM notifications to be sent
            await Promise.allSettled(fcmPromises);
            
            logger.info(`Delivery job broadcasted to ${riders.length} riders for order ${broadcastData.orderId}`);
        } catch (error) {
            logger.error({ error, orderId: broadcastData.orderId }, 'Error broadcasting delivery job');
            throw new CustomError('Failed to broadcast delivery job', 500);
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     * Real-world: Calculates straight-line distance between vendor and rider
     */
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    // Add this method to handle the case where order is already assigned
    public static async handleAlreadyAssignedOrder(orderId: string): Promise<void> {
        try {
            const socketManager = getSocketManager();
            socketManager.emitToAllRiders('delivery_job_removed', {
                orderId: orderId,
                reason: 'already_assigned'
            });
            logger.info(`Sent delivery_job_removed for already assigned order ${orderId}`);
        } catch (error) {
            logger.error({ error, orderId }, 'Error handling already assigned order');
        }
    }
}