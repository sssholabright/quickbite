import { TIMING_CONFIG } from './../config/timing.js';
import { getSocketManager } from './../config/socket.js';
import { DeliveryJobService } from './../modules/delivery/deliveryJob.service.js';
import { prisma } from './../config/db.js';
import { queueService } from './../modules/queues/queue.service.js'; // 🚀 ADD: Import queue service
import { logger } from './../utils/logger.js';
import { DeliveryJobData } from './../types/queue.js'; // Change import to queue.ts

/**
 * 🚀 DeliveryOrchestratorService - The "Conductor" of Delivery Operations
 * 
 * Responsibilities:
 * - Orchestrate complex delivery workflows
 * - Coordinate between different services
 * - Handle business logic for delivery scenarios
 * - Manage delivery state transitions
 */

export class DeliveryOrchestratorService {
    /**
     * 🚀 Orchestrate: Rider Comes Online
     * Handles the complete workflow when a rider comes online
     */

    static async onRiderComesOnline(riderId: string): Promise<void> {
        try {
            logger.info(`🎯 DeliveryOrchestrator: Rider ${riderId} came online - starting orchestration`);

            // Step 1: Verify rider exists and get details
            const rider = await prisma.rider.findUnique({
                where: { id: riderId },
                include: { user: true }
            });
            
            if (!rider) {
                logger.error(`❌ DeliveryOrchestrator: Rider ${riderId} not found in database`);
                return;
            }

            logger.info(`✅ DeliveryOrchestrator: Rider ${rider.user.name} verified`);

            // Step 2: Check if rider has any active orders
            const activeOrders = await prisma.order.findMany({
                where: {
                    riderId: riderId,
                    status: {
                        in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY']
                    }
                }
            });
            
            if (activeOrders.length > 0) {
                logger.info(`📦 DeliveryOrchestrator: Rider ${riderId} has ${activeOrders.length} active orders - not checking for new ones`);
                return;
            }

            // Step 3: Check for waiting orders
            logger.info(`🔍 DeliveryOrchestrator: Checking for waiting orders for rider ${riderId}`);
            await DeliveryJobService.onRiderComesOnline();
            
            logger.info(`✅ DeliveryOrchestrator: Completed rider online orchestration for ${riderId}`);
        } catch (error) {
            logger.error({ error, riderId }, 'DeliveryOrchestrator: Error in onRiderComesOnline');
        }
    }

    /**
     * 🚀 Orchestrate: Order Ready for Pickup
     * Handles the complete workflow when an order is ready for pickup
     */
    static async onOrderReadyForPickup(orderId: string): Promise<void> {
        try {
            logger.info(`🚀 DeliveryOrchestrator: Order ${orderId} ready for pickup`);

            // 🚀 NEW: Use FIFO queue system
            await DeliveryJobService.addOrderToQueue(orderId);

            logger.info(`✅ Order ${orderId} added to FIFO delivery queue`);

        } catch (error) {
            logger.error({ error, orderId }, 'DeliveryOrchestrator: Error in onOrderReadyForPickup');
            throw error;
        }
    }

    /**
     * �� Orchestrate: Order Delivered
     * Handles the complete workflow when an order is delivered
     */
    static async onOrderDelivered(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`🎯 DeliveryOrchestrator: Order ${orderId} delivered by rider ${riderId} - starting orchestration`);
            
            // Step 1: Get order and rider details
            const [order, rider] = await Promise.all([
                prisma.order.findUnique({
                    where: { id: orderId },
                    include: {
                        vendor: { include: { user: true } },
                        customer: { include: { user: true } },
                        rider: { include: { user: true } }
                    }
                }),
                prisma.rider.findUnique({
                    where: { id: riderId },
                    include: { user: true }
                })
            ]);

            if (!order) {
                logger.error(`❌ DeliveryOrchestrator: Order ${orderId} not found`);
                return;
            }
            
            if (!rider) {
                logger.error(`❌ DeliveryOrchestrator: Rider ${riderId} not found`);
                return;
            }
            
            logger.info(`✅ DeliveryOrchestrator: Order ${order.orderNumber} delivered by ${rider.user.name}`);

            // 🚀 FIXED: Mark rider as available for new orders
            setTimeout(async () => {
                await prisma.rider.update({
                    where: { id: riderId },
                    data: { isOnline: true }
                });
            }, TIMING_CONFIG.DELIVERY_JOB_COOLDOWN);
            
