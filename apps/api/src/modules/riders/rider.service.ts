import { logger } from '../../utils/logger.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { prisma } from '../../config/db.js';
import { getSocketManager } from '../../config/socket.js';

interface UpdateRiderStatusData {
    isOnline?: boolean | undefined;
    isAvailable?: boolean | undefined;
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
                        ...(updateData.isAvailable !== undefined && { isAvailable: updateData.isAvailable }),
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

                // Log the update for debugging
                logger.info(`Rider status updated: ${existingRider.user.email} - Online: ${updated.isOnline}, Available: ${updated.isAvailable}`);
                
                // 🚀 NEW: Check for waiting orders when rider comes online and available
                if (updated.isOnline && updated.isAvailable) {
                    try {
                        const { DeliveryJobService } = await import('../delivery/deliveryJob.service.js');
                        await DeliveryJobService.checkWaitingOrders();
                        logger.info(`Checked for waiting orders after rider ${updated.id} came online`);
                    } catch (error) {
                        logger.warn({ error }, 'Failed to check waiting orders');
                    }
                }
                
                // 🚀 NEW: Emit rider_status_change event after status update
                try {
                    const socketManager = getSocketManager();
                    socketManager.emitToRider(updated.id, 'rider_status_change', {
                        isOnline: updated.isOnline,
                        isAvailable: updated.isAvailable
                    });
                    logger.info(`📡 Emitted rider_status_change to rider ${updated.id}`);
                } catch (socketError) {
                    logger.warn({ error: socketError }, 'Failed to emit rider_status_change event');
                }
                
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
                isAvailable: updatedRider.isAvailable,
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
                isAvailable: rider.isAvailable,
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
}
