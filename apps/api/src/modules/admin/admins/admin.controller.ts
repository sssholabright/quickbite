import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminService } from './admin.service.js';
import { ResponseHandler } from '../../../utils/response.js';
import { logger } from '../../../utils/logger.js';
import { adminLoginSchema, createAdminSchema } from '../../../validations/admin/admin.js';
import { AdminLoginCredentials, CreateAdminData } from '../../../types/admin/admin.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
        adminRole?: string;
        permissions?: string[];
    };
}

export class AdminController {
    // Admin login
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = adminLoginSchema.parse(req.body);
            
            // Login admin
            const result = await AdminService.login(validatedData as AdminLoginCredentials);
            
            logger.info(`Admin logged in: ${result.user.email} (${result.user.adminRole})`);
            
            ResponseHandler.success(res as any, result, 'Admin logged in successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Create admin
    static async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = createAdminSchema.parse(req.body);
            
            // Create admin
            const result = await AdminService.createAdmin(validatedData as CreateAdminData);
            
            logger.info(`Admin created: ${result.email} (${result.adminRole})`);
            
            ResponseHandler.success(res as any, result, 'Admin created successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Get admin profile
    static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId || req.user?.role !== 'ADMIN') {
                ResponseHandler.unauthorized(res as any, 'Unauthorized');
                return;
            }

            const profile = await AdminService.getProfile(userId);
            
            ResponseHandler.success(res as any, profile, 'Admin profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}