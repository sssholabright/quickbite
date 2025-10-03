import { Request, Response } from 'express';
import { logger } from '../../../utils/logger.js';
import { payoutsService } from './payouts.service.js';
import { PayoutFilters } from '../../../types/admin/payouts.js';

export class PayoutsController {
    // Get payouts list
    async getPayoutsList(req: Request, res: Response) {
        try {
            // Parse query parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            // Parse sort
            let sortField: 'amount' | 'status' | 'createdAt' | 'completedAt' | 'recipientName' = 'createdAt';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['amount', 'status', 'createdAt', 'completedAt', 'recipientName'].includes(field)) {    
                    sortField = field as typeof sortField;
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['amount', 'status', 'createdAt', 'completedAt', 'recipientName'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            // Parse filters
            const filters: PayoutFilters = {
                search: (req.query.search || req.query['filters[search]']) as string,
                status: (req.query.status || req.query['filters[status]']) as any,
                recipientType: (req.query.recipientType || req.query['filters[recipientType]']) as any,
                ...(req.query['filters[dateRange][start]'] && req.query['filters[dateRange][end]'] ? {
                    dateRange: {
                        start: req.query['filters[dateRange][start]'] as string,
                        end: req.query['filters[dateRange][end]'] as string
                    }
                } : {}),
                ...(req.query['filters[amountRange][min]'] && req.query['filters[amountRange][max]'] ? {
                    amountRange: {
                        min: parseFloat(req.query['filters[amountRange][min]'] as string),
                        max: parseFloat(req.query['filters[amountRange][max]'] as string)
                    }
                } : {})
            };

            logger.info({ page, limit, filters, sortField, sortDirection }, 'Payouts list request');

            const result = await payoutsService.getPayoutsList({
                page,
                limit,
                filters,
                sort: { field: sortField, direction: sortDirection }
            });

            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching payouts list');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch payouts' 
            });
        }
    }

    // Get wallets list
    async getWalletsList(req: Request, res: Response) {
        try {
            // Parse query parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            // Parse sort
            let sortField: 'currentBalance' | 'pendingBalance' | 'totalEarnings' | 'lastPayoutDate' | 'recipientName' = 'currentBalance';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['currentBalance', 'pendingBalance', 'totalEarnings', 'lastPayoutDate', 'recipientName'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['currentBalance', 'pendingBalance', 'totalEarnings', 'lastPayoutDate', 'recipientName'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            const recipientType = (req.query.recipientType || req.query['filters[recipientType]']) as 'VENDOR' | 'RIDER';

            // Parse filters
            const filters = {
                search: (req.query.search || req.query['filters[search]']) as string,
                hasBalance: req.query['filters[hasBalance]'] === 'true',
                canPayout: req.query['filters[canPayout]'] === 'true',
                isActive: req.query['filters[isActive]'] === 'true'
            };

            logger.info({ page, limit, recipientType, filters, sortField, sortDirection }, 'Wallets list request');

            const result = await payoutsService.getWalletsList({
                page,
                limit,
                recipientType,
                filters,
                sort: { field: sortField, direction: sortDirection }
            });

            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching wallets list');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch wallets' 
            });
        }
    }

    // Create payout
    async createPayout(req: Request, res: Response) {
        try {
            const { recipientType, recipientId, amount, description, notes } = req.body;
            const adminId = (req as any).user?.id;

            if (!adminId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await payoutsService.createPayout({
                recipientType,
                recipientId,
                amount,
                description,
                notes
            }, adminId);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error creating payout');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to create payout' 
            });
        }
    }

    // Get payout details
    async getPayoutDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payout = await payoutsService.getPayoutDetails(id as string);
            return res.json(payout);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching payout details');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch payout details' 
            });
        }
    }

    // Update payout
    async updatePayout(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, notes, approvedBy } = req.body;
            const adminId = (req as any).user?.id;

            if (!adminId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await payoutsService.updatePayout(id as string, {
                status,
                notes,
                approvedBy
            }, adminId);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error updating payout');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to update payout' 
            });
        }
    }
}

export const payoutsController = new PayoutsController();