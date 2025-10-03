import { Request, Response } from 'express';
import { logger } from '../../../utils/logger.js';
import { paymentsService } from './payments.service.js';
import { PaymentFilters } from '../../../types/admin/payments.js';

export class PaymentsController {
    // Get payments list
    async getPaymentsList(req: Request, res: Response) {
        try {
            // Parse query parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            // Parse sort
            let sortField: 'amount' | 'status' | 'createdAt' | 'completedAt' | 'customerEmail' = 'createdAt';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['amount', 'status', 'createdAt', 'completedAt', 'customerEmail'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['amount', 'status', 'createdAt', 'completedAt', 'customerEmail'].includes(field)) {
                    sortField = field as typeof sortField;
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            // Parse filters
            const filters: PaymentFilters = {
                search: (req.query.search || req.query['filters[search]']) as string,
                status: (req.query.status || req.query['filters[status]']) as any,
                gateway: (req.query.gateway || req.query['filters[gateway]']) as any,
                paymentMethod: (req.query.paymentMethod || req.query['filters[paymentMethod]']) as any,
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

            logger.info({ page, limit, filters, sortField, sortDirection }, 'Payments list request');

            const result = await paymentsService.getPaymentsList({
                page,
                limit,
                filters,
                sort: { field: sortField, direction: sortDirection }
            });

            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching payments list');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch payments' 
            });
        }
    }

    // Get payment details
    async getPaymentDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payment = await paymentsService.getPaymentDetails(id as string);
            return res.json(payment);
        } catch (error: any) {
            logger.error({ error }, 'Error fetching payment details');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to fetch payment details' 
            });
        }
    }

    // Process refund
    async processRefund(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { amount, reason } = req.body;
            const adminId = (req as any).user?.id;

            if (!adminId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await paymentsService.processRefund(id as string, { amount, reason }, adminId);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error processing refund');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to process refund' 
            });
        }
    }

    // Retry payment
    async retryPayment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { paymentMethod, customerEmail, customerPhone } = req.body;
            const adminId = (req as any).user?.id;

            if (!adminId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await paymentsService.retryPayment(id as string, { 
                paymentMethod, 
                customerEmail, 
                customerPhone 
            }, adminId);
            return res.json(result);
        } catch (error: any) {
            logger.error({ error }, 'Error retrying payment');
            return res.status(error.status || 500).json({ 
                message: error.message || 'Failed to retry payment' 
            });
        }
    }
}

export const paymentsController = new PaymentsController();

