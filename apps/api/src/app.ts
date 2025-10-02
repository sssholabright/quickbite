import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import morgan from 'morgan';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { authRateLimit, generalRateLimit } from './middlewares/rateLimiter.js';
import { redisService } from './config/redis.js';

// Import route modules
import authRoutes from './modules/auth/auth.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import riderRoutes from './modules/riders/rider.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import adminRoutes from './modules/admin/admins/admin.routes.js';
import dashboardRoutes from './modules/admin/stats/dashboard.routes.js';
// import userRoutes from './modules/users/routes.js';
// import vendorRoutes from './modules/vendors/routes.js';
// import riderRoutes from './modules/riders/routes.js';
// import paymentRoutes from './modules/payments/routes.js';
import { initializeSocket } from './config/socket.js';

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: env.NODE_ENV === 'production' 
        ? ['https://quickbite-roan.vercel.app'] 
        : ['http://localhost:5174', 'http://localhost:5173', 'https://quickbite-roan.vercel.app', 'http://192.168.0.176:8081','http://192.168.0.176:8082', 'http://10.249.44.234:8081','http://10.249.44.234:8082'], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// General rate limiting for all API routes
// app.use('/api/', generalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message: string) => logger.info(message.trim())
        }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        redis: redisService.isRedisConnected()
    });
});

// Route modules 
app.use('/api/v1/auth', authRateLimit, authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/riders', riderRoutes);
app.use('/api/v1/customers', customerRoutes);

// Admin routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/stats', dashboardRoutes);
// app.use('/api/v1/vendors', vendorRoutes);
// app.use('/api/v1/payments', paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize WebSocket after creating HTTP server
export { app };