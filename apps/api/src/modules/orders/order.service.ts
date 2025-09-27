import { logger } from './../../utils/logger.js';
import { CustomError } from './../../middlewares/errorHandler.js';
import { prisma } from './../../config/db.js';
import { CreateOrderRequest, OrderFilters, OrderResponse, OrderStatusUpdate } from './../../types/order.js';
import { getSocketManager } from '../../config/socket.js';
import { DeliveryJobData, NotificationJobData } from '../../types/queue.js';
import { queueService } from '../queues/queue.service.js';
import { FCMService } from '../../services/fcm.service.js';

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
                
                // Emit to riders
                socketManager.emitToAllRiders('new_order', { order: formattedOrder });
                
                // Emit to order room
                socketManager.emitToOrder(order.id, 'order_updated', { order: formattedOrder });
                
                // Emit directly to vendor
                socketManager.emitToVendor(order.vendorId, 'new_order', { order: formattedOrder });
                // Emit to vendor orders room
                socketManager.getIO().to(`vendor_orders:${order.vendorId}`).emit('new_order', { 
                    order: formattedOrder,
                    timestamp: new Date().toISOString()
                });

                // Send notifications with delay
                setTimeout(async () => {
                    try {
                        const { notificationQueueService } = await import('../../services/notificationQueue.service.js');
                        
                        const notification = {
                            id: `new-order-${order.id}-${Date.now()}`,
                            targetType: 'vendor' as const,
                            targetId: order.vendorId,
                            type: 'order' as const,
                            title: '🆕 New Order!',
                            message: `New order #${order.orderNumber} received`,
                            data: {
                                orderId: order.id,
                                orderNumber: order.orderNumber,
                                customerName: order.customer?.user?.name || 'Unknown Customer',
                                total: order.total
                            },
                            priority: 'urgent' as const,
                            timestamp: new Date().toISOString()
                        };
                        
                        await notificationQueueService.addNotification(notification);
                    } catch (error) {
                        logger.error({ error, orderId: order.id }, 'Failed to queue notification');
                    }
                }, 2000);
            } catch (error) {
                logger.error({ error, orderId: order.id }, 'Failed to emit notification');
            }

            return formattedOrder;

        } catch (error) {
            console.error("Error creating order: ", error);
            // logger.error({ error }, 'Error creating order');
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
            console.error("Error getting order: ", error);
            // logger.error({ error }, 'Error getting order');
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

            // Trigger delivery job broadcasting when order is ready for pickup
            if (statusUpdate.status === 'READY_FOR_PICKUP') {
                try {
                    await this.triggerDeliveryJobBroadcast(updatedOrder);
                    logger.info(`Delivery job triggered for order ${orderId}`);
                } catch (deliveryError) {
                    logger.error({ error: deliveryError, orderId }, 'Failed to trigger delivery job broadcast');
                    // Don't throw error, continue with other operations
                }
            }

            // Emit WebSocket events
            try {
                const socketManager = getSocketManager();
                socketManager.emitToOrder(orderId, 'order_updated', { order: formattedOrder });
                
                // Emit status update to customer using consistent method
                socketManager.emitToCustomer(updatedOrder.customer.userId, 'order_status_update', { 
                    orderId, 
                    status: statusUpdate.status 
                });
                
                // Emit delivery updates if rider is assigned
                if (statusUpdate.riderId && ['PICKED_UP', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(statusUpdate.status)) {
                    const rider = await prisma.rider.findUnique({
                        where: { id: statusUpdate.riderId },
                        include: { user: true }
                    });
                    if (rider) {
                        socketManager.emitToCustomer(updatedOrder.customer.id, 'delivery_update', {
                            orderId,
                            rider: {
                                id: rider.id,
                                name: rider.user.name,
                                phone: rider.user.phone
                            }
                        });
                    }
                }
                
                // Send notifications AFTER socket events with longer delay
                if (statusUpdate.status === 'ASSIGNED' && statusUpdate.riderId) {
                    // Longer delay to ensure UI updates are processed first
                    setTimeout(async () => {
                        try {
                            const { notificationQueueService } = await import('../../services/notificationQueue.service.js');
                            
                            // Send notification to customer
                            await notificationQueueService.addNotification({
                                id: `order-assigned-${orderId}-${Date.now()}`,
                                targetType: 'customer',
                                targetId: updatedOrder.customer.id,
                                type: 'order',
                                title: '🚚 Order Assigned!',
                                message: `Your order has been assigned to a rider and will be picked up soon!`,
                                data: {
                                    orderId: orderId,
                                    status: 'ASSIGNED'
                                },
                                priority: 'high',
                                timestamp: new Date().toISOString()
                            });
                        } catch (error) {
                            logger.error({ error, orderId }, 'Failed to send order assignment notification');
                        }
                    }, 2000); // 🚀 INCREASED: 2 second delay after socket events
                }
                
            } catch (socketError) {
                logger.error({ error: socketError }, 'Failed to emit socket events');
            }

            if (statusUpdate.status === 'DELIVERED') {
                // 🚀 NEW: Mark rider as available again when order is delivered
                if (statusUpdate.riderId) {
                    await prisma.rider.update({
                        where: { id: statusUpdate.riderId },
                        data: { isOnline: true }
                    });
                    
                    logger.info(`✅ Rider ${statusUpdate.riderId} marked as available (order ${orderId} delivered)`);
                    
                    // Check for waiting orders
                    try {
                        const { DeliveryJobService } = await import('../delivery/deliveryJob.service.js');
                        await DeliveryJobService.checkWaitingOrders();
                    } catch (error) {
                        logger.warn({ error }, 'Failed to check waiting orders after delivery');
                    }
                }
            }

            if (statusUpdate.status === 'PICKED_UP') {
                // Rider is now unavailable (has active order)
                if (statusUpdate.riderId) {
                    await prisma.rider.update({
                        where: { id: statusUpdate.riderId },
                        data: { isAvailable: false }
                    });
                    
                    logger.info(`🚫 Rider ${statusUpdate.riderId} marked as unavailable (order ${orderId} picked up)`);
                }
            }

            return formattedOrder;
        } catch (error) {
            console.error("Error updating order status: ", error);
            // logger.error({ error }, 'Error updating order status');
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
            console.error("Error getting orders: ", error);
            // logger.error({ error }, 'Error getting orders');
            throw new CustomError('Failed to get orders', 500);
        }
    }

    // Cancel order
    static async cancelOrder(orderId: string, userId: string, userRole: string, reason?: string): Promise<OrderResponse> {
        try {
            // 🚀 FIXED: Include user relationships to fix the 500 error
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
                    items: { // 🚀 ADD: Include items
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

            // Check if order can be cancelled
            if (!this.canOrderBeCancelled(order.status)) {
                throw new CustomError('Order cannot be cancelled at this stage', 400);
            }

            // Check if user has permission to cancel this order
            if (!this.canUserCancelOrder(order, userId, userRole)) {
                throw new CustomError('Access denied', 403);
            }

            let updatedOrder;

            // 🚀 NEW: Handle rider cancellations differently
            if (userRole === 'RIDER') {
                // For rider cancellations, set back to READY_FOR_PICKUP and remove rider assignment
                updatedOrder = await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'READY_FOR_PICKUP',
                        riderId: null, // Remove rider assignment
                        cancelledAt: new Date(),
                        cancellationReason: reason || 'Rider cancelled order'
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
                        items: { // 🚀 ADD: Include items
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

                // 🚀 NEW: Make rider available again
                if (order.riderId) {
                    await prisma.rider.update({
                        where: { id: order.riderId },
                        data: { isAvailable: true }
                    });
                }

                // 🚀 NEW: Trigger broadcast to other riders
                const socketManager = getSocketManager();
                socketManager.emitToAllRiders('order_available_for_pickup', {
                    orderId: orderId,
                    message: 'Order is now available for pickup',
                    reason: 'rider_cancelled'
                });

                logger.info(`🔄 Order ${orderId} set back to READY_FOR_PICKUP after rider cancellation`);

            } else {
                // For other cancellations (customer, vendor, admin), mark as CANCELLED
                updatedOrder = await prisma.order.update({
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
                        }
                    }
                });
            }

            const formattedOrder = this.formatOrderResponse(updatedOrder);

            // Emit socket event for order cancellation
            const socketManager = getSocketManager();
            if (socketManager) {
                socketManager.emitOrderCancellation(orderId, formattedOrder, reason);
            }

            return formattedOrder;

        } catch (error: any) {
            console.error("Error cancelling order: ", error);
            // logger.error({ error }, 'Error cancelling order');
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw new CustomError('Failed to cancel order', 500);
        }
    }

    
    /**
     * 🚀 NEW METHOD: Find and broadcast existing orders with "READY_FOR_PICKUP" status
     * Real-world: When riders come online, this ensures they see all available delivery jobs
     * This works without tampering with existing functionality
    */
    static async broadcastExistingReadyOrders(): Promise<{
        success: boolean;
        message: string;
        ordersFound: number; 
        ordersBroadcasted: number;
        errors: string[];
    }> {
        try {
            logger.info('🔍 Starting broadcast of existing READY_FOR_PICKUP orders');

            // 🚀 FIX: Remove the 24-hour filter and other restrictions
            const readyOrders = await prisma.order.findMany({
                where: {
                    status: 'READY_FOR_PICKUP',
                    riderId: null, // Only unassigned orders
                    // 🚀 REMOVED: createdAt filter to get ALL ready orders
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
                },
                orderBy: {
                    createdAt: 'asc' // Oldest orders first
                }
            });

            logger.info(`🔍 Found ${readyOrders.length} orders with READY_FOR_PICKUP status`);

            if (readyOrders.length === 0) {
                return {
                    success: true,
                    message: 'No orders with READY_FOR_PICKUP status found',
                    ordersFound: 0,
                    ordersBroadcasted: 0,
                    errors: []
                };
            }

            let ordersBroadcasted = 0;
            const errors: string[] = [];

            // Broadcast each order
            for (const order of readyOrders) {
                try {
                    // Use the existing triggerDeliveryJobBroadcast method
                    await this.triggerDeliveryJobBroadcast(order);
                    ordersBroadcasted++;
                    logger.info(`✅ Successfully broadcasted order ${order.orderNumber}`);
                    
                    // 🚀 FIX: Add delay between broadcasts to prevent bombarding
                    if (ordersBroadcasted < readyOrders.length) {
                        console.log(`⏳ Waiting 10 seconds before next broadcast...`);
                        await new Promise(resolve => setTimeout(resolve, 40000)); // 40 second delay
                    }
                } catch (error) {
                    // 🚀 FIXED: Better error handling
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    const errorDetails = {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        error: errorMessage,
                        stack: error instanceof Error ? error.stack : undefined
                    };
                    
                    errors.push(`Failed to broadcast order ${order.orderNumber}: ${errorMessage}`);
                    logger.error(errorDetails, `Failed to broadcast order ${order.orderNumber}`);
                }
            }

            const result = {
                success: true,
                message: `Successfully processed ${readyOrders.length} orders. ${ordersBroadcasted} broadcasted successfully.`,
                ordersFound: readyOrders.length,
                ordersBroadcasted,
                errors
            };

            logger.info(`🎯 Broadcast complete: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            console.error("Error broadcasting existing ready orders: ", error);
            // logger.error({ error }, 'Error broadcasting existing ready orders');
            return {
                success: false,
                message: `Failed to broadcast existing orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
                ordersFound: 0,
                ordersBroadcasted: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * 🚀 NEW METHOD: Get statistics of orders by status
     * Real-world: Dashboard view of order statuses for monitoring
     */
     static async getOrderStatusStats(): Promise<{
        pending: number;
        preparing: number;
        ready: number;
        delivered: number;
        cancelled: number;
    }> {
        try {
            // Get counts by status
            const statusCounts = await prisma.order.groupBy({
                by: ['status'],
                _count: {
                    status: true
                }
            });

            // Convert to object
            const byStatus = statusCounts.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {} as Record<string, number>);

            return {
                pending: byStatus['PENDING'] || 0,
                preparing: (byStatus['CONFIRMED'] || 0) + (byStatus['PREPARING'] || 0),
                ready: byStatus['READY_FOR_PICKUP'] || 0,
                delivered: byStatus['DELIVERED'] || 0,
                cancelled: byStatus['CANCELLED'] || 0
            };
        } catch (error) {
            console.error("Error getting order status stats: ", error);
            throw new CustomError('Failed to get order status stats', 500);
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
            items: order.items?.map((item: any) => ({ // 🚀 FIXED: Add optional chaining
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
                addOns: item.addOns?.map((addOn: any) => ({ // 🚀 FIXED: Add optional chaining
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
                })) || [] // 🚀 FIXED: Provide default empty array
            })) || [], // 🚀 FIXED: Provide default empty array
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

    /**
     * 🚀 NEW METHOD: Trigger delivery job broadcast when order is ready for pickup
     * Real-world: When vendor clicks "Order Ready", this automatically finds riders and sends them the job
     */
    private static async triggerDeliveryJobBroadcast(order: any): Promise<void> {
        try {
            // 🚀 STEP 1: Check if any riders are available BEFORE creating job
            let socketManager;
            let ridersRoom;
            let availableRidersCount = 0;
            
            try {
                socketManager = getSocketManager();
                const io = socketManager.getIO();
                ridersRoom = io.sockets.adapter.rooms.get('riders');
                
                // Check database for available riders
                availableRidersCount = await prisma.rider.count({
                    where: {
                        isOnline: true,
                        isAvailable: true,
                        currentLat: { not: null },
                        currentLng: { not: null }
                    }
                });
            } catch (socketError) {
                // If socket manager is not available, just check database
                console.log('⚠️ Socket manager not available, checking database only');
                availableRidersCount = await prisma.rider.count({
                    where: {
                        isOnline: true,
                        isAvailable: true,
                        currentLat: { not: null },
                        currentLng: { not: null }
                    }
                });
            }
            
            if (availableRidersCount === 0) {
                console.log(`🚫 No available riders found. Order ${order.id} will be queued for later broadcast.`);
                // Don't return, still create the job for when riders come online
            } else {
                console.log(`✅ Found ${availableRidersCount} available riders. Proceeding with delivery job creation.`);
            }
            
            // 🚀 STEP 2: Create delivery job only if riders are available
            const deliveryJobData: DeliveryJobData = {
                orderId: order.id,
                vendorId: order.vendorId,
                customerId: order.customerId,
                customerName: order.customer.user.name,
                vendorName: order.vendor.businessName,
                pickupAddress: order.vendor.businessAddress || 'Vendor Address',
                deliveryAddress: JSON.stringify(order.deliveryAddress),
                deliveryFee: order.deliveryFee,
                distance: this.calculateDistance(
                    order.vendor.latitude, 
                    order.vendor.longitude,
                    order.deliveryAddress.coordinates?.lat || 0,
                    order.deliveryAddress.coordinates?.lng || 0
                ),
                items: order.items.map((item: any) => ({
                    id: item.id,
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    price: item.unitPrice
                })),
                createdAt: order.createdAt,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
            };

            console.log(`📋 Adding delivery job to queue for order ${order.id}`);
            // Add delivery job to queue
            await queueService.addDeliveryJob(deliveryJobData);
            console.log(`✅ Delivery job added to queue for order ${order.id}`);

            logger.info(`Delivery job triggered for order ${order.id}`);
        } catch (error) {
            // 🚀 FIXED: Better error logging
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : 'No stack trace';
            
            console.error(`❌ ERROR triggering delivery job broadcast for order ${order.id}:`, {
                message: errorMessage,
                stack: errorStack,
                error: error
            });
            
            logger.error({ 
                error: errorMessage, 
                stack: errorStack,
                orderId: order.id 
            }, 'Failed to trigger delivery job broadcast');
            
            // Don't throw error, continue with other operations
        }
    }

    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
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
        try {
            switch (userRole) {
                case 'CUSTOMER':
                    // 🚀 FIXED: Check if customer user ID matches and order can be cancelled
                    return order.customer?.user?.id === userId && ['PENDING', 'CONFIRMED'].includes(order.status);
                case 'VENDOR':
                    // 🚀 FIXED: Check if vendor user ID matches and order can be cancelled
                    return order.vendor?.user?.id === userId && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status);
                case 'RIDER':
                    // 🚀 NEW: Allow riders to cancel assigned orders (only before pickup)
                    return order.rider?.user?.id === userId && ['ASSIGNED'].includes(order.status);
                case 'ADMIN':
                    return true;
                default:
                    return false;
            }
        } catch (error) {
            console.error("Error checking user cancel permission: ", error);
            //  logger.error({ error, orderId: order.id, userId, userRole }, 'Error checking user cancel permission');
            return false;
        }
    }

    private static canOrderBeCancelled(status: string): boolean {
        // 🚀 IMPROVED: More comprehensive status check
        const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'ASSIGNED']; // 🚀 ADD: ASSIGNED for riders
        return cancellableStatuses.includes(status);
    }

    private static buildOrderWhereClause(filters: OrderFilters, userId: string, userRole: string) {
        const where: any = {};

        if (filters.status) {
            // Handle both string and array status filters
            if (Array.isArray(filters.status)) {
                where.status = { in: filters.status };
            } else if (typeof filters.status === 'string' && filters.status.includes(',')) {
                // Handle comma-separated string
                where.status = { in: filters.status.split(',').map(s => s.trim()) };
            } else {
                where.status = filters.status;
            }
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

    // 🚀 NEW: Send order notification to rider
    static async notifyRiderAboutOrder(orderId: string, message: string): Promise<void> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { rider: true }
            });

            if (!order || !order.riderId) {
                logger.warn(`No rider assigned to order: ${orderId}`);
                return;
            }

            await FCMService.sendToRider(order.riderId, {
                title: 'New Order Assignment',
                body: message,
                data: { orderId, type: 'order_assignment' }
            }, { orderId });

            logger.info(`Order notification sent to rider: ${order.riderId}`);
        } catch (error) {
            logger.error({ error, orderId }, 'Failed to send order notification to rider');
        }
    }
}