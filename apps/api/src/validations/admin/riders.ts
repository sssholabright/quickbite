import { z } from 'zod';

const cuidString = z.string().cuid();

// Get riders list validation
export const ridersListValidation = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        'filters[search]': z.string().optional(),
        'filters[companyId]': z.string().optional(),
        'filters[status]': z.string().optional(),
        'filters[isOnline]': z.enum(['true', 'false']).optional(),
        'sort[field]': z.enum(['name', 'isOnline', 'earnings', 'rating', 'createdAt', 'vehicleType', 'status']).optional().default('createdAt'),
        'sort[direction]': z.enum(['asc', 'desc']).optional().default('desc'),
        // Also support flat parameters
        search: z.string().optional(),
        companyId: z.string().optional(),
        status: z.string().optional(),
        isOnline: z.enum(['true', 'false']).optional(),
        sortField: z.enum(['name', 'isOnline', 'earnings', 'rating', 'createdAt', 'vehicleType', 'status']).optional(),
        sortDirection: z.enum(['asc', 'desc']).optional()
    })
};

// Get rider details validation
export const riderDetailsValidation = {
    params: z.object({
        id: cuidString
    })
};

// Create rider validation
export const createRiderValidation = {
    body: z.object({
        name: z.string().min(2).max(100),
        phone: z.string().min(10).max(20),
        email: z.string().email(),
        password: z.string().min(6).max(100),
        companyId: cuidString,
        vehicleType: z.enum(['BIKE', 'CAR', 'MOTORCYCLE']),
        bankAccount: z.string().optional()
    })
};

// Update rider validation
export const updateRiderValidation = {
    params: z.object({
        id: cuidString
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        phone: z.string().min(10).max(20).optional(),
        email: z.string().email().optional(),
        vehicleType: z.enum(['BIKE', 'CAR', 'MOTORCYCLE']).optional(),
        bankAccount: z.string().optional(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']).optional()
    })
};

// Suspend rider validation
export const suspendRiderValidation = {
    params: z.object({
        id: cuidString
    }),
    body: z.object({
        reason: z.string().optional()
    })
};

// Activate rider validation
export const activateRiderValidation = {
    params: z.object({
        id: cuidString
    })
};

// Block rider validation
export const blockRiderValidation = {
    params: z.object({
        id: cuidString
    }),
    body: z.object({
        reason: z.string().optional()
    })
};
