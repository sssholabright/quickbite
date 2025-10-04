import { Request, Response } from 'express';
import { logger } from '../../../utils/logger.js';
import { vendorsService } from './vendor.service.js';
import { VendorFilters } from '../../../types/admin/vendors.js';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    };
}

export class VendorsController {
    // Get vendors list
    async getVendorsList(req: Request, res: Response) {
        try {
            // Parse query parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            // Parse sort
            let sortField: 'businessName' | 'createdAt' | 'totalOrders' | 'avgPrepTime' | 'rating' = 'createdAt';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['businessName', 'createdAt', 'totalOrders', 'avgPrepTime', 'rating'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['businessName', 'createdAt', 'totalOrders', 'avgPrepTime', 'rating'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            // Parse filters
            const filters = {
                search: (req.query.search || req.query['filters[search]']) as string,
                status: (req.query.status || req.query['filters[status]']) as string,
                isOpen: req.query.isOpen === 'true' || req.query['filters[isOpen]'] === 'true' 
                    ? true 
                    : req.query.isOpen === 'false' || req.query['filters[isOpen]'] === 'false'
                    ? false
                    : undefined
            };

            logger.info({ page, limit, filters, sortField, sortDirection }, 'Vendors list request');

            const result = await vendorsService.getVendorsList({
                page,
                limit,
                filters: filters as VendorFilters,
                sort: { field: sortField, direction: sortDirection }
            });

            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching vendors list');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch vendors' 
            });
        }
    }

    // Get vendor details
    async getVendorDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vendor = await vendorsService.getVendorDetails(id as string);
            return res.json(vendor);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching vendor details');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch vendor details' 
            });
        }
    }

    // Create vendor
    async createVendor(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await vendorsService.createVendor(req.body, req.file);
            return res.status(201).json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error creating vendor');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to create vendor' 
            });
        }
    }

    // Update vendor
    async updateVendor(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await vendorsService.updateVendor(id as string, req.body, req.file);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error updating vendor');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to update vendor' 
            });
        }
    }

    // Update vendor location
    async updateVendorLocation(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await vendorsService.updateVendorLocation(id as string, req.body);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error updating vendor location');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to update vendor location' 
            });
        }
    }

    // Approve vendor
    async approveVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await vendorsService.approveVendor(id as string);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error approving vendor');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to approve vendor' 
            });
        }
    }

    // Suspend vendor
    async suspendVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const result = await vendorsService.suspendVendor(id as string, reason);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error suspending vendor');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to suspend vendor' 
            });
        }
    }

    // Reject vendor
    async rejectVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const result = await vendorsService.rejectVendor(id as string, reason);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error rejecting vendor');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to reject vendor' 
            });
        }
    }

    // Block vendor
    async blockVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const result = await vendorsService.blockVendor(id as string, reason);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error blocking vendor');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to block vendor' 
            });
        }
    }

    // Activate vendor
    async activateVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await vendorsService.activateVendor(id as string);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error activating vendor');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to activate vendor' 
            });
        }
    }

    // Update vendor open status
    async updateVendorOpenStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await vendorsService.updateVendorOpenStatus(id as string);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error updating vendor status');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to update vendor status' 
            });
        }
    }
}

export const vendorsController = new VendorsController();
