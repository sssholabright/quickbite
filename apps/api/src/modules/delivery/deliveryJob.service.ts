import { logger } from '../../utils/logger.js';
import { prisma } from '../../config/db.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { getSocketManager } from '../../config/socket.js';
import { DeliveryJobData } from '../../types/queue.js';
import { DeliveryJobBroadcast as DeliveryJobBroadcastType } from '../../types/delivery.js';
import { queueService } from '../queues/queue.service.js';

export class DeliveryJobService {
    /**
     * Main method: Broadcast delivery job to available riders
     * Real-world: When vendor clicks "Order Ready", this finds nearby riders and sends them the job
     */
    static async broadcastDeliveryJob(jobData: DeliveryJobData): Promise<void> {
        try {
            logger.info(`Broadcasting delivery job for order ${jobData.orderId}`);

            // Find available riders within reasonable distance
            const availableRiders = await this.findAvailableRiders(jobData);

            if (availableRiders.length === 0) {
                logger.warn(`No available riders found for order ${jobData.orderId}`);
                await this.handleNoRidersAvailable(jobData);
                return;
            }

            // Create delivery job broadcast data
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
                expiresAt: jobData.expiresAt,
                timer: 30, // 30 seconds to accept or reject
                retryCount: 0,
            };

            // Broadcast to all available riders via websocket
            await this.broadcastToRiders(broadcastData, availableRiders);

            // Schedule timeout job for rider acceptance
            await queueService.addOrderTimeout({
                orderId: jobData.orderId,
                timeoutType: 'rider_assignment',
                timeoutMinutes: 1, // 1 minute timeout
            });

            logger.info(`Delivery job broadcasted to ${availableRiders.length} riders for order ${jobData.orderId}`);

        } catch (error) {
            logger.error({ error, orderId: jobData.orderId }, 'Error broadcasting delivery job');
            throw new CustomError('Failed to broadcast delivery job', 500);
        }
    }

    /**
     * Find available riders within reasonable distance
     * Real-world: Like Uber finding nearby drivers, but for food delivery
     */
    private static async findAvailableRiders(jobData: DeliveryJobData): Promise<any[]> {
        try {
            // Comment out or remove the vendor location check
            // const vendor = await prisma.vendor.findUnique({
            //     where: { id: jobData.vendorId },
            //     select: { lat: true, lng: true }
            // });

            // if (!vendor?.lat || !vendor?.lng) {
            //     logger.warn(`Vendor ${jobData.vendorId} has no location`);
            //     throw new CustomError('Vendor location not found', 500);
            //     return [];
            // }

            // For now, just find all available riders without distance filtering
            const riders = await prisma.rider.findMany({
                where: {
                    isOnline: true,
                    isAvailable: true,
                    currentLat: { not: null },
                    currentLng: { not: null }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        }
                    }
                }
            });

            // Skip distance calculation for now
            const nearbyRiders = riders.slice(0, 5); // Just take first 5 riders

            return nearbyRiders;
        } catch (error) {
            logger.error({ error, orderId: jobData.orderId }, 'Error finding available riders');
            throw new CustomError('Failed to find available riders', 500);
            return [];
        }
    }

    /**
     * Broadcast delivery job to riders via WebSocket
     * Real-world: Sends popup notification to rider apps
     */
    private static async broadcastToRiders(broadcastData: DeliveryJobBroadcastType, riders: any[]): Promise<void> {
        try {
            // Get socket manager
            const socketManager = getSocketManager();
            
            // Use consistent method
            socketManager.emitToAllRiders('new_delivery_job', broadcastData);
            
            logger.info(`Delivery job broadcasted to ${riders.length} riders for order ${broadcastData.orderId}`);
        } catch (error) {
            logger.error({ error, orderId: broadcastData.orderId }, 'Error broadcasting delivery job');
            throw new CustomError('Failed to broadcast delivery job', 500);
        }
    }

    /**
     * Handle case when no riders are available
     * Real-world: If no drivers are available, notify vendor and customer
     */
    private static async handleNoRidersAvailable(jobData: DeliveryJobData): Promise<void> {
        try {
            // Update order status to indicate no riders available
            await prisma.order.update({
                where: { id: jobData.orderId },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: 'No riders available'
                }
            });

            // Notify vendor and customer
            const socketManager = getSocketManager();

            // Notify vendor
            socketManager.emitToVendor(jobData.vendorId, 'order_cancelled', {
                orderId: jobData.orderId,
                reason: 'No riders available'
            });

            // Notify customer
            socketManager.emitToCustomer(jobData.customerId, 'order_cancelled', {
                orderId: jobData.orderId,
                reason: 'No riders available'
            });

            logger.warn(`No available riders found for order ${jobData.orderId}`);
        } catch (error) {
            logger.error({ error, orderId: jobData.orderId }, 'Error handling no available riders');
            throw new CustomError('Failed to handle no available riders', 500);
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

    /**
     * Handle rider acceptance of delivery job
     * Real-world: When rider taps "Accept" on the popup
     */
    public static async handleRiderAcceptance(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`Rider ${riderId} accepted delivery job for order ${orderId}`);

            // Update order with assigned rider
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    riderId: riderId,
                    status: 'ASSIGNED'
                }
            });

            // Notify customer about assigned rider
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    rider: {
                        include: {
                            user: true
                        }
                    },
                    customer: {
                        include: {
                            user: true
                        }
                    },
                    vendor: true,
                    items: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            })

            if (order) {
                const socketManager = getSocketManager();

                // Notify customer
                socketManager.emitToCustomer(order.customer.userId, 'rider_assigned', {
                    orderId: orderId,
                    rider: {
                        id: order.rider!.id,
                        name: order.rider!.user.name,
                        phone: order.rider!.user.phone
                    }
                });

                // Notify vendor
                socketManager.emitToVendor(order.vendorId, 'rider_assigned', {
                    orderId: orderId,
                    rider: {
                        id: order.rider!.id,
                        name: order.rider!.user.name,
                        phone: order.rider!.user.phone
                    }
                });
            }

            logger.info(`Order ${orderId} assigned to rider ${riderId} successfully`);
        } catch (error) {
            logger.error({ error, orderId: orderId }, 'Error handling rider acceptance');
            throw new CustomError('Failed to handle rider acceptance', 500);
        }
    }

    /**
     * Handle rider rejection of delivery job
     * Real-world: When rider taps "Reject" or ignores the popup
     */
    static async handleRiderRejection(orderId: string, riderId: string): Promise<void> {
        try {
            logger.info(`Rider ${riderId} rejected order ${orderId}`);

            // Find next available rider or retry
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    vendor: true,
                    customer: {
                        include: {
                            user: true
                        }
                    },
                    items: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            });

            if (order && order.status === 'READY_FOR_PICKUP') {
                // Retry with the next available riders
                const jobData: DeliveryJobData = {
                    orderId: order.id,
                    vendorId: order.vendorId,
                    customerId: order.customerId,
                    vendorName: order.vendor.businessName,
                    customerName: order.customer.user.name,
                    pickupAddress: order.vendor.businessAddress || '',
                    deliveryAddress: JSON.stringify(order.deliveryAddress),
                    deliveryFee: order.deliveryFee,
                    distance: 0, // Will be calculated
                    items: order.items.map((item: any) => ({    
                        id: item.id,
                        name: item.menuItem.name,
                        quantity: item.quantity,
                        price: item.unitPrice  // ← Change unitPrice to price
                    })),
                    createdAt: order.createdAt,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
                };

                // Retry broadcasting to other riders
                await queueService.addDeliveryJob(jobData);
            };
        } catch (error) {
            logger.error({ error, orderId: orderId }, 'Error handling rider rejection');
            throw new CustomError('Failed to handle rider rejection', 500);
        }
    }
}