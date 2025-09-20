import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RegisterData, LoginCredentials } from './../../types/auth.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './../../validations/auth.js';
import { AuthService } from './auth.service.js';
import { ResponseHandler } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    };
}

export class AuthController {
    // Register new user
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = registerSchema.parse(req.body);
            
            // Register user
            const result = await AuthService.register(validatedData as RegisterData);
            
            logger.info(`User registered successfully: ${result.user.email}`);
            
            ResponseHandler.created(res as any, result, 'User registered successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Login user
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = loginSchema.parse(req.body);
            
            // Login user
            const result = await AuthService.login(validatedData as LoginCredentials);
            
            logger.info(`User logged in successfully: ${result.user.email}`);
            
            ResponseHandler.success(res as any, result, 'Login successful');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Refresh access token
    static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = refreshTokenSchema.parse(req.body);
            
            // Refresh token
            const result = await AuthService.refreshToken(validatedData.refreshToken);
            
            logger.info('Token refreshed successfully');
            
            ResponseHandler.success(res as any, result, 'Token refreshed successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Logout user
    static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
            
            // Logout user
            await AuthService.logout(userId);
            
            logger.info(`User logged out: ${userId}`);
            
            ResponseHandler.success(res as any, null, 'Logout successful');
        } catch (error) {
            next(error);
        }
    }
}