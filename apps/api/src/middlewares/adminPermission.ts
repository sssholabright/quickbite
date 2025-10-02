import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
        adminRole?: string;
        permissions?: string[];
    };
}

/**
 * Middleware to check if admin has required permission(s)
 */
export const requirePermission = (requiredPermissions: string | string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        // Check if user is authenticated
        if (!req.user) {
            ResponseHandler.unauthorized(res as any, 'Unauthorized');
            return;
        }

        // Check if user is an admin
        if (req.user.role !== 'ADMIN') {
            ResponseHandler.forbidden(res as any, 'Access denied: Admin role required');
            return;
        }

        // Get admin permissions
        const adminPermissions = req.user.permissions || [];

        // Handle single permission check
        if (typeof requiredPermissions === 'string') {
            if (!adminPermissions.includes(requiredPermissions)) {
                ResponseHandler.forbidden(
                    res as any,
                    `Access denied: Missing permission '${requiredPermissions}'`
                );
                return;
            }
        } else {
            // Handle multiple permissions check (require ALL)
            const missingPermissions = requiredPermissions.filter(
                perm => !adminPermissions.includes(perm)
            );

            if (missingPermissions.length > 0) {
                ResponseHandler.forbidden(
                    res as any,
                    `Access denied: Missing permissions: ${missingPermissions.join(', ')}`
                );
                return;
            }
        }

        // Permission check passed
        next();
    };
};

/**
 * Middleware to check if admin has ANY of the required permissions
 */
export const requireAnyPermission = (requiredPermissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        // Check if user is authenticated
        if (!req.user) {
            ResponseHandler.unauthorized(res as any, 'Unauthorized');
            return;
        }

        // Check if user is an admin
        if (req.user.role !== 'ADMIN') {
            ResponseHandler.forbidden(res as any, 'Access denied: Admin role required');
            return;
        }

        // Get admin permissions
        const adminPermissions = req.user.permissions || [];

        // Check if admin has any of the required permissions
        const hasAnyPermission = requiredPermissions.some(perm =>
            adminPermissions.includes(perm)
        );

        if (!hasAnyPermission) {
            ResponseHandler.forbidden(
                res as any,
                `Access denied: Requires one of: ${requiredPermissions.join(', ')}`
            );
            return;
        }

        // Permission check passed
        next();
    };
};