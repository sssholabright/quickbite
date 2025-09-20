import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { logger } from './utils/logger.js';

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
    cors: {
        origin: env.NODE_ENV === 'production' 
            ? ['https://yourdomain.com'] 
            : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Setup socket handlers
// setupSocketIO(io);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(async () => {
        logger.info('HTTP server closed');
        
        await prisma.$disconnect();
        logger.info('Database connection closed');
        
        process.exit(0);
    });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📱 Environment: ${env.NODE_ENV}`);
    logger.info(`🔗 API URL: http://localhost:${PORT}/api/v1`);
    logger.info(`🔌 Socket.IO enabled`);
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