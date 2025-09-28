import { LoginCredentials, RegisterData } from './../../types/auth.js';
import { changePasswordSchema, loginSchema, refreshTokenSchema, registerSchema } from './../../validations/auth.js';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { ResponseHandler } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { CloudinaryService } from '../../services/cloudinary.service.js';

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

    // Get current user profile
    static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
            
            // Get user profile
            const user = await AuthService.getUserProfile(userId);
            
            logger.info(`User profile retrieved: ${user.email}`);
            
            ResponseHandler.success(res as any, user, 'Profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Update user profile
    static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Validate request body
            const updateProfileSchema = z.object({
                name: z.string().min(2, 'Name must be at least 2 characters').optional(),
                phone: z.string().min(10, 'Phone must be at least 10 characters').optional(),
                avatar: z.string().url('Invalid avatar URL').optional(),
                currentLat: z.number().optional(),
                currentLng: z.number().optional(),
            });

            const validatedData = updateProfileSchema.parse(req.body);
            
            // 🚀 NEW: Handle avatar upload if present
            let avatarUrl = validatedData.avatar;
            if (req.file) {
                try {
                    const uploadResult = await CloudinaryService.uploadAvatar(req.file.buffer, userId);
                    avatarUrl = uploadResult.secure_url;
                    logger.info(`Avatar uploaded: ${uploadResult.public_id}`);
                } catch (uploadError) {
                    logger.error({ uploadError }, 'Failed to upload avatar');
                    ResponseHandler.error(res as any, 'Failed to upload avatar');
                    return;
                }
            }
            
            // Update profile with avatar URL
            const profileData = { ...validatedData, avatar: avatarUrl };
            const user = await AuthService.updateUserProfile(userId, profileData);
            
            ResponseHandler.success(res as any, user, 'Profile updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Change password
    static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Validate request body
            const validatedData = changePasswordSchema.parse(req.body);
            
            // Change password
            await AuthService.changePassword(userId, validatedData);
            
            logger.info(`Password changed for user: ${userId}`);
            
            ResponseHandler.success(res as any, null, 'Password changed successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }
}