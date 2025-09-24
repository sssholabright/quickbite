import { logger } from '../../utils/logger.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { prisma } from '../../config/db.js';

interface UpdateRiderStatusData {
    isOnline?: boolean | undefined;
    isAvailable?: boolean | undefined;
}

export class RiderService {
    // Update rider status
    static async updateRiderStatus(userId: string, updateData: UpdateRiderStatusData): Promise<any> {
        try {
            // Check if rider exists
            const existingRider = await prisma.rider.findUnique({
                where: { userId },
                include: { user: true }
            });

            if (!existingRider) {
                throw new CustomError('Rider not found', 404);
            }

            // Update rider status
            const updatedRider = await prisma.rider.update({
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

            logger.info(`Rider status updated: ${updatedRider.user.email} - Online: ${updatedRider.isOnline}, Available: ${updatedRider.isAvailable}`);

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
            logger.error({ error }, 'Update rider status error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update rider status', 500);
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
