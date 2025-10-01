import { logger } from '../../utils/logger.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { prisma } from '../../config/db.js';
import { getSocketManager } from '../../config/socket.js';

interface UpdateRiderStatusData {
    isOnline?: boolean | undefined;
}

interface UpdateRiderLocationData {
    latitude: number;
    longitude: number;
}

export class RiderService {
    // Update rider status with transaction to prevent race conditions
    static async updateRiderStatus(userId: string, updateData: UpdateRiderStatusData): Promise<any> {
        try {
            // Use transaction to ensure atomic update
            const updatedRider = await prisma.$transaction(async (tx) => {
                // Check if rider exists
                const existingRider = await tx.rider.findUnique({
                    where: { userId },
                    include: { user: true }
                });

                if (!existingRider) {
                    throw new CustomError('Rider not found', 404);
                }

                // Update rider status
                const updated = await tx.rider.update({
                    where: { userId },
                    data: {
                        ...(updateData.isOnline !== undefined && { isOnline: updateData.isOnline }),
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                phone: true,
                                avatar: true,
                                role: true,
                                isActive: true,
                                createdAt: true,
                                updatedAt: true,
                            }
                        }
                    }
                });

                // 🚀 REMOVED: Don't emit rider_status_change here - let socket handler do it
                // The socket handler will call EventManagerService.handleRiderStatusChange()
                
                logger.info(`📡 Rider status updated in database: ${updated.id} - Online: ${updated.isOnline}`);
                
                return updated;
            });

            return updatedRider;
        } catch (error: any) {
            logger.error({ error, userId }, 'Error updating rider status');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update rider status', 500);
        }
    }

    // 🚀 NEW: Update rider location
    static async updateRiderLocation(riderId: string, latitude: number, longitude: number): Promise<any> {
        try {
            // Check if rider exists
            const existingRider = await prisma.rider.findUnique({
                where: { id: riderId },
                include: { user: true }
            });

            if (!existingRider) {
                throw new CustomError('Rider not found', 404);
            }

            // Update rider location
            const updatedRider = await prisma.rider.update({
                where: { id: riderId },
                data: {
                    currentLat: latitude,
                    currentLng: longitude,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            phone: true,
                            avatar: true,
                            role: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });

            logger.info(`Rider location updated: ${updatedRider.user.email} - Lat: ${latitude}, Lng: ${longitude}`);

            return {
                id: updatedRider.id,
                userId: updatedRider.userId,
                vehicleType: updatedRider.vehicleType,
                isOnline: updatedRider.isOnline,
                currentLat: updatedRider.currentLat,
                currentLng: updatedRider.currentLng,
                bankAccount: updatedRider.bankAccount,
                earnings: updatedRider.earnings,
                completedOrders: updatedRider.completedOrders,
                rating: updatedRider.rating,
                createdAt: updatedRider.createdAt,
                updatedAt: updatedRider.updatedAt,
                user: updatedRider.user
            };
        } catch (error: any) {
            logger.error({ error }, 'Update rider location error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update rider location', 500);
        }
    }

    // Get rider status
    static async getRiderStatus(userId: string): Promise<any> {
        try {
            const rider = await prisma.rider.findUnique({
                where: { userId },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            phone: true,
                            avatar: true,
                            role: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });

            if (!rider) {
                throw new CustomError('Rider not found', 404);
            }

            return {
                id: rider.id,
                userId: rider.userId,
                vehicleType: rider.vehicleType,
                isOnline: rider.isOnline,
                currentLat: rider.currentLat,
                currentLng: rider.currentLng,
                bankAccount: rider.bankAccount,
                earnings: rider.earnings,
                completedOrders: rider.completedOrders,
                rating: rider.rating,
                createdAt: rider.createdAt,
                updatedAt: rider.updatedAt,
                user: rider.user
            };
        } catch (error: any) {
            logger.error({ error }, 'Get rider status error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to get rider status', 500);
        }
    }

    // 🚀 NEW: Update rider push token
    static async updatePushToken(userId: string, pushToken: string): Promise<any> {
        try {
            // Check if rider exists
            const existingRider = await prisma.rider.findUnique({
                where: { userId },
                include: { user: true }
            });

            if (!existingRider) {
                throw new CustomError('Rider not found', 404);
            }

            // Update push token
            const updatedRider = await prisma.rider.update({
                where: { userId },
                data: { pushToken },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            phone: true,
                            avatar: true,
                            role: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });

            logger.info(`Push token updated for rider: ${updatedRider.user.email}`);

            return {
                id: updatedRider.id,
                userId: updatedRider.userId,
                vehicleType: updatedRider.vehicleType,
                isOnline: updatedRider.isOnline,
                currentLat: updatedRider.currentLat,
                currentLng: updatedRider.currentLng,
                bankAccount: updatedRider.bankAccount,
                earnings: updatedRider.earnings,
                completedOrders: updatedRider.completedOrders,
                rating: updatedRider.rating,
                pushToken: updatedRider.pushToken,
                createdAt: updatedRider.createdAt,
                updatedAt: updatedRider.updatedAt,
                user: updatedRider.user
            };
        } catch (error: any) {
            logger.error({ error, userId }, 'Error updating rider push token');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update push token', 500);
        }
    }

    // 🚀 NEW: Get rider push token
    static async getPushToken(userId: string): Promise<string | null> {
        try {
            const rider = await prisma.rider.findUnique({
                where: { userId },
                select: { pushToken: true }
            });

            if (!rider) {
                throw new CustomError('Rider not found', 404);
            }

            return rider.pushToken;
        } catch (error: any) {
            logger.error({ error, userId }, 'Error getting rider push token');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to get push token', 500);
        }
    }
}