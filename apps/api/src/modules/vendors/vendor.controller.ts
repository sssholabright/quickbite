import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VendorService } from './vendor.service.js';
import { ResponseHandler } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { CloudinaryService } from '../../services/cloudinary.service.js';
import { VendorProfileData } from '../../types/vendor.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    };
}

// Validation schemas
const updateVendorProfileSchema = z.object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters').optional(),
    businessAddress: z.string().min(5, 'Business address must be at least 5 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    logo: z.string().url('Invalid logo URL').optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    isOpen: z.boolean().optional(),
    openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    operatingDays: z.array(z.string()).optional()
});

const updateVendorSettingsSchema = z.object({
    isOpen: z.boolean().optional(),
    openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    operatingDays: z.array(z.string()).optional()
});

export class VendorController {
    // Get vendor profile
    static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            const vendorProfile = await VendorService.getVendorProfile(userId);
            
            ResponseHandler.success(res as any, vendorProfile, 'Vendor profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Update vendor profile
    static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            // Validate request body
            const validatedData = updateVendorProfileSchema.parse(req.body);
            
            // Handle logo upload if present
            let logoUrl = validatedData.logo;
            if (req.file) {
                try {
                    const uploadResult = await CloudinaryService.uploadVendorLogo(req.file.buffer, userId);
                    logoUrl = uploadResult.secure_url;
                    logger.info(`Vendor logo uploaded: ${uploadResult.public_id}`);
                } catch (uploadError) {
                    logger.error({ uploadError }, 'Failed to upload vendor logo');
                    ResponseHandler.error(res as any, 'Failed to upload logo. Please try again.');
                    return;
                }
            }

            // Update profile with logo URL if uploaded
            const updateData = {
                ...validatedData,
                ...(logoUrl && { logo: logoUrl })
            };

            const updatedProfile = await VendorService.updateVendorProfile(userId, updateData as VendorProfileData);
            
            ResponseHandler.success(res as any, updatedProfile, 'Vendor profile updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                ResponseHandler.badRequest(res as any, 'Validation error', error.issues.map(err => err.message).join(', '));
                return;
            }
            next(error);
        }
    }

    // Update vendor settings
    static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            // Validate request body
            const validatedData = updateVendorSettingsSchema.parse(req.body);
            
            const updatedProfile = await VendorService.updateVendorSettings(userId, validatedData as VendorProfileData);
            
            ResponseHandler.success(res as any, updatedProfile, 'Vendor settings updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                ResponseHandler.badRequest(res as any, 'Validation error', error.issues.map(err => err.message).join(', '));
                return;
            }
            next(error);
        }
    }

    // Get vendor statistics
    static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            
            if (!userId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            const stats = await VendorService.getVendorStats(userId);
            
            ResponseHandler.success(res as any, stats, 'Vendor statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}
