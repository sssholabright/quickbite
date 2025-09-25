import { queueService } from '../queues/queue.service.js';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { ResponseHandler } from '../../utils/response.js';
import { RiderService } from './rider.service.js';
import { DeliveryJobService } from '../delivery/deliveryJob.service.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    };
}

interface UpdateRiderStatusData {
    isOnline?: boolean | undefined;
    isAvailable?: boolean | undefined;
}

export class RiderController {
    // Update rider status (online/offline, available/unavailable)
    static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Validate request body
            const updateRiderStatusSchema = z.object({
                isOnline: z.boolean().optional(),
                isAvailable: z.boolean().optional(),
            });

            const validatedData = updateRiderStatusSchema.parse(req.body);
            
            // Update rider status
            const rider = await RiderService.updateRiderStatus(userId, validatedData as UpdateRiderStatusData);
            
            ResponseHandler.success(res as any, rider, 'Rider status updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Get rider status
    static async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
            
            // Get rider status
            const rider = await RiderService.getRiderStatus(userId);
            
            ResponseHandler.success(res as any, rider, 'Rider status retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // 🚀 NEW: Accept delivery job
    static async acceptDeliveryJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { orderId } = req.params;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Validate orderId
            if (!orderId) {
                ResponseHandler.validationError(res as any, 'Validation failed', 'Order ID is required');
                return;
            }

            // Get rider ID from user ID
            const rider = await RiderService.getRiderStatus(userId);
            
            // Accept the delivery job
            await DeliveryJobService.handleRiderAcceptance(orderId, rider.id);
            
            ResponseHandler.success(res as any, { orderId, riderId: rider.id }, 'Delivery job accepted successfully');
            
        } catch (error) {
            logger.error({ error, orderId: req.params.orderId, userId: req.user?.userId }, 'Failed to accept delivery job');
            next(error);
        }
    }

    // 🚀 NEW: Reject delivery job
    static async rejectDeliveryJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { orderId } = req.params;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Validate orderId
            if (!orderId) {
                ResponseHandler.validationError(res as any, 'Validation failed', 'Order ID is required');
                return;
            }

            // Get rider ID from user ID
            const rider = await RiderService.getRiderStatus(userId);
            
            // Reject the delivery job
            await DeliveryJobService.handleRiderRejection(orderId, rider.id);
            
            ResponseHandler.success(res as any, { orderId, riderId: rider.id }, 'Delivery job rejected successfully');
            
        } catch (error) {
            logger.error({ error, orderId: req.params.orderId, userId: req.user?.userId }, 'Failed to reject delivery job');
            next(error);
        }
    }

    // 🚀 NEW: Update rider location
    static async updateLocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Validate request body
            const updateLocationSchema = z.object({
                latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
                longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
                orderId: z.string().optional(), // Optional - for active deliveries
            });

            const { latitude, longitude, orderId } = updateLocationSchema.parse(req.body);

            // Get rider ID from user ID
            const rider = await RiderService.getRiderStatus(userId);

            // Update rider location in database
            await RiderService.updateRiderLocation(rider.id, latitude, longitude);

            // If rider is on an active delivery, queue location update for real-time broadcasting
            if (orderId) {
                await queueService.addLocationUpdate({
                    riderId: rider.id, 
                    orderId: orderId, 
                    latitude: latitude, 
                    longitude: longitude,
                    timestamp: new Date()
                });
            }

            ResponseHandler.success(res as any, { 
                riderId: rider.id, 
                location: { latitude, longitude },
                timestamp: new Date()
            }, 'Location updated successfully');
            
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }

            logger.error({ error, userId: req.user?.userId }, 'Failed to update rider location');
            next(error);
        }
    }

    // 🚀 NEW: Get rider's current location
    static async getCurrentLocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Get rider status (includes current location)
            const rider = await RiderService.getRiderStatus(userId);

            if (!rider.currentLat || !rider.currentLng) {
                ResponseHandler.notFound(res as any, 'Current location not found');
                return;
            }

            // Get rider's current location
            ResponseHandler.success(res as any, {
                riderId: rider.id,
                location: {
                    latitude: rider.currentLat,
                    longitude: rider.currentLng,
                },
                isOnline: rider.isOnline,
                isAvailable: rider.isAvailable
            }, 'Rider location retrieved successfully');
            
        } catch (error) {
            logger.error({ error, userId: req.user?.userId }, 'Failed to get rider current location');
            next(error);
        }
    }
}