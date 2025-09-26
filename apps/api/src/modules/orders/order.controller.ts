import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';
import { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema } from '../../validations/order.js';
import { logger } from '../../utils/logger.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { OrderFilters } from '../../types/order.js';
import { prisma } from '../../config/db.js';

export class OrderController {
    // Create new order
    static async createOrder(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.user as any).userId; // Change from 'id' to 'userId'
            const validatedData = createOrderSchema.parse(req.body);

            // Find the customer record for this user
            const customer = await prisma.customer.findFirst({
                where: { userId: userId }
            });

            if (!customer) {
                throw new CustomError('Customer profile not found', 404);
            }

            const order = await OrderService.createOrder(customer.id, validatedData);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: order
            });
        } catch (error) {
            logger.error({ error }, 'Error creating order');
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create order'
            });
            return;
        }
    }

    // Get order by ID
    static async getOrderById(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = (req.user as any).userId as string;
            const userRole = (req.user as any).role as string;

            const order = await OrderService.getOrderById(orderId!, userId, userRole);

            res.json({
                success: true,
                data: order
            });
            return;
        } catch (error) {
            logger.error({ error }, 'Error getting order');
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Failed to get order'
            });
            return;
        }
    }

    // Update order status
    static async updateOrderStatus(req: Request, res: Response): Promise<void> {
        try {
            const { getSocketManager } = await import('../../config/socket.js');
            const socketManager = getSocketManager();

            const { orderId } = req.params;
            const userId = (req.user as any).userId as string; // Change from 'id' to 'userId'
            const userRole = (req.user as any).role as string;
            const validatedData = updateOrderStatusSchema.parse(req.body);

            const order = await OrderService.updateOrderStatus(orderId!, validatedData, userId, userRole);

            socketManager.emitToOrder(orderId!, 'order_updated', { order: order });

                // 🚀 NEW: Emit notification based on status change
                let notificationTitle = '';
                let notificationMessage = '';
                let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
                
                switch (validatedData.status) {
                    case 'CONFIRMED':
                        notificationTitle = 'Order Confirmed';
                        notificationMessage = `Order #${order.orderNumber} has been confirmed`;
                        priority = 'high';
                        break;
                    case 'PREPARING':
                        notificationTitle = 'Order Being Prepared';
                        notificationMessage = `Order #${order.orderNumber} is being prepared`;
                        priority = 'normal';
                        break;
                    case 'READY_FOR_PICKUP':
                        notificationTitle = 'Order Ready for Pickup!';
                        notificationMessage = `Order #${order.orderNumber} is ready for pickup`;
                        priority = 'high';
                        break;
                    case 'PICKED_UP':
                        notificationTitle = 'Order Picked Up';
                        notificationMessage = `Order #${order.orderNumber} has been picked up`;
                        priority = 'high';
                        break;
                    case 'OUT_FOR_DELIVERY':
                        notificationTitle = 'Order Out for Delivery';
                        notificationMessage = `Order #${order.orderNumber} is out for delivery`;
                        priority = 'high';
                        break;
                    case 'DELIVERED':
                        notificationTitle = 'Order Delivered';
                        notificationMessage = `Order #${order.orderNumber} has been delivered`;
                        priority = 'high';
                        break;
                    case 'CANCELLED':
                        notificationTitle = 'Order Cancelled';
                        notificationMessage = `Order #${order.orderNumber} has been cancelled`;
                        priority = 'high';
                        break;
                    default:
                        notificationTitle = 'Order Status Updated';
                        notificationMessage = `Order #${order.orderNumber} status changed to ${validatedData.status}`;
                        priority = 'normal';
                }
                
                // Notify customer
                if (order.customer) {
                    socketManager.emitToCustomer(order.customer.id, 'notification_received', {
                        id: `order-status-${order.id}-${Date.now()}`,
                        type: 'order',
                        title: notificationTitle,
                        message: notificationMessage,
                        priority: priority,
                        data: { orderId: order.id, status: validatedData.status },
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                }
                
                // Notify vendor
                socketManager.emitToVendor(order.vendor.id, 'notification_received', {
                    id: `order-status-vendor-${order.id}-${Date.now()}`,
                    type: 'order',
                    title: notificationTitle,
                    message: notificationMessage,
                    priority: priority,
                        data: { orderId: order.id, status: validatedData.status },
                    timestamp: new Date().toISOString(),
                    read: false
                });

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });
            return;
        } catch (error) {
            logger.error({ error }, 'Error updating order status');
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Failed to update order status'
            });
            return;
        }
    }

    // Get orders with filters
    static async getOrders(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req.user as any).userId as string;
            const userRole = (req.user as any).role as string;
            
            // Parse query parameters
            const filters = {
                status: req.query.status as string | string[], // Handle both string and array
                vendorId: req.query.vendorId as string,
                customerId: req.query.customerId as string,
                riderId: req.query.riderId as string,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 10
            };

            const result = await OrderService.getOrders(filters as OrderFilters, userId, userRole);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Error getting orders');
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Failed to get orders'
            });
            return;
        }
    }

    // Cancel order
    static async cancelOrder(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = (req.user as any).userId as string;
            const userRole = (req.user as any).role as string;
            
            // 🚀 IMPROVED: Better validation
            if (!orderId) {
                res.status(400).json({
                    success: false,
                    message: 'Order ID is required'
                });
                return;
            }

            const validatedData = cancelOrderSchema.parse(req.body);

            logger.info({ orderId, userId, userRole, reason: validatedData.reason }, 'Attempting to cancel order');

            const order = await OrderService.cancelOrder(orderId, userId, userRole, validatedData.reason);

            logger.info({ orderId, userId, userRole }, 'Order cancelled successfully');

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                data: order
            });
        } catch (error) {
            logger.error({ error, orderId: req.params.orderId, userId: (req.user as any)?.userId, userRole: (req.user as any)?.role }, 'Error cancelling order');
            
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            
            //  IMPROVED: More specific error handling
            if (error instanceof Error) {
                res.status(500).json({
                    success: false,
                    message: `Failed to cancel order: ${error.message}`
                });
                return;
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order'
            });
            return;
        }
    }

    /**
     * 🚀 NEW ENDPOINT: Broadcast existing ready orders
     * POST /api/v1/orders/broadcast-ready
     * Real-world: Admin or system can trigger this to ensure riders see all available jobs
     */
    static async broadcastExistingReadyOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await OrderService.broadcastExistingReadyOrders();
            
            res.status(200).json({
                success: result.success,
                message: result.message,
                data: {
                    ordersFound: result.ordersFound,
                    ordersBroadcasted: result.ordersBroadcasted,
                    errors: result.errors
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     *  NEW ENDPOINT: Get order status statistics
     * GET /api/v1/orders/stats
     * Real-world: Dashboard view of order statuses
     */
    static async getOrderStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await OrderService.getOrderStatusStats();
            
            res.status(200).json({
                success: true,
                message: 'Order statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * 🧪 TEST ENDPOINT: Test socket emission to riders
     * POST /api/v1/orders/test-socket-emission
     */
    static async testSocketEmission(req: Request, res: Response, next: NextFunction) {
        try {
            const { getSocketManager } = await import('../../config/socket.js');
            const socketManager = getSocketManager();
            
            const testData = {
                orderId: 'test-order-123',
                vendorId: 'test-vendor',
                vendorName: 'Test Vendor',
                customerId: 'test-customer',
                customerName: 'Test Customer',
                pickupAddress: 'Test Pickup Address',
                deliveryAddress: JSON.stringify({
                    address: 'Test Delivery Address',
                    coordinates: { lat: 6.5244, lng: 3.3792 }
                }),
                deliveryFee: 200,
                distance: 5,
                items: [{ 
                    id: '1', 
                    name: 'Test Item', 
                    quantity: 1, 
                    price: 100 
                }],
                expiresAt: new Date(Date.now() + 300000),
                timer: 30,
                retryCount: 0
            };
            
            console.log('🧪 Testing socket emission to riders...');
            console.log('🧪 Test data:', JSON.stringify(testData, null, 2));
            
            // Test emission
            socketManager.emitToAllRiders('new_delivery_job', testData);
            
            res.status(200).json({
                success: true,
                message: 'Test socket emission sent to all riders',
                data: testData
            });
        } catch (error) {
            next(error);
        }
    }
}