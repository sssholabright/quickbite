import redisService from "../../config/redis.js";
import { logger } from "../../utils/logger.js";
import { CustomError } from "../../middlewares/errorHandler.js";
import { LocationUpdateJobData } from "../../types/queue.js";
import { getSocketManager } from "../../config/socket.js";

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

            // Trim history to last 50 locations
            const historyLength = await redisService.lLen(`rider:${data.riderId}:history`);
            if (historyLength > 50) {
                // Remove oldest entries
                for (let i = 50; i < historyLength; i++) {
                    await redisService.rPop(`rider:${data.riderId}:history`);
                }
            }

            // Broadcast location update to customer if rider is on an active delivery
            await this.broadcastLocationToCustomer(data);

            logger.info(`Location update processed for rider ${data.riderId}`);
        } catch (error) {
            logger.error({ error }, 'Location update processing error');
            throw new CustomError('Failed to process location update', 500);
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

            const order = await prisma.order.findUnique({
                where: { 
                    id: data.orderId,
                    riderId: data.riderId,
                    status: {
                        in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY']
                    }
                },
                include: {
                    customer: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            if (!order) {
                logger.warn(`Order ${data.orderId} not found or not active`);
                return;
            }
           
            // Broadcast to customer using consistent method
            const socketManager = getSocketManager();
            socketManager.emitToCustomer(order.customer.userId, 'rider_location_update', {
                orderId: data.orderId,
                riderId: data.riderId,
                location: {
                    lat: data.latitude,
                    lng: data.longitude
                }
            });
        } catch (error) {
            logger.error({ error }, 'Location update broadcasting error');
            throw new CustomError('Failed to broadcast location update', 500);
        }
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
            logger.error({ error }, 'Failed to get rider current location');
            return null;
        }
    }

    /**
     * Get rider's location history
     * Real-world: For showing route trail on customer's map
     */
    static async getRiderLocationHistory(riderId: string, limit: number = 20): Promise<any[]> {
        try {
            // Get recent locations using lRange
            const history = await redisService.getClient().lRange(`rider:${riderId}:history`, -limit, -1);
            return history
                .map((location) => JSON.parse(location))
                .reverse(); // Most recent first
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to get rider location history');
            return [];
        }
    }
}