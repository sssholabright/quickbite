import { DeliveryJobService } from './../modules/delivery/deliveryJob.service.js';
import { prisma } from './../config/db.js';
import { logger } from './../utils/logger.js';
import { DeliveryOrchestratorService } from './deliveryOrchestration.service.js';

/**
 * 🚀 EventManagerService - Central Event Routing & Deduplication
 * 
 * Responsibilities:
 * - Route events to appropriate services
 * - Prevent duplicate event processing
 * - Add debouncing and rate limiting
 * - Provide centralized logging
 */

export class EventManagerService {
    // Event deduplication tracking
    private static eventQueue = new Map<string, NodeJS.Timeout>();
    private static readonly DEBOUNCE_TIME = 3000; // 3 seconds
    private static readonly RATE_LIMIT_TIME = 1000; // 1 second by between same events

    // Event processing locks
    private static processingLocks = new Set<string>();

    // Prevent multiple connections from same rider
    private static riderConnectionLocks = new Set<string>();

    /**
     * 🚀 Handle Rider Status Change Events
     * Prevents duplicate processing when multiple sockets connect
     */
    static async handleRiderStatusChange(riderId: string, isOnline: boolean): Promise<void> {
        const eventKey = `rider_status_${riderId}`;

        try {
            logger.info(`📡 EventManager: Rider ${riderId} status change - Online: ${isOnline}`);

            // 🚀 CRITICAL FIX: Prevent multiple connections from same rider
            if (this.riderConnectionLocks.has(riderId)) {
                logger.info(`📡 EventManager: Rider ${riderId} already has active connection, skipping duplicate`);
                return;
            }

            // Check if already processing this rider
            if (this.processingLocks.has(eventKey)) {
                logger.info(`📡 EventManager: Rider ${riderId} already processing, skipping duplicate event`);
                return;
            }

            // Clear any existing timeout for this rider
            const existingTimeout = this.eventQueue.get(eventKey);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
                logger.info(`📡 EventManager: Cleared existing timeout for rider ${riderId}`);
            }

            // Set processing lock
            this.processingLocks.add(eventKey);
            // Set connection lock
            this.riderConnectionLocks.add(riderId);

            // 🚀 FIXED: Update isOnline when rider comes online
            await prisma.rider.update({
                where: { id: riderId },
                data: { 
                    isOnline
                },
            });

            logger.info(`📡 EventManager: Updated rider ${riderId} status in database - isOnline: ${isOnline}`);

            // Handle online/offline logic
            if (isOnline) {
                // Set timeout to check for waiting orders after debounce
                const timeoutId = setTimeout(async () => {
                    try {
                        logger.info(`📡 EventManager: Checking for waiting orders for rider ${riderId}`);
                        await DeliveryJobService.onRiderComesOnline();
                        logger.info(`📡 EventManager: Checked for waiting orders for rider ${riderId}`);
                    } catch (error) {
                        logger.error({ error, riderId }, 'Error checking for waiting orders');
                    } finally {
                        // Clean up 
                        this.processingLocks.delete(eventKey);
                        this.eventQueue.delete(eventKey);
                        this.riderConnectionLocks.delete(riderId);
                    }
                }, this.DEBOUNCE_TIME);

                this.eventQueue.set(eventKey, timeoutId);
                logger.info(`📡 EventManager: Set timeout for waiting orders check for rider ${riderId}`);
            } else {
                // Clear timeout if rider is offline
                logger.info(`📡 EventManager: Rider ${riderId} went offline, clearing timeout`);
                this.processingLocks.delete(eventKey);
                this.eventQueue.delete(eventKey);
                this.riderConnectionLocks.delete(riderId);
            }
        } catch (error) {
            logger.error({ error, riderId }, 'EventManager: Error handling rider status change');
            // Clean up on error
            this.processingLocks.delete(eventKey);
            this.eventQueue.delete(eventKey);
            this.riderConnectionLocks.delete(riderId);
        }
    }

    /**
     * 🚀 Handle Order Status Change Events
     * Routes to appropriate services based on status
     */
    static async handleOrderStatusChange(orderId: string, status: string, riderId?: string): Promise<void> {
        const eventKey = `order_status_${orderId}`;
        
        try {
            logger.info(`📡 EventManager: Order ${orderId} status change - Status: ${status}`);
            
            // 🚀 Check if already processing this order
            if (this.processingLocks.has(eventKey)) {
                logger.info(`⏳ EventManager: Order ${orderId} already being processed, skipping duplicate`);
                return;
            }
            
            // 🚀 Set processing lock
            this.processingLocks.add(eventKey);
            
            // 🚀 Route based on status
            switch (status) {
                case 'READY_FOR_PICKUP':
                    await this.handleOrderReadyForPickup(orderId);
                    break;
                    
                case 'DELIVERED':
                    if (riderId) {
                        await this.handleOrderDelivered(orderId, riderId);
                    }
                    break;
                    
                case 'PICKED_UP':
                    if (riderId) {
                        await this.handleOrderPickedUp(orderId, riderId);
                    }
                    break;
                    
                default:
                    logger.info(`📡 EventManager: Order ${orderId} status ${status} - no special handling needed`);
            }
            
        } catch (error) {
            logger.error({ error, orderId, status }, 'EventManager: Error handling order status change');
        } finally {
            // 🚀 Clean up processing lock
            this.processingLocks.delete(eventKey);
        }
    }

    /**
     * 🚀 Handle Order Ready for Pickup
     */
    private static async handleOrderReadyForPickup(orderId: string): Promise<void> {
        try {
            logger.info(`🍕 EventManager: Order ${orderId} ready for pickup - delegating to orchestrator`);
            
            // 🚀 NEW: Delegate to DeliveryOrchestrator
            await DeliveryOrchestratorService.onOrderReadyForPickup(orderId);
            
            logger.info(`✅ EventManager: Order ${orderId} ready for pickup handled by orchestrator`);
            
        } catch (error) {
            logger.error({ error, orderId }, 'EventManager: Error handling order ready for pickup');
        }
    }

    /**
     * 🚀 Handle Order Delivered
     */
    private static async handleOrderDelivered(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`🎉 EventManager: Order ${orderId} delivered by rider ${riderId} - delegating to orchestrator`);
            
            // 🚀 NEW: Delegate to DeliveryOrchestrator
            await DeliveryOrchestratorService.onOrderDelivered(orderId, riderId);
            
            logger.info(`✅ EventManager: Order ${orderId} delivered handled by orchestrator`);
            
        } catch (error) {
            logger.error({ error, orderId, riderId }, 'EventManager: Error handling order delivered');
        }
    }

    /**
     * 🚀 Handle Order Picked Up
     */
    private static async handleOrderPickedUp(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`📦 EventManager: Order ${orderId} picked up by rider ${riderId} - delegating to orchestrator`);
            
            // 🚀 NEW: Delegate to DeliveryOrchestrator
            await DeliveryOrchestratorService.onOrderPickedUp(orderId, riderId);
            
            logger.info(`✅ EventManager: Order ${orderId} picked up handled by orchestrator`);
            
        } catch (error) {
            logger.error({ error, orderId, riderId }, 'EventManager: Error handling order picked up');
        }
    }

    /**
     * 🚀 Handle rider accepting an order
     */
    static async handleRiderAcceptsOrder(orderId: string, riderId: string): Promise<void> {
        const lockKey = `accept-${orderId}-${riderId}`;
        
        if (this.processingLocks.has(lockKey)) {
            logger.warn(`Already processing acceptance for order ${orderId} by rider ${riderId}`);
            return;
        }

        this.processingLocks.add(lockKey);

        try {
            logger.info(`📡 EventManager: Rider ${riderId} accepting order ${orderId}`);

            // 🚀 NEW: Use FIFO queue system
            const { DeliveryJobService } = await import('../modules/delivery/deliveryJob.service.js');
            await DeliveryJobService.handleRiderAcceptsOrder(orderId, riderId);

            // Delegate to DeliveryOrchestrator for business logic
            await DeliveryOrchestratorService.onRiderAcceptsOrder(orderId, riderId);

            logger.info(`✅ EventManager: Order ${orderId} acceptance processed successfully`);

        } catch (error) {
            logger.error({ error, orderId, riderId }, 'EventManager: Error handling rider acceptance');
            throw error;
        } finally {
            this.processingLocks.delete(lockKey);
        }
    }

    /**
     * 🚀 Handle rider rejecting an order
     */
    static async handleRiderRejectsOrder(orderId: string, riderId: string): Promise<void> {
        const lockKey = `reject-${orderId}-${riderId}`;
        
        if (this.processingLocks.has(lockKey)) {
            logger.warn(`Already processing rejection for order ${orderId} by rider ${riderId}`);
            return;
        }

        this.processingLocks.add(lockKey);

        try {
            logger.info(`📡 EventManager: Rider ${riderId} rejecting order ${orderId}`);

            // 🚀 NEW: Use FIFO queue system
            const { DeliveryJobService } = await import('../modules/delivery/deliveryJob.service.js');
            await DeliveryJobService.handleRiderRejectsOrder(orderId, riderId);

            // Delegate to DeliveryOrchestrator for business logic
            await DeliveryOrchestratorService.onRiderRejectsOrder(orderId, riderId);

            logger.info(`✅ EventManager: Order ${orderId} rejection processed successfully`);

        } catch (error) {
            logger.error({ error, orderId, riderId }, 'EventManager: Error handling rider rejection');
            throw error;
        } finally {
            this.processingLocks.delete(lockKey);
        }
    }

     /**
     * 🚀 Get Event Manager Status (for debugging)
     */
    static getStatus(): any {
        return {
            activeTimeouts: this.eventQueue.size,
            processingLocks: Array.from(this.processingLocks),
            debounceTime: this.DEBOUNCE_TIME,
            rateLimitTime: this.RATE_LIMIT_TIME
        };
    }

     /**
     * 🚀 Clear All Events (for testing/cleanup)
     */
    static clearAllEvents(): void {
        logger.warn(`🧹 EventManager: Clearing all events and timeouts`);
        
        // Clear all timeouts
        for (const timeout of this.eventQueue.values()) {
            clearTimeout(timeout);
        }
        
        // Clear all data
        this.eventQueue.clear();
        this.processingLocks.clear();
        this.riderConnectionLocks.clear();
        
        logger.info(`✅ EventManager: All events cleared`);
    }
}