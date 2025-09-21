import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from './../../utils/logger.js';
import { ResponseHandler } from './../../utils/response.js';
import { cancelOrderSchema, createOrderSchema, orderFiltersSchema, updateOrderStatusSchema } from './../../validations/order.js';
import { OrderService } from './order.service.js';

export class OrderController {
    // Create new order
    static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = createOrderSchema.parse(req.body);
            
            // Get user info from auth middleware
            const customerId = req.user?.userId;
            if (!customerId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return
            }
    
            // Create order
            const order = await OrderService.createOrder(customerId, validatedData);
            
            logger.info(`Order created successfully: ${order.orderNumber}`);
            
            ResponseHandler.created(res as any, order, 'Order created successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }
  
    // Get order by ID
    static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            
            if (!id) {
                ResponseHandler.badRequest(res as any, 'Order ID is required');
                return
            }
    
            // Get user info from auth middleware
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            
            if (!userId || !userRole) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
    
            // Get order
            const order = await OrderService.getOrderById(id, userId, userRole);
            
            ResponseHandler.success(res as any, order, 'Order retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
  
    // Get orders with filters
    static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate query parameters
            const validatedQuery = orderFiltersSchema.parse(req.query);
            
            // Get user info from auth middleware
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            
            if (!userId || !userRole) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return
            }
    
            // Convert date strings to Date objects
            const filters = {
                ...validatedQuery,
                dateFrom: validatedQuery.dateFrom ? new Date(validatedQuery.dateFrom) : undefined,
                dateTo: validatedQuery.dateTo ? new Date(validatedQuery.dateTo) : undefined
            };
    
            // Get orders
            const result = await OrderService.getOrders(filters, userId, userRole);
            
            ResponseHandler.success(res as any, result, 'Orders retrieved successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }
  
    // Update order status
    static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            
            if (!id) {
                ResponseHandler.badRequest(res as any, 'Order ID is required');
                return
            }
    
            // Validate request body
            const validatedData = updateOrderStatusSchema.parse(req.body);
            
            // Get user info from auth middleware
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            
            if (!userId || !userRole) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
    
            // Convert estimatedDeliveryTime string to Date if provided
            const statusUpdate = {
                ...validatedData,
                estimatedDeliveryTime: validatedData.estimatedDeliveryTime 
                    ? new Date(validatedData.estimatedDeliveryTime) 
                : undefined
            };
    
                // Update order status
                const order = await OrderService.updateOrderStatus(id, statusUpdate, userId, userRole);
                
                logger.info(`Order ${order.orderNumber} status updated to ${statusUpdate.status}`);
                
                ResponseHandler.success(res as any, order, 'Order status updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
        
            next(error);
        }
    }
  
    // Cancel order
    static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            
            if (!id) {
                ResponseHandler.badRequest(res as any, 'Order ID is required');
                return;
            }
    
            // Validate request body
            const validatedData = cancelOrderSchema.parse(req.body);
            
            // Get user info from auth middleware
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            
            if (!userId || !userRole) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
    
            // Cancel order
            const order = await OrderService.cancelOrder(id, userId, userRole, validatedData.reason);
            
            logger.info(`Order ${order.orderNumber} cancelled by ${userRole} ${userId}`);
            
            ResponseHandler.success(res as any, order, 'Order cancelled successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }
  
    // Get order statistics (for dashboard)
    static async getOrderStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Get user info from auth middleware
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            
            if (!userId || !userRole) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
    
            // Get basic stats based on user role
            const filters = { page: 1, limit: 1000 }; // Get all orders for stats
            const result = await OrderService.getOrders(filters, userId, userRole);
            
            // Calculate basic statistics
            const stats = {
                totalOrders: result.total,
                pendingOrders: result.orders.filter(o => o.status === 'PENDING').length,
                confirmedOrders: result.orders.filter(o => o.status === 'CONFIRMED').length,
                preparingOrders: result.orders.filter(o => o.status === 'PREPARING').length,
                readyForPickupOrders: result.orders.filter(o => o.status === 'READY_FOR_PICKUP').length,
                pickedUpOrders: result.orders.filter(o => o.status === 'PICKED_UP').length,
                outForDeliveryOrders: result.orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
                deliveredOrders: result.orders.filter(o => o.status === 'DELIVERED').length,
                cancelledOrders: result.orders.filter(o => o.status === 'CANCELLED').length,
                totalRevenue: result.orders
                    .filter(o => o.status === 'DELIVERED')
                    .reduce((sum, order) => sum + order.pricing.total, 0)
            };
            
            ResponseHandler.success(res as any, stats, 'Order statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}