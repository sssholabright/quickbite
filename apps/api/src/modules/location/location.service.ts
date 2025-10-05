import { logger } from '../../utils/logger.js';
import { redisService } from '../../config/redis.js';
import { getSocketManager } from '../../config/socket.js';
import { LocationUpdateJobData } from '../../types/queue.js';

export class LocationService {
    /**
     * Process rider location update
     * Real-world: When rider's phone sends GPS coordinates, this updates Redis and broadcasts to customer
     */
    static async processLocationUpdate(data: LocationUpdateJobData): Promise<void> {
        try {
            logger.info(`Processing location update for rider ${data.riderId}`);

            // Store location in Redis for fast access
            await redisService.hSet(
                `rider:${data.riderId}:location`,
                'current',
                JSON.stringify({
                    lat: data.latitude,
                    lng: data.longitude,
                    timestamp: data.timestamp
                })
            );

            // Store location history (keep last 50 locations)
            await redisService.lPush(
                `rider:${data.riderId}:history`,
                JSON.stringify({
                    lat: data.latitude,
                    lng: data.longitude,
                    timestamp: data.timestamp
                })
            );

            // Trim history to last 50 entries
            const historyLength = await redisService.lLen(`rider:${data.riderId}:history`);
            if (historyLength > 50) {
                // Remove oldest entries by trimming the list
                await redisService.lTrim(`rider:${data.riderId}:history`, 0, 49);
            }

            // Broadcast location update to customer if rider is on an active delivery
            await this.broadcastLocationToCustomer(data);

            // Calculate and broadcast ETA update
            await this.calculateAndBroadcastETA(data);

            logger.info(`Location update processed for rider ${data.riderId}`);

        } catch (error) {
            logger.error({ error, riderId: data.riderId }, 'Failed to process location update');
            throw error;
        }
    }

    /**
     * Broadcast rider location to customer
     * Real-world: Updates the customer's map with rider's current position
     */
    private static async broadcastLocationToCustomer(data: LocationUpdateJobData): Promise<void> {
        try {
            // Get order details to find customer
            const { prisma } = await import('../../config/db.js');
            
            const order = await prisma.order.findFirst({
                where: {
                    id: data.orderId,
                    riderId: data.riderId,
                    status: { in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] }
                },
                include: {
                    customer: {
                        include: { user: true }
                    }
                }
            });

            if (!order) {
                logger.info(`No active order found for rider ${data.riderId} and order ${data.orderId}`);
                return; // No active order for this rider
            }

            // Broadcast to customer
            const socketManager = getSocketManager();
            socketManager.getIO().to(`customer:${order.customer.userId}`).emit('rider_location_update', {
                orderId: data.orderId,
                riderId: data.riderId,
                location: {
                    lat: data.latitude,
                    lng: data.longitude
                },
                timestamp: data.timestamp
            });

            logger.info(`Location broadcasted to customer for order ${data.orderId}`);

        } catch (error) {
            logger.error({ error, riderId: data.riderId, orderId: data.orderId }, 'Failed to broadcast location to customer');
        }
    }

    /**
     * Calculate and broadcast ETA update
     * Real-world: Recalculates estimated arrival time based on rider's current position
     */
    private static async calculateAndBroadcastETA(data: LocationUpdateJobData): Promise<void> {
        try {
            const { prisma } = await import('../../config/db.js');
            
            const order = await prisma.order.findFirst({
                where: {
                    id: data.orderId,
                    riderId: data.riderId,
                    status: { in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] }
                },
                include: {
                    customer: {
                        include: { user: true }
                    },
                    vendor: true
                }
            });

            if (!order) {
                logger.info(`No active order found for ETA calculation - rider ${data.riderId}, order ${data.orderId}`);
                return; // No active order for this rider
            }

            // Calculate distance to customer
            const deliveryAddress = order.deliveryAddress as any;
            if (!deliveryAddress?.lat || !deliveryAddress?.lng) {
                logger.warn(`Order ${data.orderId} has invalid delivery address`);
                return;
            }

            const distance = this.calculateDistance(
                data.latitude, data.longitude,
                deliveryAddress.lat, deliveryAddress.lng
            );

            // Calculate ETA (simple calculation - in production use Google Distance Matrix API)
            const averageSpeedKmh = 25; // Average city speed
            const etaMinutes = Math.ceil((distance / averageSpeedKmh) * 60);

            // Broadcast ETA update to customer
            const socketManager = getSocketManager();
            socketManager.getIO().to(`customer:${order.customer.userId}`).emit('eta_update', {
                orderId: data.orderId,
                eta: Math.max(1, etaMinutes), // At least 1 minute
                distance: distance,
                estimatedArrival: new Date(Date.now() + etaMinutes * 60 * 1000),
                riderLocation: {
                    lat: data.latitude,
                    lng: data.longitude
                },
                timestamp: new Date().toISOString()
            });

            logger.info(`ETA update broadcasted for order ${data.orderId}: ${etaMinutes} minutes`);

        } catch (error) {
            logger.error({ error, riderId: data.riderId, orderId: data.orderId }, 'Failed to calculate and broadcast ETA');
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     * Real-world: Calculates straight-line distance between rider and destination
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
     * Get rider's current location from Redis
     * Real-world: Fast lookup of rider's current position without hitting database
     */
    static async getRiderCurrentLocation(riderId: string): Promise<any> {
        try {
            const locationData = await redisService.hGet(`rider:${riderId}:location`, 'current');
            return locationData ? JSON.parse(locationData) : null;
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to get rider current location');
            return null;
        }
    }

    /**
     * Get rider's location history - Use proper list operations
     * Real-world: For showing route trail on customer's map
     */
    static async getRiderLocationHistory(riderId: string, limit: number = 20): Promise<any[]> {
        try {
            // Get recent locations from Redis list
            const historyLength = await redisService.lLen(`rider:${riderId}:history`);
            
            if (historyLength === 0) {
                return [];
            }

            // Get the most recent locations (Redis lists are FIFO, so we want the last N items)
            const startIndex = Math.max(0, historyLength - limit);
            const endIndex = historyLength - 1;
            
            // Use LRANGE to get a range of items from the list
            const rawHistory = await redisService.lRange(`rider:${riderId}:history`, startIndex, endIndex);
            
            return rawHistory.map((item: string) => JSON.parse(item)).reverse(); // Most recent first
            
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to get rider location history');
            return [];
        }
    }

    /**
     * Get rider's location for a specific order
     * Real-world: Customer can see rider's current position and route
     */
    static async getRiderLocationForOrder(orderId: string): Promise<any> {
        try {
            const { prisma } = await import('../../config/db.js');
            
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { rider: true }
            });

            if (!order || !order.riderId) {
                return null;
            }

            const currentLocation = await this.getRiderCurrentLocation(order.riderId);
            const locationHistory = await this.getRiderLocationHistory(order.riderId, 20);

            return {
                riderId: order.riderId,
                currentLocation,
                locationHistory,
                orderStatus: order.status
            };

        } catch (error) {
            logger.error({ error, orderId }, 'Failed to get rider location for order');
            return null;
        }
    }
}