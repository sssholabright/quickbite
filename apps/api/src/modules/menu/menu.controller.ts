import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ResponseHandler } from '../../utils/response.js';
import MenuService from './menu.service.js';
import { logger } from '../../utils/logger.js';
import { CloudinaryService } from '../../services/cloudinary.service.js';
import { 
    createMenuItemSchema, 
    updateMenuItemSchema, 
    createCategorySchema, 
    updateCategorySchema 
} from '../../validations/menu.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    };
}

export class MenuController {
    // Create menu item
    static async createMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            // Validate request body
            const validatedData = createMenuItemSchema.parse(req.body);
            
            // 🚀 NEW: Handle image upload if present
            let imageUrl = validatedData.image;
            if (req.file) {
                try {
                    const uploadResult = await CloudinaryService.uploadMenuItemImage(req.file.buffer, 'temp');
                    imageUrl = uploadResult.secure_url;
                    logger.info(`Menu item image uploaded: ${uploadResult.public_id}`);
                } catch (uploadError) {
                    logger.error({ uploadError }, 'Failed to upload menu item image');
                    ResponseHandler.error(res as any, 'Failed to upload image');
                    return;
                }
            }
            
            // Create menu item with image URL
            const menuItemData = { ...validatedData, image: imageUrl };
            const menuItem = await MenuService.createMenuItem(vendorId, menuItemData);
            
            logger.info(`Menu item created: ${menuItem.id} for vendor: ${vendorId}`);
            
            ResponseHandler.created(res as any, menuItem, 'Menu item created successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    // Get vendor menu items
    static async getVendorMenuItems(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            const filters = {
                categoryId: req.query.categoryId as string,
                isAvailable: req.query.isAvailable ? req.query.isAvailable === 'true' : undefined,
                search: req.query.search as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };

            // Filter out undefined values
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== undefined)
            );

            const result = await MenuService.getVendorMenuItems(vendorId, cleanFilters);
            
