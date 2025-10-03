import { z } from 'zod';

export const createVendorValidation = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Valid email is required'),
        phone: z.string().min(10, 'Valid phone number is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        businessName: z.string().min(1, 'Business name is required'),
        businessAddress: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        description: z.string().optional(),
        openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Opening time must be in HH:MM format').optional(),
        closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Closing time must be in HH:MM format').optional(),
        operatingDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional()
    })
});

export const updateVendorValidation = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(10).optional(),
        businessName: z.string().min(1).optional(),
        businessAddress: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        description: z.string().optional(),
        openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        operatingDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
        status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED', 'BLOCKED']).optional()
    })
});

export const updateVendorLocationValidation = z.object({
    body: z.object({
        latitude: z.number(),
        longitude: z.number(),
        businessAddress: z.string().optional()
    })
});

export const suspendVendorValidation = z.object({
    body: z.object({
        reason: z.string().optional()
    })
});

export const rejectVendorValidation = z.object({
    body: z.object({
        reason: z.string().optional()
    })
});

export const blockVendorValidation = z.object({
    body: z.object({
        reason: z.string().optional()
    })
});

export const vendorsListValidation = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED', 'BLOCKED']).optional(),
        isOpen: z.enum(['true', 'false']).optional(),
        sortField: z.enum(['businessName', 'createdAt', 'totalOrders', 'avgPrepTime', 'rating']).optional(),
        sortDirection: z.enum(['asc', 'desc']).optional()
    })
});

export const vendorDetailsValidation = z.object({
    params: z.object({
        id: z.string().min(1, 'Vendor ID is required')
    })
});