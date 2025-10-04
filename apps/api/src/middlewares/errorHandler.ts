import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { ResponseHandler } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): Response | void => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let isOperational = error.isOperational || false;

    // Log error
    logger.error({
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            statusCode,
            isOperational
        },
        request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query
        }
    });

    // Handle specific error types
    if (error instanceof ZodError) {
        statusCode = 422;
        message = 'Validation error';
        const validationErrors = error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        
        return ResponseHandler.validationError(res, message, JSON.stringify(validationErrors));
    }

    if (error instanceof PrismaClientKnownRequestError) {
        const prismaError = error as PrismaClientKnownRequestError;
        switch (prismaError.code) {
            case 'P2002':
                statusCode = 409;
                message = 'Resource already exists';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Resource not found';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Invalid reference';
                break;
            default:
                statusCode = 500;
                message = 'Database error';
            }
    }

    if (error instanceof PrismaClientValidationError) {
        statusCode = 400;
        message = 'Invalid data provided';
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && !isOperational) {
        message = 'Something went wrong';
    }

    ResponseHandler.error(res, message, statusCode);
};