            ResponseHandler.success(res as any, result, 'Menu items retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get single menu item
    static async getMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            const { menuItemId } = req.params;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            if (!menuItemId) {
                ResponseHandler.badRequest(res as any, 'Menu item ID is required');
                return;
            }

            const menuItem = await MenuService.getMenuItem(vendorId, menuItemId);
            
            ResponseHandler.success(res as any, menuItem, 'Menu item retrieved successfully');
        } catch (error) {
            if (error instanceof Error && error.message === 'Menu item not found') {
                ResponseHandler.notFound(res as any, 'Menu item not found');
                return;
            }
            next(error);
        }
    }

    // Update menu item
    static async updateMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            const { menuItemId } = req.params;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            // Validate request body
            const validatedData = updateMenuItemSchema.parse(req.body);
            
            // 🚀 NEW: Handle image upload if present
            let imageUrl = validatedData.image;
            if (req.file) {
                try {
                    const uploadResult = await CloudinaryService.uploadMenuItemImage(req.file.buffer, menuItemId || '');
                    imageUrl = uploadResult.secure_url;
                    logger.info(`Menu item image uploaded: ${uploadResult.public_id}`);
                } catch (uploadError) {
                    logger.error({ uploadError }, 'Failed to upload menu item image');
                    ResponseHandler.error(res as any, 'Failed to upload image');
                    return;
                }
            }
            
            // Update menu item with image URL
            const menuItemData = { ...validatedData, image: imageUrl };
            const menuItem = await MenuService.updateMenuItem(vendorId, menuItemId || '', menuItemData);
            
            logger.info(`Menu item updated: ${menuItemId} for vendor: ${vendorId}`);
            
            ResponseHandler.success(res as any, menuItem, 'Menu item updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            if (error instanceof Error && error.message === 'Menu item not found') {
                ResponseHandler.notFound(res as any, 'Menu item not found');
                return;
            }
            
            next(error);
        }
    }

    // Delete menu item
    static async deleteMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            const { menuItemId } = req.params;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            if (!menuItemId) {
                ResponseHandler.badRequest(res as any, 'Menu item ID is required');
                return;
            }

            await MenuService.deleteMenuItem(vendorId, menuItemId);
            
            logger.info(`Menu item deleted: ${menuItemId} for vendor: ${vendorId}`);
            
            ResponseHandler.success(res as any, null, 'Menu item deleted successfully');
        } catch (error) {
            if (error instanceof Error && error.message === 'Menu item not found') {
                ResponseHandler.notFound(res as any, 'Menu item not found');
                return;
            }
            next(error);
        }
    }

    // Toggle menu item availability
    static async toggleMenuItemAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            const { menuItemId } = req.params;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            if (!menuItemId) {
                ResponseHandler.badRequest(res as any, 'Menu item ID is required');
                return;
            }

            const menuItem = await MenuService.toggleMenuItemAvailability(vendorId, menuItemId);
            
            ResponseHandler.success(res as any, menuItem, 'Menu item availability updated successfully');
        } catch (error) {
            if (error instanceof Error && error.message === 'Menu item not found') {
                ResponseHandler.notFound(res as any, 'Menu item not found');
                return;
            }
            next(error);
        }
    }

    // Category management
    static async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            // Validate request body
            const validatedData = createCategorySchema.parse(req.body);
            
            // 🚀 NEW: Handle image upload if present
            let imageUrl = validatedData.image;
            if (req.file) {
                try {
                    const uploadResult = await CloudinaryService.uploadCategoryImage(req.file.buffer, 'temp');
                    imageUrl = uploadResult.secure_url;
                    logger.info(`Category image uploaded: ${uploadResult.public_id}`);
                } catch (uploadError) {
                    logger.error({ uploadError }, 'Failed to upload category image');
                    ResponseHandler.error(res as any, 'Failed to upload image');
                    return;
                }
            }
            
            // Create category with image URL
            const categoryData = { ...validatedData, image: imageUrl };
            const category = await MenuService.createCategory(vendorId, categoryData);
            
            logger.info(`Category created: ${category.id} for vendor: ${vendorId}`);
            
            ResponseHandler.created(res as any, category, 'Category created successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    static async getVendorCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            const categories = await MenuService.getVendorCategories(vendorId);
            
            ResponseHandler.success(res as any, categories, 'Categories retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    static async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const vendorId = req.user?.userId;
            const { categoryId } = req.params;
            
            if (!vendorId || req.user?.role !== 'VENDOR') {
                ResponseHandler.unauthorized(res as any, 'Vendor access required');
                return;
            }

            // Validate request body
            const validatedData = updateCategorySchema.parse(req.body);
            
            // 🚀 NEW: Handle image upload if present
            let imageUrl = validatedData.image;
            if (req.file) {
                try {
                    const uploadResult = await CloudinaryService.uploadCategoryImage(req.file.buffer, categoryId || '');
                    imageUrl = uploadResult.secure_url;
                    logger.info(`Category image uploaded: ${uploadResult.public_id}`);
                } catch (uploadError) {
                    logger.error({ uploadError }, 'Failed to upload category image');
                    ResponseHandler.error(res as any, 'Failed to upload image');
                    return;
                }
            }
            
            // Update category with image URL
            const categoryData = { ...validatedData, image: imageUrl };
            const category = await MenuService.updateCategory(categoryId || '', categoryData);
            
            logger.info(`Category updated: ${categoryId} for vendor: ${vendorId}`);
            
            ResponseHandler.success(res as any, category, 'Category updated successfully');
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                ResponseHandler.validationError(res as any, 'Validation failed', errorMessage);
                return;
            }
            
            next(error);
        }
    }

    static async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { categoryId } = req.params;

            if (!categoryId) {
                ResponseHandler.badRequest(res as any, 'Category ID is required');
                return;
            }
            
            await MenuService.deleteCategory(categoryId);
            
            logger.info(`Category deleted: ${categoryId}`);
            
            ResponseHandler.success(res as any, null, 'Category deleted successfully');
        } catch (error) {
            if (error instanceof Error && error.message === 'Cannot delete category with existing menu items') {
                ResponseHandler.badRequest(res as any, 'Cannot delete category with existing menu items');
                return;
            }
            next(error);
        }
    }

    // Public (customer) - List active vendors (optionally onlt those with avaialble items)
    static async getCustomerVendors(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                search: req.query.search as string,
                hasAvailableItems: req.query.hasAvailableItems ? req.query.hasAvailableItems === 'true' : undefined
            };
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([, v]) => v !== undefined)
            );
            const vendors = await MenuService.getCustomerVendors(cleanFilters);
            ResponseHandler.success(res as any, vendors, 'Vendors retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // Public (customer)
    static async getCustomerCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { vendorId } = req.params as { vendorId: string };
            if (!vendorId) {
                ResponseHandler.badRequest(res as any, 'Vendor ID is required');
                return;
            }
            const categories = await MenuService.getCustomerCategories(vendorId);
            ResponseHandler.success(res as any, categories, 'Categories retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    static async getCustomerMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { vendorId } = req.params as { vendorId: string };
            if (!vendorId) {
                ResponseHandler.badRequest(res as any, 'Vendor ID is required');
                return;
            }
            const filters = {
                categoryId: req.query.categoryId as string,
                search: req.query.search as string
            };
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([, v]) => v !== undefined)
            );
            const items = await MenuService.getCustomerMenuItems(vendorId, cleanFilters);
            ResponseHandler.success(res as any, items, 'Menu items retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}