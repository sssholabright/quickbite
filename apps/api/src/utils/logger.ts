import pino from "pino";
import { env } from "../config/env.js";

// Create logger instance
export const logger = pino({
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    ...(env.NODE_ENV === 'development' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname'
            }
        }
    }),
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        }
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTED]'
    }
})

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
    return logger.child({ module });
};