import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response.js';

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const message = `Route ${req.method} ${req.originalUrl} not found`;
    ResponseHandler.notFound(res, message);
};