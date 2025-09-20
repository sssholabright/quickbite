import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

// Rate limit store
const createRateLimitStore = () => {
    const store = new Map();
  
    return {
        increment: (key: string) => {
            const now = Date.now();
            const windowMs = 15 * 60 * 1000; // 15 minutes default
            const windowStart = now - windowMs;
        
            // Clean up expired entries
            for (const [k, v] of store.entries()) {
                if (v.timestamp < windowStart) {
                    store.delete(k);
                }
            }
        
            const entry = store.get(key);
            if (!entry || entry.timestamp < windowStart) {
                store.set(key, { count: 1, timestamp: now });
                return { totalHits: 1, resetTime: new Date(now + windowMs) };
            }
            
            entry.count++;
            return { totalHits: entry.count, resetTime: new Date(entry.timestamp + windowMs) };
        },
        decrement: (key: string) => {
            const entry = store.get(key);
            if (entry && entry.count > 0) {
                entry.count--;
            }
        },
        resetKey: (key: string) => {
            store.delete(key);
        }
    };
};

// Custom rate limit handler
const createRateLimitHandler = (message: string) => {
    return (req: Request, res: Response) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        logger.warn(`Rate limit exceeded for IP: ${ip}, Path: ${req.path}`);
        
        res.status(429).json({
            success: false,
            message,
            error: 'Too many requests',
            retryAfter: '15 minutes'
        });
    };
};

// Custom key generator for different rate limits
const createKeyGenerator = (prefix: string) => {
    return (req: Request) => {
        const ip = ipKeyGenerator(req as any); // Use ipKeyGenerator helper for IPv6 support
        const userId = req.user?.userId || 'anonymous';
        return `${prefix}:${ip}:${userId}`;
    };
};

// 1. General API Rate Limiter (100 requests per 15 minutes)
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many requests from this IP, please try again later.'),
    keyGenerator: createKeyGenerator('general'),
    store: createRateLimitStore()
});

// 2. Authentication Rate Limiter (5 attempts per 15 minutes)
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many authentication attempts, please try again later.'),
    keyGenerator: createKeyGenerator('auth'),
    store: createRateLimitStore(),
    skipSuccessfulRequests: true // Don't count successful requests
});

// 3. Registration Rate Limiter (3 registrations per hour)
export const registrationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registrations per hour
    message: 'Too many registration attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many registration attempts, please try again later.'),
    keyGenerator: createKeyGenerator('registration'),
    store: createRateLimitStore()
});

// 4. Password Reset Rate Limiter (3 attempts per hour)
export const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many password reset attempts, please try again later.'),
    keyGenerator: createKeyGenerator('password-reset'),
    store: createRateLimitStore()
});

// 5. Order Creation Rate Limiter (10 orders per minute)
export const orderCreationRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each user to 10 orders per minute
    message: 'Too many order creation attempts, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many order creation attempts, please slow down.'),
    keyGenerator: createKeyGenerator('order-creation'),
    store: createRateLimitStore()
});

// 6. File Upload Rate Limiter (5 uploads per minute)
export const fileUploadRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each user to 5 file uploads per minute
    message: 'Too many file upload attempts, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many file upload attempts, please slow down.'),
    keyGenerator: createKeyGenerator('file-upload'),
    store: createRateLimitStore()
});

// 7. Search Rate Limiter (20 searches per minute)
export const searchRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // limit each user to 20 searches per minute
    message: 'Too many search requests, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many search requests, please slow down.'),
    keyGenerator: createKeyGenerator('search'),
    store: createRateLimitStore()
    });

// 8. Strict Rate Limiter (5 requests per minute) - for sensitive operations
export const strictRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each user to 5 requests per minute
    message: 'Too many requests, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many requests, please slow down.'),
    keyGenerator: createKeyGenerator('strict'),
    store: createRateLimitStore()
});

// 9. Admin Rate Limiter (1000 requests per 15 minutes) - more lenient for admins
    export const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each admin to 1000 requests per 15 minutes
    message: 'Too many admin requests, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many admin requests, please slow down.'),
    keyGenerator: createKeyGenerator('admin'),
    store: createRateLimitStore()
});

// 10. Webhook Rate Limiter (50 webhooks per minute)
export const webhookRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // limit each IP to 50 webhook calls per minute
    message: 'Too many webhook requests, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many webhook requests, please slow down.'),
    keyGenerator: createKeyGenerator('webhook'),
    store: createRateLimitStore()
});

// Rate limit bypass for trusted IPs (optional)
export const createBypassRateLimit = (trustedIPs: string[]) => {
    return (req: Request) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return trustedIPs.includes(ip);
    };
};

// Rate limit info middleware (for debugging)
export const rateLimitInfo = (req: Request, res: Response, next: Function) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.userId || 'anonymous';
    
    logger.debug(`Rate limit info - IP: ${ip}, User: ${userId}, Path: ${req.path}`);
    next();
};