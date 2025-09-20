import { z } from "zod";

// Validation schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    role: z.enum(['CUSTOMER', 'RIDER', 'VENDOR'], {
        message: 'Role must be CUSTOMER, RIDER, or VENDOR'
    })
});
  
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});
  
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
});