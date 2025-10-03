import { Request, Response } from 'express';
import { logger } from '../../../utils/logger.js';
import { customersService } from './customers.service.js';
import { CustomerFilters } from '../../../types/admin/customers.js';

export class CustomersController {
    // Get customers list
    async getCustomersList(req: Request, res: Response) {
        try {
            // Parse query parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            // Parse sort
            let sortField: 'name' | 'createdAt' | 'totalOrders' | 'totalSpent' | 'avgOrderValue' = 'createdAt';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['name', 'createdAt', 'totalOrders', 'totalSpent', 'avgOrderValue'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['name', 'createdAt', 'totalOrders', 'totalSpent', 'avgOrderValue'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            // Parse filters
            const filters: CustomerFilters = {
                search: (req.query.search || req.query['filters[search]']) as string,
                status: (req.query.status || req.query['filters[status]']) as 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'VERIFICATION_PENDING',
                ...(req.query['filters[dateRange][start]'] && req.query['filters[dateRange][end]'] ? {
                    dateRange: {
                        start: req.query['filters[dateRange][start]'] as string,
                        end: req.query['filters[dateRange][end]'] as string
                    }
                } : {})
            };

            logger.info({ page, limit, filters, sortField, sortDirection }, 'Customers list request');

            const result = await customersService.getCustomersList({
                page,
                limit,
                filters,
                sort: { field: sortField, direction: sortDirection }
            });

            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching customers list');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch customers' 
            });
        }
    }

    // Get customer details
    async getCustomerDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const customer = await customersService.getCustomerDetails(id as string);
            return res.json(customer);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching customer details');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch customer details' 
            });
        }
    }

    // Update customer
    async updateCustomer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await customersService.updateCustomer(id as string, req.body);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error updating customer');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to update customer' 
            });
        }
    }

    // Suspend customer
    async suspendCustomer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const result = await customersService.suspendCustomer(id as string, reason);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error suspending customer');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to suspend customer' 
            });
        }
    }

    // Block customer
    async blockCustomer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const result = await customersService.blockCustomer(id as string, reason);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error blocking customer');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to block customer' 
            });
        }
    }

    // Activate customer
    async activateCustomer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await customersService.activateCustomer(id as string);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error activating customer');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to activate customer' 
            });
        }
    }

    // Get customer order history
    async getCustomerOrderHistory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await customersService.getCustomerOrderHistory(id as string, page, limit);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching customer order history');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch customer order history' 
            });
        }
    }
}

export const customersController = new CustomersController();