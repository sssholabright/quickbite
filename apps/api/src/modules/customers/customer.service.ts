import { prisma } from '../../config/db.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { logger } from '../../utils/logger.js';

export class CustomerService {
    // Update customer push token
    static async updatePushToken(userId: string, pushToken: string): Promise<any> {
        try {
            // Use transaction to ensure atomic update
            const updatedCustomer = await prisma.$transaction(async (tx) => {
                // Check if customer exists
                const existingCustomer = await tx.customer.findUnique({
                    where: { userId },
                    include: { user: true }
                });

                if (!existingCustomer) {
                    throw new CustomError('Customer not found', 404);
                }

                // Update customer push token
                const updated = await tx.customer.update({
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
                                updatedAt: true
                            }
                        }
                    }
                });

                logger.info(`Customer push token updated: ${updated.user.email}`);

                return {
                    id: updated.id,
                    userId: updated.userId,
                    pushToken: updated.pushToken,
                    user: updated.user,
                    createdAt: updated.createdAt,
                    updatedAt: updated.updatedAt
                };
            });

            return updatedCustomer;
        } catch (error) {
            logger.error({ error, userId }, 'Failed to update customer push token');
            throw error;
        }
    }

    // Get customer push token
    static async getPushToken(userId: string): Promise<string | null> {
        try {
            const customer = await prisma.customer.findUnique({
                where: { userId },
                select: { pushToken: true }
            });

            if (!customer) {
                throw new CustomError('Customer not found', 404);
            }

            return customer.pushToken;
        } catch (error) {
            logger.error({ error, userId }, 'Failed to get customer push token');
            throw error;
        }
    }
}
