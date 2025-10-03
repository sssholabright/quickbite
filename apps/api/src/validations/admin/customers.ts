import { z } from 'zod';

export const updateCustomerValidation = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(10).optional(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'VERIFICATION_PENDING']).optional()
    })
});

export const suspendCustomerValidation = z.object({
    body: z.object({
        reason: z.string().optional()
    })
});

export const blockCustomerValidation = z.object({
    body: z.object({
        reason: z.string().optional()
    })
});

export const customersListValidation = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED', 'VERIFICATION_PENDING']).optional(),
        'filters[dateRange][start]': z.string().optional(),
        'filters[dateRange][end]': z.string().optional(),
        sortField: z.enum(['name', 'createdAt', 'totalOrders', 'totalSpent', 'avgOrderValue']).optional(),
        sortDirection: z.enum(['asc', 'desc']).optional()
    })
});

export const customerDetailsValidation = z.object({
    params: z.object({
        id: z.string().min(1, 'Customer ID is required')
    })
});

export const customerOrderHistoryValidation = z.object({
    params: z.object({
        id: z.string().min(1, 'Customer ID is required')
    }),
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional()
    })
});