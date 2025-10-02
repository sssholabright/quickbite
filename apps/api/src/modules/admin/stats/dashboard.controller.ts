import { ResponseHandler } from './../../../utils/response.js';
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../admins/admin.service.js';
import { DashboardService } from './dashboard.service.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
        adminRole?: string;
        permissions?: string[];
    };
}

export class DashboardController {
    // Get dashboard stats
    static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        console.log('permissions', req.user);
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'Unauthorized');
                return;
            }

            // Check if admin has permission to view dashboard
            const hasPermission = AdminService.hasPermission(
                req.user?.permissions || [],
                'dashboard.read'
            );

            if (!hasPermission) {
                ResponseHandler.forbidden(res as any, 'Access denied: Insufficient permissions');
                return;
            }

            const filters = {
                dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange as string) : undefined,
                timezone: req.query.timezone as string
            };

            const stats = await DashboardService.getDashboardStats(filters);
            
            ResponseHandler.success(res as any, stats, 'Dashboard stats retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get activity feed
    static async getActivityFeed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'Unauthorized');
                return;
            }

            // Check if admin has permission to view activity feed
            const hasPermission = AdminService.hasPermission(
                req.user?.permissions || [],
                'activity.read'
            );

            if (!hasPermission) {
                ResponseHandler.forbidden(res as any, 'Access denied: Insufficient permissions');
                return;
            }

            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const activityFeed = await DashboardService.getActivityFeed(limit, offset);
            
            ResponseHandler.success(res as any, activityFeed, 'Activity feed retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get order analytics
    static async getOrderAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        console.log('permissions', req.user);
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'Unauthorized');
                return;
            }

            // Check if admin has permission to view orders
            const hasPermission = AdminService.hasPermission(
                req.user?.permissions || [],
                'orders.read'
            );

            if (!hasPermission) {
                ResponseHandler.forbidden(res as any, 'Access denied: Insufficient permissions');
                return;
            }

            const filters = {
                dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange as string) : undefined,
                timezone: req.query.timezone as string
            };

            const analytics = await DashboardService.getOrderAnalytics(filters);
            
            ResponseHandler.success(res as any, analytics, 'Order analytics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get rider analytics
    static async getRiderAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'Unauthorized');
                return;
            }

            // Check if admin has permission to view riders
            const hasPermission = AdminService.hasPermission(
                req.user?.permissions || [],
                'riders.read'
            );

            if (!hasPermission) {
                ResponseHandler.forbidden(res as any, 'Access denied: Insufficient permissions');
                return;
            }

            const analytics = await DashboardService.getRiderAnalytics();
            
            ResponseHandler.success(res as any, analytics, 'Rider analytics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get vendor analytics
    static async getVendorAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'Unauthorized');
                return;
            }

            // Check if admin has permission to view vendors
            const hasPermission = AdminService.hasPermission(
                req.user?.permissions || [],
                'vendors.read'
            );

            if (!hasPermission) {
                ResponseHandler.forbidden(res as any, 'Access denied: Insufficient permissions');
                return;
            }

            const analytics = await DashboardService.getVendorAnalytics();
            
            ResponseHandler.success(res as any, analytics, 'Vendor analytics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get customer analytics
    static async getCustomerAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'Unauthorized');
                return;
            }

            // Check if admin has permission to view customers
            const hasPermission = AdminService.hasPermission(
                req.user?.permissions || [],
                'customers.read'
            );

            if (!hasPermission) {
                ResponseHandler.forbidden(res as any, 'Access denied: Insufficient permissions');
                return;
            }

            const analytics = await DashboardService.getCustomerAnalytics();
            
            ResponseHandler.success(res as any, analytics, 'Customer analytics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}