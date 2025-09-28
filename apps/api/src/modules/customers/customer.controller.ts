import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CustomerService } from './customer.service.js';
import { ResponseHandler } from '../../utils/response.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    };
}

export class CustomerController {
    // Update push token
    static async updatePushToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }

            // Validate request body
            const updatePushTokenSchema = z.object({
                pushToken: z.string().min(1, 'Push token is required'),
            });

            const { pushToken } = updatePushTokenSchema.parse(req.body);
            
            // Update push token
            const customer = await CustomerService.updatePushToken(userId, pushToken);
            
            ResponseHandler.success(res as any, { pushToken: customer.pushToken }, 'Push token updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Get push token
    static async getPushToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                ResponseHandler.unauthorized(res as any, 'User not authenticated');
                return;
            }
            
            // Get push token
            const pushToken = await CustomerService.getPushToken(userId);
            
            ResponseHandler.success(res as any, { pushToken }, 'Push token retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}
