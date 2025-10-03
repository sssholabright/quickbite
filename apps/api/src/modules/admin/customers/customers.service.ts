import { PrismaClient, CustomerStatus } from '@prisma/client';
import { CustomersListParams, CustomersListResponse, UpdateCustomerRequest, CustomerDetails, ActionResponse } from '../../../types/admin/customers.js';
import { CustomError } from '../../../middlewares/errorHandler.js';

const prisma = new PrismaClient();

export class CustomersService {
    // Get list of customers with pagination, filters, and sorting
    async getCustomersList(params: CustomersListParams): Promise<CustomersListResponse> {
        const { page, limit, filters, sort } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (filters.search) {
            where.OR = [
                { user: { name: { contains: filters.search, mode: 'insensitive' } } },
                { user: { email: { contains: filters.search, mode: 'insensitive' } } },
                { user: { phone: { contains: filters.search, mode: 'insensitive' } } }
            ];
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
            where.createdAt = {
                gte: new Date(filters.dateRange.start),
                lte: new Date(filters.dateRange.end)
            };
        }

        // Get total count
        const total = await prisma.customer.count({ where });

        // Get customers
        const customers = await prisma.customer.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true
                    }
                }
            },
            orderBy: {
                [sort.field === 'name' ? 'user' : sort.field]: sort.field === 'name' ? { name: sort.direction } : sort.direction
            },
            skip,
            take: limit
        });

        const data = customers.map(customer => {
            const completionRate = customer.totalOrders > 0 
                ? (customer.completedOrders / customer.totalOrders) * 100 
                : 0;

            return {
                id: customer.id,
                name: customer.user.name,
                email: customer.user.email,
                phone: customer.user.phone,
                status: customer.status as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'VERIFICATION_PENDING',
                avatar: customer.user.avatar,
                dateOfBirth: customer.dateOfBirth?.toISOString() || null,
                totalOrders: customer.totalOrders,
                completedOrders: customer.completedOrders,
                cancelledOrders: customer.cancelledOrders,
                totalSpent: customer.totalSpent,
                avgOrderValue: customer.avgOrderValue,
                completionRate,
                createdAt: customer.createdAt.toISOString(),
                updatedAt: customer.updatedAt.toISOString()
            };
        });

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Get customer details
    async getCustomerDetails(customerId: string): Promise<CustomerDetails> {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        isActive: true
                    }
                },
                addresses: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        state: true,
                        country: true,
                        isDefault: true,
                        lat: true,
                        lng: true
                    }
                },
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        total: true,
                        createdAt: true,
                        vendor: {
                            select: {
                                businessName: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!customer) {
            throw new CustomError('Customer not found', 404);
        }

        const completionRate = customer.totalOrders > 0 
            ? (customer.completedOrders / customer.totalOrders) * 100 
            : 0;

        const lastOrder = customer.orders.length > 0 ? customer.orders[0] : null;

        return {
            id: customer.id,
            name: customer.user.name,
            email: customer.user.email,
            phone: customer.user.phone,
            status: customer.status as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'VERIFICATION_PENDING',
            avatar: customer.user.avatar,
            dateOfBirth: customer.dateOfBirth?.toISOString() || null,
            totalOrders: customer.totalOrders,
            completedOrders: customer.completedOrders,
            cancelledOrders: customer.cancelledOrders,
            totalSpent: customer.totalSpent,
            avgOrderValue: customer.avgOrderValue,
            completionRate,
            createdAt: customer.createdAt.toISOString(),
            updatedAt: customer.updatedAt.toISOString(),
            user: {
                id: customer.user.id,
                isActive: customer.user.isActive
            },
            performance: {
                totalOrders: customer.totalOrders,
                completedOrders: customer.completedOrders,
                cancelledOrders: customer.cancelledOrders,
                totalSpent: customer.totalSpent,
                avgOrderValue: customer.avgOrderValue,
                completionRate,
                lastOrderDate: lastOrder?.createdAt.toISOString() || null
            },
            addresses: customer.addresses.map(addr => ({
                id: addr.id,
                title: addr.title,
                address: addr.address,
                city: addr.city,
                state: addr.state,
                country: addr.country,
                isDefault: addr.isDefault,
                lat: addr.lat,
                lng: addr.lng
            })),
            recentOrders: customer.orders.map(order => ({
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                total: order.total || 0,
                vendorName: order.vendor.businessName,
                createdAt: order.createdAt.toISOString()
            }))
        };
    }

    // Update customer
    async updateCustomer(customerId: string, data: UpdateCustomerRequest): Promise<ActionResponse> {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { user: true }
        });

        if (!customer) {
            throw new CustomError('Customer not found', 404);
        }

        // Check if email or phone is being changed and already exists
        if (data.email || data.phone) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    AND: [
                        { id: { not: customer.userId } },
                        {
                            OR: [
                                ...(data.email ? [{ email: data.email }] : []),
                                ...(data.phone ? [{ phone: data.phone }] : [])
                            ]
                        }
                    ]
                }
            });

            if (existingUser) {
                throw new CustomError('Email or phone already exists', 400);
            }
        }

        // Update user data
        if (data.name || data.email || data.phone) {
            await prisma.user.update({
                where: { id: customer.userId },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.email && { email: data.email }),
                    ...(data.phone && { phone: data.phone })
                }
            });
        }

        // Update customer status
        if (data.status) {
            await prisma.customer.update({
                where: { id: customerId },
                data: { status: data.status }
            });

            // If blocking customer, also deactivate user account
            if (data.status === CustomerStatus.BLOCKED) {
                await prisma.user.update({
                    where: { id: customer.userId },
                    data: { isActive: false }
                });
            } else if (data.status === CustomerStatus.ACTIVE) {
                // If activating customer, also activate user account
                await prisma.user.update({
                    where: { id: customer.userId },
                    data: { isActive: true }
                });
            }
        }

        return {
            success: true,
            message: 'Customer updated successfully'
        };
    }

    // Suspend customer
    async suspendCustomer(customerId: string, reason?: string): Promise<ActionResponse> {
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });

        if (!customer) {
            throw new CustomError('Customer not found', 404);
        }

        if (customer.status === CustomerStatus.SUSPENDED) {
            throw new CustomError('Customer is already suspended', 400);
        }

        await prisma.customer.update({
            where: { id: customerId },
            data: { status: CustomerStatus.SUSPENDED }
        });

        return {
            success: true,
            message: `Customer suspended successfully${reason ? `: ${reason}` : ''}`
        };
    }

    // Block customer
    async blockCustomer(customerId: string, reason?: string): Promise<ActionResponse> {
        const customer = await prisma.customer.findUnique({ 
            where: { id: customerId },
            include: { user: true }
        });

        if (!customer) {
            throw new CustomError('Customer not found', 404);
        }

        if (customer.status === CustomerStatus.BLOCKED) {
            throw new CustomError('Customer is already blocked', 400);
        }

        await prisma.customer.update({
            where: { id: customerId },
            data: { status: CustomerStatus.BLOCKED }
        });

        // Also deactivate user account
        await prisma.user.update({
            where: { id: customer.userId },
            data: { isActive: false }
        });

        return {
            success: true,
            message: `Customer blocked successfully${reason ? `: ${reason}` : ''}`
        };
    }

    // Activate customer (from suspended/blocked)
    async activateCustomer(customerId: string): Promise<ActionResponse> {
        const customer = await prisma.customer.findUnique({ 
            where: { id: customerId },
            include: { user: true }
        });

        if (!customer) {
            throw new CustomError('Customer not found', 404);
        }

        if (customer.status === CustomerStatus.ACTIVE) {
            throw new CustomError('Customer is already active', 400);
        }

        await prisma.customer.update({
            where: { id: customerId },
            data: { status: CustomerStatus.ACTIVE }
        });

        // Also activate user account
        await prisma.user.update({
            where: { id: customer.userId },
            data: { isActive: true }
        });

        return {
            success: true,
            message: 'Customer activated successfully'
        };
    }

    // Get customer order history
    async getCustomerOrderHistory(customerId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
            throw new CustomError('Customer not found', 404);
        }

        const total = await prisma.order.count({
            where: { customerId }
        });

        const orders = await prisma.order.findMany({
            where: { customerId },
            include: {
                vendor: {
                    select: {
                        businessName: true
                    }
                },
                rider: {
                    select: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        return {
            data: orders.map(order => ({
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                serviceFee: order.serviceFee,
                total: order.total,
                vendorName: order.vendor.businessName,
                riderName: order.rider?.user.name || null,
                specialInstructions: order.specialInstructions,
                estimatedDeliveryTime: order.estimatedDeliveryTime?.toISOString() || null,
                cancelledAt: order.cancelledAt?.toISOString() || null,
                cancellationReason: order.cancellationReason,
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString()
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

export const customersService = new CustomersService();