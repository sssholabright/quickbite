import { z } from 'zod';

export const adminLoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

export const createAdminSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    adminRole: z.enum(['SUPER_ADMIN', 'OPS_MANAGER', 'SUPPORT_STAFF']),
    permissions: z.array(z.string()).optional()
});
