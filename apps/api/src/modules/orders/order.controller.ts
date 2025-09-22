import { Request, Response } from 'express';
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
            const { orderId } = req.params;
            const userId = (req.user as any).userId as string; // Change from 'id' to 'userId'
            const userRole = (req.user as any).role as string;
            const validatedData = updateOrderStatusSchema.parse(req.body);

            const order = await OrderService.updateOrderStatus(orderId!, validatedData, userId, userRole);

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
                status: req.query.status as string,
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
            const validatedData = cancelOrderSchema.parse(req.body);

            const order = await OrderService.cancelOrder(orderId!, userId, userRole, validatedData.reason);

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                data: order
            });
        } catch (error) {
            logger.error({ error }, 'Error cancelling order');
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
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
}