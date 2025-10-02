import { Request, Response } from 'express';
import { OrdersService } from './orders.service.js';
import { 
    OrdersListParams, 
    ReassignRiderRequest, 
    CancelOrderRequest, 
    RefundOrderRequest 
} from '../../../types/admin/orders.js';
import { logger } from '../../../utils/logger.js';
import { CustomError } from '../../../middlewares/errorHandler.js';

export class OrdersController {
    // Get orders list
    static async getOrdersList(req: Request, res: Response) {
        try {
            // Parse sort parameters - handle both flat and nested formats
            let sortField: 'createdAt' | 'status' | 'updatedAt' | 'total' = 'createdAt';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['createdAt', 'status', 'updatedAt', 'total'].includes(field)) {
                    sortField = field as 'createdAt' | 'status' | 'updatedAt' | 'total';
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['createdAt', 'status', 'updatedAt', 'total'].includes(field)) {
                    sortField = field as 'createdAt' | 'status' | 'updatedAt' | 'total';
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            const params: OrdersListParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
                filters: {
                    // Handle nested filter parameters
                    search: (req.query.search || req.query['filters[search]']) as string,
                    status: (req.query.status || req.query['filters[status]']) as string,
                    date: (req.query.date || req.query['filters[date]']) as string,
                    vendorId: (req.query.vendorId || req.query['filters[vendorId]']) as string,
                    riderId: (req.query.riderId || req.query['filters[riderId]']) as string,
                    customerId: (req.query.customerId || req.query['filters[customerId]']) as string,
                },
                sort: {
                    field: sortField,
                    direction: sortDirection
                }
            };

            const result = await OrdersService.getOrdersList(params);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Get orders list controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Reassign rider
    static async reassignRider(req: Request, res: Response) {
        try {
            const orderId = req.params.id;
            const request: ReassignRiderRequest = req.body;
            const adminId = req.user?.userId;

            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const result = await OrdersService.reassignRider(orderId as string, request, adminId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Reassign rider controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Cancel order
    static async cancelOrder(req: Request, res: Response) {
        try {
            const orderId = req.params.id;
            const request: CancelOrderRequest = req.body;
            const adminId = req.user?.userId; // From auth middleware

            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const result = await OrdersService.cancelOrder(orderId as string, request, adminId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Cancel order controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Refund order
    static async refundOrder(req: Request, res: Response) {
        try {
            const orderId = req.params.id;
            const request: RefundOrderRequest = req.body;
            const adminId = req.user?.userId; // From auth middleware

            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const result = await OrdersService.refundOrder(orderId as string, request, adminId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Refund order controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Get single order details
    static async getOrderDetails(req: Request, res: Response) {
        try {
            const orderId = req.params.id;

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Order ID is required'
                });
            }

            const result = await OrdersService.getOrderDetails(orderId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Get order details controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }
}
