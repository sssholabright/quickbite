import { Request, Response } from 'express';
import { logger } from '../../../utils/logger.js';
import { CustomError } from '../../../middlewares/errorHandler.js';
import { CreateRiderRequest, RidersListParams, UpdateRiderRequest } from '../../../types/admin/rider.js';
import { RiderService } from './rider.service.js';

export class RiderController {
    // Get list of riders
    static async getRidersList(req: Request, res: Response) {
        try {
            // Parse sort parameters
            let sortField: 'name' | 'isOnline' | 'earnings' | 'rating' | 'createdAt' | 'vehicleType' | 'status' = 'createdAt';
            let sortDirection: 'asc' | 'desc' = 'desc';

            if (req.query.sortField) {
                const field = req.query.sortField as string;
                if (['name', 'isOnline', 'earnings', 'rating', 'createdAt', 'vehicleType', 'status'].includes(field)) {
                    sortField = field as any;
                }
            } else if (req.query['sort[field]']) {
                const field = req.query['sort[field]'] as string;
                if (['name', 'isOnline', 'earnings', 'rating', 'createdAt', 'vehicleType', 'status'].includes(field)) {
                    sortField = field as any;
                }
            }

            if (req.query.sortDirection) {
                sortDirection = req.query.sortDirection as 'asc' | 'desc';
            } else if (req.query['sort[direction]']) {
                sortDirection = req.query['sort[direction]'] as 'asc' | 'desc';
            }

            const params: RidersListParams = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
                filters: {
                    search: (req.query.search || req.query['filters[search]']) as string,
                    companyId: (req.query.companyId || req.query['filters[companyId]']) as string,
                    status: (req.query.status || req.query['filters[status]']) as string,
                    isOnline: req.query.isOnline ? req.query.isOnline === 'true' : false,
                },
                sort: {
                    field: sortField,
                    direction: sortDirection
                }
            };

            const result = await RiderService.getRidersList(params);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Get riders list controller error');
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

    // Get single rider details
    static async getRiderDetails(req: Request, res: Response) {
        try {
            const riderId = req.params.id;

            if (!riderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Rider ID is required'
                });
            }

            const result = await RiderService.getRiderDetails(riderId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Get rider details controller error');
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

    // Create new rider
    static async createRider(req: Request, res: Response) {
        try {
            const riderData: CreateRiderRequest = req.body;

            const result = await RiderService.createRider(riderData);

            return res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Create rider controller error');
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

    // Update rider
    static async updateRider(req: Request, res: Response) {
        console.log('Update rider controller:', req.body);
        try {
            const riderId = req.params.id;
            const updateData: UpdateRiderRequest = req.body;

            if (!riderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Rider ID is required'
                });
            }

            const result = await RiderService.updateRider(riderId, updateData);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Update rider controller error');
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

    // Suspend rider
    static async suspendRider(req: Request, res: Response) {
        try {
            const riderId = req.params.id;
            const { reason } = req.body;

            if (!riderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Rider ID is required'
                });
            }

            const result = await RiderService.suspendRider(riderId, reason);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Suspend rider controller error');
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

    // Activate rider
    static async activateRider(req: Request, res: Response) {
        try {
            const riderId = req.params.id;

            if (!riderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Rider ID is required'
                });
            }

            const result = await RiderService.activateRider(riderId);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Activate rider controller error');
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

    // Block rider
    static async blockRider(req: Request, res: Response) {
        try {
            const riderId = req.params.id;
            const { reason } = req.body;

            if (!riderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Rider ID is required'
                });
            }

            const result = await RiderService.blockRider(riderId, reason);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error({ error }, 'Block rider controller error');
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