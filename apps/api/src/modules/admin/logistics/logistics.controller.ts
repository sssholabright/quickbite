import { Request, Response } from 'express';
import { logger } from '../../../utils/logger.js';
import { LogisticsService } from './logistics.service.js';
import { CustomError } from '../../../middlewares/errorHandler.js';
import { 
    LogisticsCompaniesListParams,
    CreateLogisticsCompanyRequest,
    UpdateLogisticsCompanyRequest
} from '../../../types/admin/logistics.js';

export class LogisticsController {
    // Get list of logistics companies
    static async getCompaniesList(req: Request, res: Response) {
        try {
            // Parse sort parameters
            let sortField: 'name' | 'status' | 'createdAt' = 'createdAt';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['name', 'status', 'createdAt'].includes(field)) {
                    sortField = field as 'name' | 'status' | 'createdAt';
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['name', 'status', 'createdAt'].includes(field)) {
                    sortField = field as 'name' | 'status' | 'createdAt';
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            const params: LogisticsCompaniesListParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
                filters: {
                    status: (req.query.status || req.query['filters[status]']) as string,
                    search: (req.query.search || req.query['filters[search]']) as string,
                },
                sort: {
                    field: sortField,
                    direction: sortDirection
                }
            };

            const result = await LogisticsService.getCompaniesList(params);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Get logistics companies list controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Get single logistics company details
    static async getCompanyDetails(req: Request, res: Response) {
        try {
            const companyId = req.params.id;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const result = await LogisticsService.getCompanyDetails(companyId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Get logistics company details controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Create new logistics company
    static async createCompany(req: Request, res: Response) {
        try {
            const request: CreateLogisticsCompanyRequest = req.body;

            const result = await LogisticsService.createCompany(request);

            return res.status(201).json({
                success: true,
                data: result,
                message: 'Logistics company created successfully'
            });
        } catch (error) {
            logger.error({ error }, 'Create logistics company controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Update logistics company
    static async updateCompany(req: Request, res: Response) {
        try {
            const companyId = req.params.id;
            const request: UpdateLogisticsCompanyRequest = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const result = await LogisticsService.updateCompany(companyId, request);

            return res.json({
                success: true,
                data: result,
                message: 'Logistics company updated successfully'
            });
        } catch (error) {
            logger.error({ error }, 'Update logistics company controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Suspend logistics company
    static async suspendCompany(req: Request, res: Response) {
        try {
            const companyId = req.params.id;
            const { reason } = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const result = await LogisticsService.suspendCompany(companyId, reason);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Suspend logistics company controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Activate logistics company
    static async activateCompany(req: Request, res: Response) {
        try {
            const companyId = req.params.id;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const result = await LogisticsService.activateCompany(companyId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Activate logistics company controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    // Block logistics company
    static async blockCompany(req: Request, res: Response) {
        try {
            const companyId = req.params.id;
            const { reason } = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const result = await LogisticsService.blockCompany(companyId, reason);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Block logistics company controller error');
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }
}