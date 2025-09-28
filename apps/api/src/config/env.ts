import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Define environment schema for validation
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default(5000),
    FRONTEND_URL: z.string().min(1, 'Frontend URL is required'),

    // Database
    DATABASE_URL: z.string().min(1, 'Database URL is required'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    REFRESH_TOKEN_SECRET: z.string().min(32, 'Refresh token secret must be at least 32 characters'),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required'),
    CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required'),
    CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API secret is required'),

    // Redis (for caching, sessions, and queues)
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // Email (for notifications)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().transform(Number).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    // Payment (Paystack)
    PAYSTACK_BASE_URL: z.string().optional(),
    PAYSTACK_SECRET_KEY: z.string().optional(),

    // Maps API
    GOOGLE_MAPS_API_KEY: z.string().optional(),

    // 🚀 NEW: Socket configuration
    SOCKET_CORS_ORIGINS: z.string().optional(),

    // 🚀 NEW: FCM configuration
    FCM_PROJECT_ID: z.string().default('quickbite-33132'),
    FCM_PRIVATE_KEY_ID: z.string().optional(),
    FCM_PRIVATE_KEY: z.string().optional(),
    FCM_CLIENT_EMAIL: z.string().optional(),
    FCM_CLIENT_ID: z.string().optional(),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Type for environment variables
export type Env = z.infer<typeof envSchema>;