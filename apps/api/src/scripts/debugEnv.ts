import { config } from "dotenv";
import { z } from "zod";

// Load environment variables
config();

console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
console.log('REFRESH_TOKEN_SECRET length:', process.env.REFRESH_TOKEN_SECRET?.length || 0);
console.log('REDIS_URL:', process.env.REDIS_URL);

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

    // Cloudinary (make optional for development)
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

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
});

try {
    const env = envSchema.parse(process.env);
    console.log('✅ Environment validation passed!');
} catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
    } else {
        console.error(error);
    }
}
