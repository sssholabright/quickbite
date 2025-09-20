import { Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export class ResponseHandler {
    static success<T>(
        res: Response,
        data: T,
        message: string = 'Success',
        statusCode: number = 200,
        meta?: ApiResponse['meta']
    ): Response {
        const response: ApiResponse<T> = {
            success: true,
            message,
            data,
            ...(meta && { meta })
        };

        return res.status(statusCode).json(response);
    }

    static error(
        res: Response,
        message: string = 'Internal Server Error',
        statusCode: number = 500,
        error?: string
    ): Response {
        const response: ApiResponse = {
            success: false,
            message,
            ...(error && { error })
        };

        return res.status(statusCode).json(response);
    }

    static created<T>(
        res: Response,
        data: T,
        message: string = 'Resource created successfully'
    ): Response {
        return this.success(res, data, message, 201);
    }

    static notFound(
        res: Response,
        message: string = 'Resource not found'
    ): Response {
        return this.error(res, message, 404);
    }

    static unauthorized(
        res: Response,
        message: string = 'Unauthorized access'
    ): Response {
        return this.error(res, message, 401);
    }

    static forbidden(
        res: Response,
        message: string = 'Forbidden access'
    ): Response {
        return this.error(res, message, 403);
    }

    static badRequest(
        res: Response,
        message: string = 'Bad request',
        error?: string
    ): Response {
        return this.error(res, message, 400, error);
    }

    static validationError(
        res: Response,
        message: string = 'Validation error',
        error?: string
    ): Response {
        return this.error(res, message, 422, error);
    }
}