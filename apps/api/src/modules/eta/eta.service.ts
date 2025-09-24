import { getSocketManager } from "../../config/socket.js";
import { CustomError } from "../../middlewares/errorHandler.js";
import { ETAUpdateJobData } from "../../types/queue.js";
import { logger } from "../../utils/logger.js";

export class ETAService {
    /**
     * Process ETA update
     * Real-world: Calculates estimated arrival time and updates customer's app
     */
    static async processETAUpdate(data: ETAUpdateJobData): Promise<void> {
        try {
            logger.info(`Processing ETA update for order ${data.orderId}`);

            // Calculate ETA using Haversine formula (straight line distance)
            const eta = this.calculateETA(data);

            // Broadcast ETA update to customer
            await this.broadcastETAUpdate(data.orderId, data.riderId, eta);

            logger.info(`ETA update processed for order ${data.orderId}`);
        } catch (error) {
            logger.error({ error }, 'Failed to process ETA update');
            throw new CustomError('Failed to process ETA update', 500);
        }
    }

    /**
     * Calculate ETA using Haversine formula
     * Real-world: Estimates time based on straight-line distance and average speed
     */
    private static calculateETA(data: ETAUpdateJobData): { minutes: number, distance: number } {
        // For now, use simple calculation
        // In production, you'd use Google Distance Matrix API for real road times
        const distance = data.distance;
        const averageSpeedKmh = 25; // Average speed in km/h
        const minutes = Math.ceil((distance / averageSpeedKmh) * 60);

        return {
            minutes: Math.max(1, minutes), // At least 1 minute
            distance: distance, // At least 0.1 km
        }
    }

    /**    
     * Broadcast ETA update to customer
     * Real-world: Updates the countdown timer in customer's app
     */
    private static async broadcastETAUpdate(orderId: string, customerId: string, eta: { minutes: number, distance: number }): Promise<void> {
        try {
            const socketManager = getSocketManager();

            // Use consistent method
            socketManager.emitToCustomer(customerId, 'eta_update', {
                orderId: orderId,
                eta: eta.minutes,
                distance: eta.distance,
                estimatedArrival: new Date(Date.now() + eta.minutes * 60 * 1000)
            });

            logger.info(`ETA update broadcasted to customer ${customerId} for order ${orderId}`);
        } catch (error) {
            logger.error({ error }, 'Failed to broadcast ETA update');
            throw new CustomError('Failed to broadcast ETA update', 500);
        }
    }
}