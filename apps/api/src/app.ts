import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import morgan from 'morgan';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

// Import route modules (we'll create these next)
// import authRoutes from './modules/auth/routes.js';
// import userRoutes from './modules/users/routes.js';
// import orderRoutes from './modules/orders/routes.js';
// import vendorRoutes from './modules/vendors/routes.js';
// import riderRoutes from './modules/riders/routes.js';
// import paymentRoutes from './modules/payments/routes.js';

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.',
//     retryAfter: '15 minutes'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api/', limiter);

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
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API routes
// app.use('/api/v1', (req, res, next) => {
//     // Add API version to request
//     req.apiVersion = 'v1';
//     next();
// });

// Route modules (we'll uncomment these as we create them)
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/vendors', vendorRoutes);
// app.use('/api/v1/riders', riderRoutes);
// app.use('/api/v1/payments', paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export { app };