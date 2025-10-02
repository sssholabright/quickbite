import { ActionResponse, CreateRiderRequest, RiderDetails, RiderListItem, RidersListParams, RidersListResponse, UpdateRiderRequest } from "../../../types/admin/rider.js";
import { prisma } from "../../../config/db.js";
import { CustomError } from "../../../middlewares/errorHandler.js";
import { logger } from "../../../utils/logger.js";
import { PasswordService } from "../../../utils/password.js";

export class RiderService {
    // Get list of riders
    static async getRidersList(params: RidersListParams): Promise<RidersListResponse> {
        try {
            const {
                page = 1,
                limit = 20,
                filters = {},
                sort = { field: 'createdAt', direction: 'desc' }
            } = params;

            const skip = (page - 1) * limit;

            // Build where clause for filters
            const where: any = {};

            // Handle search term
            if (filters.search && filters.search.trim() !== '') {
                where.OR = [
                    { 
                        user: {
                            name: { contains: filters.search, mode: 'insensitive' }
                        }
                    },
                    { 
                        user: {
                            phone: { contains: filters.search, mode: 'insensitive' }
                        }
                    },
                    { 
                        user: {
                            email: { contains: filters.search, mode: 'insensitive' }
                        }
                    },
                    {
                        company: {
                            name: { contains: filters.search, mode: 'insensitive' }
                        }
                    }
                ];
            }

            // Handle company filter
            if (filters.companyId && filters.companyId.trim() !== '') {
                where.companyId = filters.companyId;
            }

            // Handle status filter
            if (filters.status && filters.status.trim() !== '') {
                where.status = filters.status;
            }

            // Handle online status filter
            if (filters.isOnline !== undefined) {
                where.isOnline = filters.isOnline;
            }

            // Build orderBy clause
            const orderBy: any = {};
            if (sort.field === 'name') {
                orderBy.user = { name: sort.direction };
            } else if (sort.field === 'earnings') {
                orderBy.earnings = sort.direction;
            } else if (sort.field === 'rating') {
                orderBy.rating = sort.direction;
            } else {
                orderBy[sort.field] = sort.direction;
            }

            // Get riders with related data
            const [riders, total] = await Promise.all([
                prisma.rider.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        user: true,
                        company: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        _count: {
                            select: {
                                orders: {
                                    where: {
                                        status: 'DELIVERED'
                                    }
                                }
                            }
                        }
                    }
                }),
                prisma.rider.count({ where })
            ]);

            // Transform riders to match response format
            const riderList: RiderListItem[] = riders.map(rider => ({
                id: rider.id,
                name: rider.user?.name,
                phone: rider.user?.phone || '',
                email: rider.user?.email,
                vehicleType: rider.vehicleType as 'BIKE' | 'CAR' | 'MOTORCYCLE',
                isOnline: rider.isOnline,
                // status: rider?.status as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED',
                earningsTotal: rider.earnings,
                completedOrders: rider._count.orders,
                cancelledOrders: 0, // This will be calculated separately if needed
                company: rider.company ? {
                    id: rider.company.id,
                    name: rider.company.name
                } : undefined,
                createdAt: rider.createdAt.toISOString(),
                updatedAt: rider.updatedAt.toISOString()
            }));

            const totalPages = Math.ceil(total / limit);

            return {
                data: riderList,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        } catch (error) {
            logger.error({ error }, 'Failed to get riders list');
            throw new CustomError('Failed to get riders list', 500);
        }
    }

    // Get single rider details
    static async getRiderDetails(riderId: string): Promise<RiderDetails> {
        try {
            const rider = await prisma.rider.findUnique({
                where: { id: riderId },
                include: {
                    user: true,
                    company: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            orders: {
                                where: {
                                    status: 'DELIVERED'
                                }
                            }
                        }
                    }
                }
            });

            if (!rider) {
                throw new CustomError('Rider not found', 404);
            }

            const riderDetails: RiderDetails = {
                id: rider.id,
                name: rider.user.name,
                phone: rider.user.phone || '',
                email: rider.user.email,
                vehicleType: rider.vehicleType as 'BIKE' | 'CAR' | 'MOTORCYCLE',
                isOnline: rider.isOnline,
                // status: rider.status as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED',
                earningsTotal: rider.earnings,
                completedOrders: rider._count.orders,
                cancelledOrders: 0,
                currentOrderId: rider.currentOrderId || '',
                bankAccount: rider.bankAccount || '',
                company: rider.company ? {
                    id: rider.company.id,
                    name: rider.company.name
                } : undefined,
                createdAt: rider.createdAt.toISOString(),
                updatedAt: rider.updatedAt.toISOString()
            };

            return riderDetails;
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to get rider details');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to get rider details', 500);
        }
    }

    // Create new rider
    static async createRider(request: CreateRiderRequest): Promise<RiderDetails> {
        try {
            const { name, phone, email, password, companyId, vehicleType, bankAccount } = request;

            // Check if company exists
            const company = await prisma.logisticsCompany.findUnique({
                where: { id: companyId }
            });

            if (!company) {
                throw new CustomError('Logistics company not found', 404);
            }

            if (company.status !== 'ACTIVE') {
                throw new CustomError('Cannot create rider for inactive company', 400);
            }

            // Hash password
            const hashedPassword = await PasswordService.hashPassword(password);

            // Create user and rider in transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create user
                const user = await tx.user.create({
                    data: {
                        name,
                        phone,
                        email,
                        password: hashedPassword,
                        role: 'RIDER'
                    }
                });

                // Create rider
                const rider = await tx.rider.create({
                    data: {
                        userId: user.id,
                        companyId,
                        vehicleType,
                        bankAccount: bankAccount || null,
                        // status: 'ACTIVE',
                        isOnline: false,
                        earnings: 0
                    },
                    include: {
                        user: true,
                        company: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });

                return rider;
            });

            // Return rider details
            const riderDetails: RiderDetails = {
                id: result.id,
                name: result.user?.name || '',
                phone: result.user?.phone || '',
                email: result.user?.email || '',
                vehicleType: result.vehicleType as 'BIKE' | 'CAR' | 'MOTORCYCLE',
                isOnline: result.isOnline,
                // status: result.status as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED',
                earningsTotal: result.earnings,
                completedOrders: 0,
                cancelledOrders: 0,
                currentOrderId: result.currentOrderId || '',
                bankAccount: result.bankAccount || '',
                company: result.company ? {
                    id: result.company?.id || '',
                    name: result.company?.name
                } : undefined,
                createdAt: result.createdAt.toISOString(),
                updatedAt: result.updatedAt.toISOString()
            };

            return riderDetails;
        } catch (error) {
            logger.error({ error }, 'Failed to create rider');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to create rider', 500);
        }
    }

    // Update the updateRider method to handle company changes
    static async updateRider(riderId: string, request: UpdateRiderRequest): Promise<RiderDetails> {
        try {
            const { name, phone, email, vehicleType, bankAccount, status, companyId } = request;

            const rider = await prisma.rider.findUnique({
                where: { id: riderId },
                include: { user: true }
            });

            if (!rider) {
                throw new CustomError('Rider not found', 404);
            }

            // If companyId is provided, check if the new company exists and is active
            if (companyId && companyId !== rider.companyId) {
                const newCompany = await prisma.logisticsCompany.findUnique({
                    where: { id: companyId }
                });

                if (!newCompany) {
                    throw new CustomError('Logistics company not found', 404);
                }

                if (newCompany.status !== 'ACTIVE') {
                    throw new CustomError('Cannot assign rider to inactive company', 400);
                }
            }

            // Update rider and user data
            const result = await prisma.$transaction(async (tx) => {
                // Update user if name, phone, or email provided
                if (name || phone || email) {
                    await tx.user.update({
                        where: { id: rider.userId },
                        data: {
                            ...(name && { name }),
                            ...(phone && { phone }),
                            ...(email && { email })
                        }
                    });
                }

                // Update rider
                const updatedRider = await tx.rider.update({
                    where: { id: riderId },
                    data: {
                        ...(vehicleType && { vehicleType }),
                        ...(bankAccount !== undefined && { bankAccount }),
                        ...(status && { status }),
                        ...(companyId && { companyId }) // Add this line
                    },
                    include: {
                        user: true,
                        company: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });

                return updatedRider;
            });

            // Return updated rider details
            const riderDetails: RiderDetails = {
                id: result.id,
                name: result.user.name,
                phone: result.user.phone || '',
                email: result.user.email,
                vehicleType: result.vehicleType as 'BIKE' | 'CAR' | 'MOTORCYCLE',
                isOnline: result.isOnline,
                // status: result.status as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED',
                earningsTotal: result.earnings,
                completedOrders: 0,
                cancelledOrders: 0,
                currentOrderId: result.currentOrderId || '',
                bankAccount: result.bankAccount || '',
                company: result.company ? {
                    id: result.company.id,
                    name: result.company.name
                } : undefined,
                createdAt: result.createdAt.toISOString(),
                updatedAt: result.updatedAt.toISOString()
            };

            return riderDetails;
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to update rider');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update rider', 500);
        }
    }

    // Suspend rider
    static async suspendRider(riderId: string, reason?: string): Promise<ActionResponse> {
        try {
            const rider = await prisma.rider.findUnique({
                where: { id: riderId }
            });

            if (!rider) {
                throw new CustomError('Rider not found', 404);
            }

            // if (rider.status === 'SUSPENDED') {
            //     throw new CustomError('Rider is already suspended', 400);
            // }

            await prisma.rider.update({
                where: { id: riderId },
                data: {
                    // status: 'SUSPENDED',
                    isOnline: false // Force offline when suspended
                }
            });

            return {
                success: true,
                message: 'Rider suspended successfully',
                data: { reason }
            };
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to suspend rider');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to suspend rider', 500);
        }
    }

    // Activate rider
    static async activateRider(riderId: string): Promise<ActionResponse> {
        try {
            const rider = await prisma.rider.findUnique({
                where: { id: riderId }
            });

            if (!rider) {
                throw new CustomError('Rider not found', 404);
            }

            // if (rider.status === 'ACTIVE') {
            //     throw new CustomError('Rider is already active', 400);
            // }

            await prisma.rider.update({
                where: { id: riderId },
                data: {
                    // status: 'ACTIVE'
                    isAvailable: true
                }
            });

            return {
                success: true,
                message: 'Rider activated successfully'
            };
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to activate rider');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to activate rider', 500);
        }
    }

    // Block rider
    static async blockRider(riderId: string, reason?: string): Promise<ActionResponse> {
        try {
            const rider = await prisma.rider.findUnique({
                where: { id: riderId }
            });

            if (!rider) {
                throw new CustomError('Rider not found', 404);
            }

            // if (rider.status === 'BLOCKED') {
            //     throw new CustomError('Rider is already blocked', 400);
            // }

            await prisma.rider.update({
                where: { id: riderId },
                data: {
                    // status: 'BLOCKED',
                    isOnline: false // Force offline when blocked
                }
            });

            return {
                success: true,
                message: 'Rider blocked successfully',
                data: { reason }
            };
        } catch (error) {
            logger.error({ error, riderId }, 'Failed to block rider');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to block rider', 500);
        }
    }
}