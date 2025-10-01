import { createServer } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { logger } from './utils/logger.js';
import { initializeSocket, setSocketManager } from './config/socket.js';
import { redisService } from './config/redis.js';
import { QueueService } from './modules/queues/queue.service.js';
import { DeliveryJobService } from './modules/delivery/deliveryJob.service.js';

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with our custom manager
const socketManager = initializeSocket(server);

// 🚀 FIXED: Set socket manager globally
setSocketManager(socketManager);
logger.info('📡 Socket manager initialized and set globally');

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close queue service
        await redisService.disconnect();
        logger.info('Redis connection closed');
        
        await prisma.$disconnect();
        logger.info('Database connection closed');
        
        process.exit(0);
    });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = Number(env.PORT);

server.listen(PORT, async () => {
    try {
        // Initialize Redis connection
        await redisService.connect();
        logger.info('🔴 Redis connected successfully');
        
        // Initialize Queue Service
        const queue = QueueService.getInstance();
        logger.info('📋 Queue service initialized successfully');

        // After database connection is established
        await DeliveryJobService.loadQueueFromDatabase();
        logger.info('🔔 Delivery queue loaded from database successfully');
        
        // 🚀 REMOVED: Notification queue service (web-only, not needed for mobile)
        logger.info('🔔 Unified notification service ready (mobile: socket+FCM, web: socket+queue)');
        
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`🌍 Environment: ${env.NODE_ENV}`);
        logger.info(`🔗 API URL: http://localhost:${PORT}/api/v1`);
        logger.info(`🔌 Socket.IO enabled`);
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
}).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        server.listen(PORT + 1);
    } else {
        throw err;
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error({ err: error}, 'Uncaught Exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Rejection');
    process.exit(1);
});