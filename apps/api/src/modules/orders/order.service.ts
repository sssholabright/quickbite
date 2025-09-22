import { logger } from './../../utils/logger.js';
import { CustomError } from './../../middlewares/errorHandler.js';
import { prisma } from './../../config/db.js';
import { CreateOrderRequest, OrderFilters, OrderResponse, OrderStatusUpdate } from './../../types/order.js';
import { getSocketManager } from '../../config/socket.js';

export class OrderService {
    // Create new order
    static async createOrder(customerId: string, orderData: CreateOrderRequest): Promise<OrderResponse> {
        try {
            // Validate vendor exists and is active
            const vendor = await prisma.vendor.findFirst({
                where: {
                    id: orderData.vendorId,
                    isActive: true
                    // isOpen: true
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
                },
                include: {
                    addOns: true
                }
            });

            if (menuItems.length !== orderData.items.length) {
                throw new CustomError('Some menu items are not available', 400);
            }

            // Validate add-ons for each item
            for (const item of orderData.items) {
                if (item.addOns && item.addOns.length > 0) {
                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                    if (!menuItem) continue;

                    const addOnIds = item.addOns.map(addOn => addOn.addOnId);
                    const validAddOns = menuItem.addOns.filter(addOn => addOnIds.includes(addOn.id));

                    if (validAddOns.length !== addOnIds.length) {
                        throw new CustomError(`Invalid add-ons for item ${menuItem.name}`, 400);
                    }

                    // Validate required add-ons
                    const requiredAddOns = menuItem.addOns.filter(addOn => addOn.isRequired);
                    for (const requiredAddOn of requiredAddOns) {
                        const selectedAddOn = item.addOns.find(addOn => addOn.addOnId === requiredAddOn.id);
                        if (!selectedAddOn || selectedAddOn.quantity < 1) {
                            throw new CustomError(`Required add-on ${requiredAddOn.name} is missing or quantity is less than 1`, 400);
                        }
                    }

                    // Vendor max quantities
                    for (const selectedAddOn of item.addOns) {
                        const addOn = menuItem.addOns.find(addOn => addOn.id === selectedAddOn.addOnId);
                        if (addOn && selectedAddOn.quantity > addOn.maxQuantity) {
                            throw new CustomError(`Add-on ${addOn.name} quantity exceeds maximum allowed ${addOn.maxQuantity}`, 400);
                        }
                    }
                }
            }

            // Calculate pricing including add-ons
            const pricing = this.calculateOrderPricing(orderData.items, menuItems);

            // Create order with items and add-ons
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
                            const itemTotalPrice = this.calculateItemTotalPrice(item, menuItem!);

                            const orderItemData: any = {
                                menuItem: {
                                    connect: { id: item.menuItemId }
                                },
                                quantity: item.quantity,
                                unitPrice: menuItem!.price,
                                totalPrice: itemTotalPrice * item.quantity,
                                specialInstructions: item.specialInstructions || null
                            };

                            if (item.addOns && item.addOns.length > 0) {
                                orderItemData.addOns = {
                                    create: item.addOns.map(addOn => {
                                        const menuAddOn = menuItem!.addOns.find(ao => ao.id === addOn.addOnId);
                                        return {
                                            addOn: {
                                                connect: { id: addOn.addOnId }
                                            },
                                            quantity: addOn.quantity,
                                            price: menuAddOn!.price
                                        };
                                    })
                                };
                            }

                            return orderItemData;
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
                            menuItem: true,
                            addOns: {
                                include: {
                                    addOn: true
                                }
                            }
                        }
                    }
                }
            });

            logger.info(`Order created: ${order.orderNumber} for customer ${customerId}`);

            const formattedOrder = this.formatOrderResponse(order);

            // Emit WebSocket events
            try {
                const socketManager = getSocketManager();
                socketManager.emitNewOrder(formattedOrder);
                socketManager.emitOrderUpdate(order.id, formattedOrder);
            } catch (socketError) {
                logger.error({ error: socketError }, 'Failed to emit socket events');
            }

            return formattedOrder;

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
                            menuItem: true,
                            addOns: {
                                include: {
                                    addOn: true
                                }
                            }
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
                            menuItem: true,
                            addOns: {
                                include: {
                                    addOn: true
                                }
                            }
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
                            menuItem: true,
                            addOns: {
                                include: {
                                    addOn: true
                                }
                            }
                        }
                    }
                }
            });

            const formattedOrder = this.formatOrderResponse(updatedOrder);

            // Emit WebSocket events
            try {
                const socketManager = getSocketManager();
                socketManager.emitOrderUpdate(orderId, formattedOrder);
                
                // Emit status update to customer using userId instead of customer.id
                socketManager.emitOrderStatusUpdate(orderId, updatedOrder.customer.userId, statusUpdate.status);
                
                // Emit delivery updates if rider is assigned
                if (statusUpdate.riderId && ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(statusUpdate.status)) {
                    const rider = await prisma.rider.findUnique({
                        where: { id: statusUpdate.riderId },
                        include: { user: true }
                    });
                    if (rider) {
                        socketManager.emitDeliveryUpdate(orderId, updatedOrder.customer.id, {
                            id: rider.id,
                            name: rider.user.name,
                            phone: rider.user.phone
                        });
                    }
                }
            } catch (socketError) {
                logger.error({ error: socketError }, 'Failed to emit socket events');
            }

            return formattedOrder;
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
                                menuItem: true,
                                addOns: {
                                    include: {
                                        addOn: true
                                    }
                                }
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

            const cancelledOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancellationReason: reason || null
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
                            menuItem: true,
                            addOns: {
                                include: {
                                    addOn: true
                                }
                            }
                        }
                    }
                }
            });

            const formattedOrder = this.formatOrderResponse(cancelledOrder);

            // Emit WebSocket events
            try {
                const socketManager = getSocketManager();
                socketManager.emitOrderCancellation(orderId, formattedOrder);
                socketManager.emitOrderStatusUpdate(orderId, cancelledOrder.customer.id, 'CANCELLED');
            } catch (socketError) {
                logger.error({ error: socketError }, 'Failed to emit socket events');
            }

            return formattedOrder;
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
            const itemTotalPrice = this.calculateItemTotalPrice(item, menuItem!);
            return total + (itemTotalPrice * item.quantity);
        }, 0);

        const deliveryFee = 200; // Fixed delivery fee in kobo
        const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
        const total = subtotal + deliveryFee + serviceFee;

        return {
            subtotal,
            deliveryFee,
            serviceFee,
            total
        };
    }

    private static calculateItemTotalPrice(item: any, menuItem: any): number {
        let totalPrice = menuItem.price;

        // Add add-on prices
        if (item.addOns && item.addOns.length > 0) {
            item.addOns.forEach((addOn: any) => {
                const menuAddOn = menuItem.addOns.find((ao: any) => ao.id === addOn.addOnId);
                if (menuAddOn) {
                    totalPrice += menuAddOn.price * addOn.quantity;
                }
            });
        }

        return totalPrice;
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
                specialInstructions: item.specialInstructions,
                addOns: item.addOns && item.addOns.length > 0 ? item.addOns.map((addOn: any) => ({
                    id: addOn.id,
                    addOn: {
                        id: addOn.addOn.id,
                        name: addOn.addOn.name,
                        description: addOn.addOn.description,
                        price: addOn.addOn.price,
                        category: addOn.addOn.category
                    },
                    quantity: addOn.quantity,
                    price: addOn.price
                })) : undefined
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
                return order.customer.userId === userId;
            case 'VENDOR':
                return order.vendor.userId === userId;
            case 'RIDER':
                return order.rider?.userId === userId;
            case 'ADMIN':
                return true;
            default:
                return false;
        }
    }
    
    private static canUserUpdateOrder(order: any, userId: string, userRole: string, newStatus: string): boolean {
        switch (userRole) {
            case 'VENDOR':
                const hasPermission = order.vendor.userId === userId && ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(newStatus);
                return hasPermission;
            case 'RIDER':
                return order.rider?.userId === userId && ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(newStatus);
            case 'ADMIN':
                return true;
            default:
                return false;
        }
    }
    
    private static canUserCancelOrder(order: any, userId: string, userRole: string): boolean {
        switch (userRole) {
            case 'CUSTOMER':
                return order.customer.userId === userId && ['PENDING', 'CONFIRMED'].includes(order.status);
            case 'VENDOR':
                return order.vendor.userId === userId && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status);
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
                where.customer = {
                    user: {
                        id: userId
                    }
                };
                break;
            case 'VENDOR':
                where.vendor = {
                    user: {
                        id: userId
                    }
                };
                break;
            case 'RIDER':
                where.rider = {
                    user: {
                        id: userId
                    }
                };
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