            logger.info(`🔄 DeliveryOrchestrator: Rider ${riderId} marked as available for new orders`);
            
            if (order.status === 'DELIVERED') {
                await this.sendDeliveryCompletionNotifications(order, rider);
            } else {
                return;
            }

            logger.info(`✅ DeliveryOrchestrator: Completed order delivered orchestration for ${orderId}`);     
        }  catch (error) {
            logger.error({ error, orderId, riderId }, 'DeliveryOrchestrator: Error in onOrderDelivered');
        }
    }

    /**
     * 🚀 Orchestrate: Order Picked Up
     * Handles the complete workflow when an order is picked up
     */
    static async onOrderPickedUp(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`🎯 DeliveryOrchestrator: Order ${orderId} picked up by rider ${riderId} - starting orchestration`);
            
            // Step 1: Mark rider as unavailable (has active order)
            await prisma.rider.update({
                where: { id: riderId },
                data: { isOnline: false }
            });
            
            logger.info(`🚫 DeliveryOrchestrator: Rider ${riderId} marked as unavailable (has active order)`);
            
            // Step 2: Get order details for notifications
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    vendor: { include: { user: true } },
                    customer: { include: { user: true } },
                    rider: { include: { user: true } }
                }
            });
            
            if (order && order.status === 'PICKED_UP') {
                await this.sendPickupNotifications(order);
                logger.info(`📢 DeliveryOrchestrator: Sent pickup notifications for order ${orderId}`);
            } else {
                return;
            }
            
            logger.info(`✅ DeliveryOrchestrator: Completed order picked up orchestration for ${orderId}`);
            
        } catch (error) {
            logger.error({ error, orderId, riderId }, 'DeliveryOrchestrator: Error in onOrderPickedUp');
        }
    }
    
    /**
     * 🚀 Orchestrate: Rider Rejects Order
     * Handles the complete workflow when a rider rejects an order
     */
    static async onRiderRejectsOrder(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`🎯 DeliveryOrchestrator: Rider ${riderId} rejected order ${orderId} - starting orchestration`);
            
            // Step 1: Handle rejection in DeliveryJobService
            await DeliveryJobService.handleRiderRejectsOrder(orderId, riderId);
            
            // Step 2: Get order details for notifications
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    vendor: { include: { user: true } },
                    customer: { include: { user: true } }
                }
            });
            
            if (order && order.status === 'READY_FOR_PICKUP') {
                // Step 3: Notify vendor about rejection
                try {
                    const socketManager = getSocketManager();
                    socketManager.emitToVendor(order.vendorId, 'order_rejected_by_rider', {
                        orderId: orderId,
                        orderNumber: order.orderNumber,
                        message: 'Order was rejected by a rider, will be sent to other available riders',
                        status: 'READY_FOR_PICKUP'
                    });
                    logger.info(`📢 DeliveryOrchestrator: Notified vendor about rider rejection`);
                } catch (socketError) {
                    logger.warn({ error: socketError, orderId }, 'DeliveryOrchestrator: Failed to notify vendor about rejection');
                }
            } else {
                return;
            }
            
            logger.info(`✅ DeliveryOrchestrator: Completed rider rejection orchestration for ${orderId}`);
            
        } catch (error) {
            logger.error({ error, orderId, riderId }, 'DeliveryOrchestrator: Error in onRiderRejectsOrder');
        }
    }
    
    /**
     * 🚀 Orchestrate: Rider Accepts Order
     * Handles the complete workflow when a rider accepts an order
     */
    static async onRiderAcceptsOrder(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`🎯 DeliveryOrchestrator: Rider ${riderId} accepted order ${orderId} - starting orchestration`);
            
            // Step 1: Handle acceptance in DeliveryJobService
            await DeliveryJobService.handleRiderAcceptsOrder(orderId, riderId);
            
            // Step 2: Get order and rider details
            const [order, rider] = await Promise.all([
                prisma.order.findUnique({
                    where: { id: orderId },
                    include: {
                        vendor: { include: { user: true } },
                        customer: { include: { user: true } },
                        rider: { include: { user: true } }
                    }
                }),
                prisma.rider.findUnique({
                    where: { id: riderId },
                    include: { user: true }
                })
            ]);
            
            if (order && rider && order.status === 'ASSIGNED') {
                // Step 3: Send acceptance notifications
                await this.sendAcceptanceNotifications(order, rider);
                logger.info(`📢 DeliveryOrchestrator: Sent acceptance notifications for order ${orderId}`);
            } else {
                return;
            }
            
            logger.info(`✅ DeliveryOrchestrator: Completed rider acceptance orchestration for ${orderId}`);
            
        } catch (error) {
            logger.error({ error, orderId, riderId }, 'DeliveryOrchestrator: Error in onRiderAcceptsOrder');
        }
    }
    
    /**
     * 🚀 Orchestrate: Order Cancelled by Rider
     * Handles the complete workflow when a rider cancels an order
     */
    static async onOrderCancelled(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`❌ DeliveryOrchestrator: Order ${orderId} cancelled by rider ${riderId} - starting orchestration`);

            // Step 1: Get order and rider details
            const [order, rider] = await Promise.all([
                prisma.order.findUnique({
                    where: { id: orderId },
                    include: { 
                        rider: { include: { user: true } },
                        customer: { include: { user: true } },
                        vendor: { include: { user: true } }
                    }
                }),
                prisma.rider.findUnique({
                    where: { id: riderId },
                    include: { user: true }
                })
            ]);

            if (!order) {
                logger.error(`❌ DeliveryOrchestrator: Order ${orderId} not found`);
                return;
            }
            
            if (!rider) {
                logger.error(`❌ DeliveryOrchestrator: Rider ${riderId} not found`);
                return;
            }

            logger.info(`✅ DeliveryOrchestrator: Order ${order.orderNumber} cancelled by ${rider.user.name}`);

            // Step 2: Make rider available for new orders
            await prisma.rider.update({
                where: { id: riderId },
                data: { isOnline: true }
            });

            // Step 3: Re-add order to queue for rebroadcasting
            await this.rebroadcastCancelledOrder(order);

            // Step 4: Notify stakeholders about reassignment
            await this.notifyOrderReassignment(order);

            // Step 5: Trigger queue processing for next order
            setTimeout(async () => {
                await DeliveryJobService.onRiderComesOnline();
            }, TIMING_CONFIG.DELIVERY_JOB_COOLDOWN);

            logger.info(`✅ DeliveryOrchestrator: Completed order cancellation orchestration for ${orderId}`);

        } catch (error) {
            logger.error({ error, orderId, riderId }, 'DeliveryOrchestrator: Error in onOrderCancelled');
        }
    }

    /**
     * 🚀 Send Delivery Completion Notifications
     */
    private static async sendDeliveryCompletionNotifications(order: any, rider: any): Promise<void> {
        try {
            const socketManager = getSocketManager();
            
            // Notify customer
            socketManager.emitToCustomer(order.customer.userId, 'order_delivered', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                rider: {
                    id: rider.id,
                    name: rider.user.name,
                    phone: rider.user.phone
                },
                message: 'Your order has been delivered successfully!',
                timestamp: new Date().toISOString()
            });
            
            // Notify vendor
            socketManager.emitToVendor(order.vendorId, 'order_delivered', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                rider: {
                    id: rider.id,
                    name: rider.user.name,
                    phone: rider.user.phone
                },
                message: 'Order has been delivered to customer',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`📢 DeliveryOrchestrator: Sent delivery completion notifications for order ${order.id}`);
            
        } catch (error) {
            logger.error({ error, orderId: order.id }, 'DeliveryOrchestrator: Error sending delivery completion notifications');
        }
    }
    
    /**
     * 🚀 Send Pickup Notifications
     */
    private static async sendPickupNotifications(order: any): Promise<void> {
        try {
            const socketManager = getSocketManager();
            
            // Notify customer
            socketManager.emitToCustomer(order.customer.userId, 'order_picked_up', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                rider: {
                    id: order.rider?.id,
                    name: order.rider?.user.name,
                    phone: order.rider?.user.phone
                },
                message: 'Your order has been picked up and is on the way!',
                timestamp: new Date().toISOString()
            });
            
            // Notify vendor
            socketManager.emitToVendor(order.vendorId, 'order_picked_up', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                rider: {
                    id: order.rider?.id,
                    name: order.rider?.user.name,
                    phone: order.rider?.user.phone
                },
                message: 'Order has been picked up by rider',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`📢 DeliveryOrchestrator: Sent pickup notifications for order ${order.id}`);
            
        } catch (error) {
            logger.error({ error, orderId: order.id }, 'DeliveryOrchestrator: Error sending pickup notifications');
        }
    }
    
    /**
     * 🚀 Send Acceptance Notifications
     */
    private static async sendAcceptanceNotifications(order: any, rider: any): Promise<void> {
        try {
            const socketManager = getSocketManager();
            
            // Notify customer
            socketManager.emitToCustomer(order.customer.userId, 'rider_assigned', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                rider: {
                    id: rider.id,
                    name: rider.user.name,
                    phone: rider.user.phone
                },
                message: 'A rider has been assigned to your order!',
                timestamp: new Date().toISOString()
            });
            
            // Notify vendor
            socketManager.emitToVendor(order.vendorId, 'rider_assigned', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                rider: {
                    id: rider.id,
                    name: rider.user.name,
                    phone: rider.user.phone
                },
                message: 'A rider has been assigned to the order',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`📢 DeliveryOrchestrator: Sent acceptance notifications for order ${order.id}`);
            
        } catch (error) {
            logger.error({ error, orderId: order.id }, 'DeliveryOrchestrator: Error sending acceptance notifications');
        }
    }

    /**
     * 🚀 Re-add cancelled order to queue for rebroadcasting
     */
    private static async rebroadcastCancelledOrder(order: any): Promise<void> {
        try {
            // Check if order is still in delivery queue
            const existingQueueItem = await prisma.deliveryQueue.findUnique({
                where: { orderId: order.id }
            });

            if (existingQueueItem) {
                // Update existing queue item to rebroadcast
                await prisma.deliveryQueue.update({
                    where: { id: existingQueueItem.id },
                    data: {
                        status: 'QUEUED',
                        attempts: 0, // Reset attempts for fresh start
                        expiresAt: new Date(Date.now() + TIMING_CONFIG.DELIVERY_JOB_TIMEOUT)
                    }
                });
                logger.info(`🔄 Order ${order.id} updated in queue for rebroadcasting`);
            } else {
                // Add to queue if not already there
                await DeliveryJobService.addOrderToQueue(order.id);
                logger.info(`🔄 Order ${order.id} added to queue for rebroadcasting`);
            }

            // Reset order status to READY_FOR_PICKUP
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'READY_FOR_PICKUP',
                    riderId: null, // Remove rider assignment
                    cancelledAt: null, // Clear cancellation
                    cancellationReason: null
                }
            });

        } catch (error) {
            logger.error({ error, orderId: order.id }, 'DeliveryOrchestrator: Error rebroadcasting cancelled order');
        }
    }

    /**
     * 🚀 Notify stakeholders about order reassignment
     */
    private static async notifyOrderReassignment(order: any): Promise<void> {
        try {
            const socketManager = getSocketManager();
            
            // Notify customer - order will be reassigned
            socketManager.emitToCustomer(order.customer.userId, 'order_reassigned', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                message: 'Your order was cancelled by the previous rider. A new rider will be assigned shortly.',
                status: 'reassigning',
                timestamp: new Date().toISOString()
            });

            // Notify vendor - order will be reassigned
            socketManager.emitToVendor(order.vendorId, 'order_reassigned', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                message: `Order ${order.orderNumber} was cancelled by the rider. A new rider will be assigned shortly.`,
                status: 'reassigning',
                timestamp: new Date().toISOString()
            });

            logger.info(`📢 DeliveryOrchestrator: Notified customer and vendor about order reassignment ${order.id}`);

        } catch (error) {
            logger.error({ error, orderId: order.id }, 'DeliveryOrchestrator: Error notifying about order reassignment');
        }
    }
    
    /**
     * �� Calculate Distance Between Two Points
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
    
    /**
     * 🚀 Get Orchestrator Status (for debugging)
     */
    static getStatus(): any {
        return {
            service: 'DeliveryOrchestratorService',
            status: 'active',
            capabilities: [
                'onRiderComesOnline',
                'onOrderReadyForPickup', 
                'onOrderDelivered',
                'onOrderPickedUp',
                'onRiderRejectsOrder',
                'onRiderAcceptsOrder',
                'onOrderCancelled' // 🚀 NEW: Added order cancellation
            ]
        };
    }
}