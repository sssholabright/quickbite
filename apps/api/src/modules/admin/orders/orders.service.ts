import { prisma } from "../../../config/db.js";
import { CancelOrderRequest, OrderActionResponse, OrderListItem, OrdersListParams, OrdersListResponse, ReassignRiderRequest, RefundOrderRequest } from "../../../types/admin/orders.js";
import { logger } from "../../../utils/logger.js";
import { CustomError } from "../../../middlewares/errorHandler.js";


export class OrdersService {
    // Get orders list with pagination, filters, and sorting
    static async getOrdersList(params: OrdersListParams): Promise<OrdersListResponse> {
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

            // Handle search term - search in customer name, vendor name, rider name, order number
            if (filters.search) {
                where.OR = [
                    { orderNumber: { contains: filters.search, mode: 'insensitive' } },
                    { 
                        customer: {
                            user: {
                                name: { contains: filters.search, mode: 'insensitive' }
                            }
                        }
                    },
                    {
                        vendor: {
                            OR: [
                                {
                                    user: {
                                        name: { contains: filters.search, mode: 'insensitive' }
                                    }
                                },
                                {
                                    businessName: { contains: filters.search, mode: 'insensitive' }
                                }
                            ]
                        }
                    },
                    {
                        rider: {
                            user: {
                                name: { contains: filters.search, mode: 'insensitive' }
                            }
                        }
                    }
                ];
            }

            // Handle status filter - only if not empty
            if (filters.status && filters.status.trim() !== '') {
                where.status = filters.status;
            }

            // Handle vendor ID filter - only if not empty
            if (filters.vendorId && filters.vendorId.trim() !== '') {
                where.vendorId = filters.vendorId;
            }

            // Handle rider ID filter - only if not empty
            if (filters.riderId && filters.riderId.trim() !== '') {
                where.riderId = filters.riderId;
            }

            // Handle customer ID filter - only if not empty
            if (filters.customerId && filters.customerId.trim() !== '') {
                where.customerId = filters.customerId;
            }

            // Handle date filter - only if not empty
            if (filters.date && filters.date.trim() !== '') {
                const startDate = new Date(filters.date);
                startDate.setHours(0, 0, 0, 0);
                
                const endDate = new Date(filters.date);
                endDate.setHours(23, 59, 59, 999);

                where.createdAt = {
                    gte: startDate,
                    lte: endDate
                };
            }

            // Build orderBy clause
            const orderBy: any = {};
            orderBy[sort.field] = sort.direction;

            // Get orders and total count in parallel
            const [orders, total] = await Promise.all([
                prisma.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        customer: {
                            include: {
                                user: true
                            }
                        },
                        vendor: {
                            include: {
                                user: true
                            }
                        },
                        rider: {
                            include: {
                                user: true
                            }
                        }
                    }
                }),
                prisma.order.count({ where })
            ]);

            // Transform orders to match response format
            const orderList: OrderListItem[] = orders.map(order => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customer: {
                    id: order.customer.id,
                    name: order.customer.user.name,
                    phone: order.customer.user.phone || '',
                    email: order.customer.user.email
                },
                vendor: {
                    id: order.vendor.id,
                    name: order.vendor.user.name,
                    businessName: order.vendor.businessName,
                    phone: order.vendor.user.phone || ''
                },
                rider: order.rider ? {
                    id: order.rider.id,
                    name: order.rider.user.name,
                    phone: order.rider.user.phone || '',
                    vehicleType: order.rider.vehicleType as string
                } : undefined,
                status: order.status,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                serviceFee: order.serviceFee,
                total: order.total || 0,
                deliveryAddress: order.deliveryAddress,
                specialInstructions: order.specialInstructions || '',
                estimatedDeliveryTime: order.estimatedDeliveryTime?.toISOString(),
                cancelledAt: order.cancelledAt?.toISOString(),
                cancellationReason: order.cancellationReason || '',
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString()
            }));

            const totalPages = Math.ceil(total / limit);

            return {
                data: orderList,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        } catch (error) {
            logger.error({ error }, 'Failed to get orders list');
            throw new CustomError('Failed to get orders list', 500);
        }
    }

    // Reassign rider to order
    static async reassignRider(orderId: string, request: ReassignRiderRequest, adminId: string): Promise<OrderActionResponse> {
        try {
            // Get the order with current rider info
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    rider: {
                        include: { user: true }
                    },
                    customer: {
                        include: { user: true }
                    },
                    vendor: {
                        include: { user: true }
                    }
                }
            });

            if (!order) {
                throw new CustomError('Order not found', 404);
            }

            if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
                throw new CustomError('Cannot reassign rider to cancelled or delivered order', 400);
            }

            // Get new rider info
            const newRider = await prisma.rider.findUnique({
                where: { id: request.newRiderId },
                include: { user: true }
            });

            if (!newRider) {
                throw new CustomError('New rider not found', 404);
            }

            if (!newRider.isOnline) {
                throw new CustomError('New rider is not available', 400);
            }

             // Update order with new rider
             const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    riderId: request.newRiderId,
                    status: 'ASSIGNED',
                    updatedAt: new Date()
                },
                include: {
                    customer: {
                        include: { user: true }
                    },
                    vendor: {
                        include: { user: true }
                    },
                    rider: {
                        include: { user: true }
                    }
                }
            });

            // TODO: Send push notification to new rider
            // TODO: Log activity for dashboard feed
            // TODO: Notify customer about rider change

            
            logger.info({
                orderId,
                oldRiderId: order.riderId,
                newRiderId: request.newRiderId,
                adminId
            }, 'Order rider reassigned');

            return {
                success: true,
                message: `Order reassigned to ${newRider.user.name}`,
                order: {
                    id: updatedOrder.id,
                    orderNumber: updatedOrder.orderNumber,
                    customer: {
                        id: updatedOrder.customer.id,
                        name: updatedOrder.customer.user.name,
                        phone: updatedOrder.customer.user.phone || '',
                        email: updatedOrder.customer.user.email
                    },
                    vendor: {
                        id: updatedOrder.vendor.id,
                        name: updatedOrder.vendor.user.name,
                        businessName: updatedOrder.vendor.businessName,
                        phone: updatedOrder.vendor.user.phone || ''
                    },
                    rider: updatedOrder.rider ? {
                        id: updatedOrder.rider.id,
                        name: updatedOrder.rider.user.name,
                        phone: updatedOrder.rider.user.phone || '',
                        vehicleType: updatedOrder.rider.vehicleType as string
                    } : undefined,
                    status: updatedOrder.status,
                    subtotal: updatedOrder.subtotal,
                    deliveryFee: updatedOrder.deliveryFee,
                    serviceFee: updatedOrder.serviceFee,
                    total: updatedOrder.total || 0,
                    deliveryAddress: updatedOrder.deliveryAddress,
                    specialInstructions: updatedOrder.specialInstructions || undefined,
                    estimatedDeliveryTime: updatedOrder.estimatedDeliveryTime?.toISOString(),
                    cancelledAt: updatedOrder.cancelledAt?.toISOString(),
                    cancellationReason: updatedOrder.cancellationReason || undefined,
                    createdAt: updatedOrder.createdAt.toISOString(),
                    updatedAt: updatedOrder.updatedAt.toISOString()
                }
            };
        } catch (error) {
            logger.error({ error }, 'Failed to reassign rider to order');
            throw new CustomError('Failed to reassign rider to order', 500);
        }
    }

    // Cancel order
    static async cancelOrder(orderId: string, request: CancelOrderRequest, adminId: string): Promise<OrderActionResponse> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    customer: {
                        include: { user: true }
                    },
                    vendor: {
                        include: { user: true }
                    },
                    rider: {
                        include: { user: true }
                    }
                }
            });

            if (!order) {
                throw new CustomError('Order not found', 404);
            }

            if (order.status === 'CANCELLED') {
                throw new CustomError('Order is already cancelled', 400);
            }

            if (order.status === 'DELIVERED') {
                throw new CustomError('Cannot cancel delivered order', 400);
            }

            // Update order status to cancelled
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancellationReason: request.reason,
                    updatedAt: new Date()
                },
                include: {
                    customer: {
                        include: { user: true }
                    },
                    vendor: {
                        include: { user: true }
                    },
                    rider: {
                        include: { user: true }
                    }
                }
            });

            // TODO: Refund logic if payment was made
            // TODO: Send push notifications to customer, vendor, and rider
            // TODO: Log activity for dashboard feed

            logger.info({
                orderId,
                reason: request.reason,
                adminId
            }, 'Order cancelled by admin');

            return {
                success: true,
                message: 'Order cancelled successfully',
                order: {
                    id: updatedOrder.id,
                    orderNumber: updatedOrder.orderNumber,
                    customer: {
                        id: updatedOrder.customer.id,
                        name: updatedOrder.customer.user.name,
                        phone: updatedOrder.customer.user.phone || '',
                        email: updatedOrder.customer.user.email
                    },
                    vendor: {
                        id: updatedOrder.vendor.id,
                        name: updatedOrder.vendor.user.name,
                        businessName: updatedOrder.vendor.businessName,
                        phone: updatedOrder.vendor.user.phone || ''
                    },
                    rider: updatedOrder.rider ? {
                        id: updatedOrder.rider.id,
                        name: updatedOrder.rider.user.name,
                        phone: updatedOrder.rider.user.phone || '',
                        vehicleType: updatedOrder.rider.vehicleType
                    } : undefined,
                    status: updatedOrder.status,
                    subtotal: updatedOrder.subtotal,
                    deliveryFee: updatedOrder.deliveryFee,
                    serviceFee: updatedOrder.serviceFee,
                    total: updatedOrder.total || 0,
                    deliveryAddress: updatedOrder.deliveryAddress,
                    specialInstructions: updatedOrder.specialInstructions || undefined,
                    estimatedDeliveryTime: updatedOrder.estimatedDeliveryTime?.toISOString(),
                    cancelledAt: updatedOrder.cancelledAt?.toISOString(),
                    cancellationReason: updatedOrder.cancellationReason || undefined,
                    createdAt: updatedOrder.createdAt.toISOString(),
                    updatedAt: updatedOrder.updatedAt.toISOString()
                }
            };
        } catch (error) {
            logger.error({ error, orderId }, 'Cancel order error');
            if (error instanceof CustomError) throw error;
            throw new CustomError('Failed to cancel order', 500);
        }
    }

    // Refund order
    static async refundOrder(orderId: string, request: RefundOrderRequest, adminId: string): Promise<OrderActionResponse> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    customer: {
                        include: { user: true }
                    },
                    vendor: {
                        include: { user: true }
                    }
                }
            });

            if (!order) {
                throw new CustomError('Order not found', 404);
            }

            if (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
                throw new CustomError('Can only refund delivered or cancelled orders', 400);
            }

            const refundAmount = request.refundType === 'FULL' ? order.total : request.amount;

            if (refundAmount && refundAmount > (order.total || 0)) {
                throw new CustomError('Refund amount cannot exceed order total', 400);
            }

            // TODO: Call payment provider API (Paystack)
            // TODO: Update refunds table in DB
            // TODO: Send push notification to customer
            // TODO: Log activity for dashboard feed

            logger.info({
                orderId,
                refundAmount,
                reason: request.reason,
                adminId
            }, 'Order refund processed');

            return {
                success: true,
                message: `Refund of ₦${refundAmount} processed successfully`,
                order: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    customer: {
                        id: order.customer.id,
                        name: order.customer.user.name,
                        phone: order.customer.user.phone || '',
                        email: order.customer.user.email
                    },
                    vendor: {
                        id: order.vendor.id,
                        name: order.vendor.user.name,
                        businessName: order.vendor.businessName,
                        phone: order.vendor.user.phone || ''
                    },
                    status: order.status,
                    subtotal: order.subtotal,
                    deliveryFee: order.deliveryFee,
                    serviceFee: order.serviceFee,
                    total: order.total || 0,
                    deliveryAddress: order.deliveryAddress,
                    specialInstructions: order.specialInstructions || undefined,
                    estimatedDeliveryTime: order.estimatedDeliveryTime?.toISOString(),
                    cancelledAt: order.cancelledAt?.toISOString(),
                    cancellationReason: order.cancellationReason || undefined,
                    createdAt: order.createdAt.toISOString(),
                    updatedAt: order.updatedAt.toISOString()
                }
            };
        } catch (error) {
            logger.error({ error, orderId }, 'Refund order error');
            if (error instanceof CustomError) throw error;
            throw new CustomError('Failed to process refund', 500);
        }
    }

    // Get single order details by ID
    static async getOrderDetails(orderId: string): Promise<OrderListItem> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    customer: {
                        include: {
                            user: true
                        }
                    },
                    vendor: {
                        include: {
                            user: true
                        }
                    },
                    rider: {
                        include: {
                            user: true
                        }
                    },
                    items: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            });

            if (!order) {
                throw new CustomError('Order not found', 404);
            }

            // Transform order to match response format
            const orderDetails: OrderListItem = {
                id: order.id,
                orderNumber: order.orderNumber,
                customer: {
                    id: order.customer.id,
                    name: order.customer.user.name,
                    phone: order.customer.user.phone || '',
                    email: order.customer.user.email
                },
                vendor: {
                    id: order.vendor.id,
                    name: order.vendor.user.name,
                    businessName: order.vendor.businessName,
                    phone: order.vendor.user.phone || ''
                },
                rider: order.rider ? {
                    id: order.rider.id,
                    name: order.rider.user.name,
                    phone: order.rider.user.phone || '',
                    vehicleType: order.rider.vehicleType as string
                } : undefined,
                status: order.status,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                serviceFee: order.serviceFee,
                total: order.total || 0,
                deliveryAddress: order.deliveryAddress,
                specialInstructions: order.specialInstructions || undefined,
                estimatedDeliveryTime: order.estimatedDeliveryTime?.toISOString(),
                cancelledAt: order.cancelledAt?.toISOString(),
                cancellationReason: order.cancellationReason || undefined,
                createdAt: order.createdAt.toISOString(),
                updatedAt: order.updatedAt.toISOString()
            };

            return orderDetails;
        } catch (error) {
            logger.error({ error, orderId }, 'Failed to get order details');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to get order details', 500);
        }
    }
}