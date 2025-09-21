import { logger } from './../../utils/logger.js';
import { CustomError } from './../../middlewares/errorHandler.js';
import { prisma } from './../../config/db.js';
import { CreateOrderRequest, OrderFilters, OrderResponse, OrderStatusUpdate } from './../../types/order.js';

export class OrderService {
    // Create new order
    static async createOrder(customerId: string, orderData: CreateOrderRequest): Promise<OrderResponse> {
        try {
            // Validate vendor exists and is active
            const vendor = await prisma.vendor.findFirst({
                where: {
                    id: orderData.vendorId,
                    isActive: true,
                    isOpen: true
                },
                include: {
                    user: true
                }
            });

            if (!vendor) {
                throw new CustomError('Vendor not found or not accepting orders', 404);
            }

            // Validate menu items exist and get pricing
            const menuItemIds = orderData.items.map(item => item.menuItemId);
            const menuItems = await prisma.menuItem.findMany({
                where: {
                    id: { in: menuItemIds },
                    vendorId: orderData.vendorId,
                    isAvailable: true
                }
            });

            if (menuItems.length !== orderData.items.length) {
                throw new CustomError('Some menu items are not available', 400);
            }

            // Calculate pricing
            const pricing = this.calculateOrderPricing(orderData.items, menuItems);

            // Create order with items
            const order = await prisma.order.create({
                data: {
                    orderNumber: this.generateOrderNumber(),
                    customerId,
                    vendorId: orderData.vendorId,
                    status: 'PENDING',
                    subtotal: pricing.subtotal,
                    deliveryFee: pricing.deliveryFee,
                    serviceFee: pricing.serviceFee,
                    total: pricing.total,
                    specialInstructions: orderData.specialInstructions || null,
                    deliveryAddress: orderData.deliveryAddress,
                    items: {
                        create: orderData.items.map(item => {
                            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                            return {
                                menuItem: {
                                    connect: { id: item.menuItemId }
                                },
                                quantity: item.quantity,
                                unitPrice: menuItem!.price,
                                totalPrice: menuItem!.price * item.quantity,
                                specialInstructions: item.specialInstructions || null
                            };
                        })
                    }
                },
                include: {
                    vendor: {
                        include: {
                            user: true
                        }
                    },
                    customer: {
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

            logger.info(`Order created: ${order.orderNumber} for customer ${customerId}`);

            return this.formatOrderResponse(order)

        } catch (error) {
            logger.error({ error }, 'Error creating order');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to create order', 500);
        }
    }

    // Get order by ID
    static async getOrderById(orderId: string, userId: string, userRole: string): Promise<OrderResponse> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    vendor: {
                        include: {
                            user: true
                        }
                    },
                    customer: {
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

            // Check if user has permission to view this order
            if (!this.canUserViewOrder(order, userId, userRole)) {
                throw new CustomError('Access denied', 403);
            }

            return this.formatOrderResponse(order);
        } catch (error) {
            logger.error({ error }, 'Error getting order');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to get order', 500);
        }
    }

    // Update order status
    static async updateOrderStatus(orderId: string, statusUpdate: OrderStatusUpdate, userId: string, userRole: string): Promise<OrderResponse> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    vendor: {
                        include: {
                            user: true
                        }
                    },
                    customer: {
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

            // Check if user has permission to update this order
            if (!this.canUserUpdateOrder(order, userId, userRole, statusUpdate.status)) {
                throw new CustomError('Access denied', 403);
            }

            // Update order
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: statusUpdate.status,
                    ...(statusUpdate.riderId && { riderId: statusUpdate.riderId }),
                    ...(statusUpdate.estimatedDeliveryTime && { estimatedDeliveryTime: statusUpdate.estimatedDeliveryTime })
                },
                include: {
                    vendor: {
                        include: {
                            user: true
                        }
                    },
                    customer: {
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

            logger.info(`Order ${order.orderNumber} status updated to ${statusUpdate.status}`);

            return this.formatOrderResponse(updatedOrder);
        } catch (error) {
            logger.error({ error }, 'Error updating order status');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update order status', 500);
        }
    }

    // Get orders with filters
    static async getOrders(filters: OrderFilters, userId: string, userRole: string): Promise<{ orders: OrderResponse[]; total: number; page: number; limit: number }> {
        try {
            const where = this.buildOrderWhereClause(filters, userId, userRole);
            
            const [orders, total] = await Promise.all([
                prisma.order.findMany({
                    where,
                    include: {
                        vendor: {
                            include: {
                                user: true
                            }
                        },
                        customer: {
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
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: ((filters.page || 1) - 1) * (filters.limit || 10),
                    take: filters.limit || 10
                }),
                prisma.order.count({ where })
            ]);

            return {
                orders: orders.map(order => this.formatOrderResponse(order)),
                total,
                page: filters.page || 1,
                limit: filters.limit || 10
            };
        } catch (error) {
            logger.error({ error }, 'Error getting orders');
            throw new CustomError('Failed to get orders', 500);
        }
    }

    // Cancel order
    static async cancelOrder(orderId: string, userId: string, userRole: string, reason?: string): Promise<OrderResponse> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!order) {
                throw new CustomError('Order not found', 404);
            }

            // Check if order can be cancelled
            if (!this.canOrderBeCancelled(order.status)) {
                throw new CustomError('Order cannot be cancelled at this stage', 400);
            }

            // Check if user has permission to cancel this order
            if (!this.canUserCancelOrder(order, userId, userRole)) {
                throw new CustomError('Access denied', 403);
            }

            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    ...(reason && { cancellationReason: reason })
                },
                include: {
                    vendor: {
                        include: {
                            user: true
                        }
                    },
                    customer: {
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

            logger.info(`Order ${order.orderNumber} cancelled by ${userRole} ${userId}`);

            return this.formatOrderResponse(updatedOrder);
        } catch (error) {
            logger.error({ error }, 'Error cancelling order');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to cancel order', 500);
        }
    }

    // Helper methods
    private static calculateOrderPricing(items: any[], menuItems: any[]) {
        const subtotal = items.reduce((total, item) => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            return total + (menuItem!.price * item.quantity);
        }, 0);

        const deliveryFee = 500; // Fixed delivery fee in kobo
        const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
        const total = subtotal + deliveryFee + serviceFee;

        return {
            subtotal,
            deliveryFee,
            serviceFee,
            total
        };
    }

    private static generateOrderNumber(): string {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `QB${timestamp}${random}`;
    }

    private static formatOrderResponse(order: any): OrderResponse {
        return {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            vendor: {
                id: order.vendor.id,
                name: order.vendor.user.name,
                businessName: order.vendor.businessName,
                address: order.vendor.businessAddress,
                phone: order.vendor.user.phone,
                coordinates: {
                    lat: order.vendor.latitude,
                    lng: order.vendor.longitude
                }
            },
            customer: {
                id: order.customer.id,
                name: order.customer.user.name,
                phone: order.customer.user.phone
            },
            rider: order.rider ? {
                id: order.rider.id,
                name: order.rider.user.name,
                phone: order.rider.user.phone,
                vehicleType: order.rider.vehicleType,
            } : undefined,
            items: order.items.map((item: any) => ({
                id: item.id,
                menuItem: {
                    id: item.menuItem.id,
                    name: item.menuItem.name,
                    description: item.menuItem.description,
                    price: item.menuItem.price,
                    image: item.menuItem.image
                },
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                specialInstructions: item.specialInstructions
            })),
            deliveryAddress: order.deliveryAddress,
            pricing: {
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                serviceFee: order.serviceFee,
                total: order.total
            },
            specialInstructions: order.specialInstructions,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };
    }

    private static canUserViewOrder(order: any, userId: string, userRole: string): boolean {
        switch (userRole) {
            case 'CUSTOMER':
                return order.customerId === userId;
            case 'VENDOR':
                return order.vendorId === userId;
            case 'RIDER':
                return order.riderId === userId;
            case 'ADMIN':
                return true;
            default:
                return false;
        }
    }
    
    private static canUserUpdateOrder(order: any, userId: string, userRole: string, newStatus: string): boolean {
        switch (userRole) {
            case 'VENDOR':
                return order.vendorId === userId && ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(newStatus);
            case 'RIDER':
                return order.riderId === userId && ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(newStatus);
            case 'ADMIN':
                return true;
            default:
                return false;
            }
    }
    
    private static canUserCancelOrder(order: any, userId: string, userRole: string): boolean {
        switch (userRole) {
            case 'CUSTOMER':
                return order.customerId === userId && ['PENDING', 'CONFIRMED'].includes(order.status);
            case 'VENDOR':
                return order.vendorId === userId && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status);
            case 'ADMIN':
                return true;
            default:
                return false;
            }
    }

    private static canOrderBeCancelled(status: string): boolean {
        return ['PENDING', 'CONFIRMED', 'PREPARING'].includes(status);
    }

    private static buildOrderWhereClause(filters: OrderFilters, userId: string, userRole: string) {
        const where: any = {};
    
        if (filters.status) {
            where.status = filters.status;
        }
    
        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
            if (filters.dateTo) where.createdAt.lte = filters.dateTo;
        }
    
        // Role-based filtering
        switch (userRole) {
            case 'CUSTOMER':
                where.customerId = userId;
                break;
            case 'VENDOR':
                where.vendorId = userId;
                break;
            case 'RIDER':
                where.riderId = userId;
                break;
            case 'ADMIN':
                // Admins can see all orders
                break;
        }

        if (filters.vendorId && userRole === 'ADMIN') {
            where.vendorId = filters.vendorId;
        }
      
        if (filters.customerId && userRole === 'ADMIN') {
            where.customerId = filters.customerId;
        }
      
        if (filters.riderId && userRole === 'ADMIN') {
            where.riderId = filters.riderId;
        }

        return where;
    }
}