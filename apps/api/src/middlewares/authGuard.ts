import { NextFunction, Request, Response } from 'express';
import { ResponseHandler } from './../utils/response.js';
import { logger } from './../utils/logger.js';
import { JWTService } from './../utils/jwt.js';
import { JWTPayload } from '../types/jwt.js';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

export interface AuthGuardOptions {
    requiredRoles?: Array<'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN'>;
    allowExpired?: boolean;
}

// Authentication guard middleware. Verifies JWT token and attaches user info to request
export const authGuard = (options: AuthGuardOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;
            const token = JWTService.extractTokenFromHeader(authHeader);

            // Verify token
            const payload = JWTService.verifyAccessToken(token);

            // check if role is required and matches
            if (options.requiredRoles && !options.requiredRoles.includes(payload.role)) {
                logger.warn(`Access denied for role ${payload.role} to ${req.path}`);
                ResponseHandler.forbidden(res, 'Insufficient permissions');
                return;
            }

            // Attach user info to request
            req.user = payload;

            logger.debug(`Authenticated user: ${payload.email} (${payload.role})`);
            next();
        } catch (error) {
            logger.warn(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    ResponseHandler.unauthorized(res, 'Token has expired');
                    return
                } else if (error.message.includes('Invalid')) {
                    ResponseHandler.unauthorized(res, 'Invalid token');
                    return
                }
            }

            ResponseHandler.unauthorized(res, 'Authentication required');
            return
        }
    };
}

// Optional authentication middleware. Attaches user info if token is valid, but doesn't block request
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }

        const token = JWTService.extractTokenFromHeader(authHeader);
        const payload = JWTService.verifyAccessToken(token);
        req.user = payload;
    } catch (error) {
        // Silently ignore authentication errors for optional auth
        logger.debug(`Optional auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    next();
};

// Role-based access control middleware
export const requireRole = (...roles: Array<'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN'>) => {
    return authGuard({ requiredRoles: roles });
};
  
// Admin only middleware
export const requireAdmin = requireRole('ADMIN');
  
// Rider only middleware
export const requireRider = requireRole('RIDER');

// Vendor only middleware
export const requireVendor = requireRole('VENDOR');
  
// Customer only middleware
export const requireCustomer = requireRole('CUSTOMER');