import { z } from 'zod';

const cuidString = z.string().cuid();

export const ordersListValidation = {
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.enum([
            'PENDING',
            'CONFIRMED',
            'PREPARING',
            'READY_FOR_PICKUP',
            'ASSIGNED',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'CANCELLED'
        ]).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        vendorId: cuidString.optional(),
        riderId: cuidString.optional(),
        customerId: cuidString.optional(),
        sortField: z.enum(['createdAt', 'updatedAt', 'total', 'status']).default('createdAt'),
        sortDirection: z.enum(['asc', 'desc']).default('desc')
    })
};

export const reassignRiderValidation = {
    body: z.object({
        newRiderId: cuidString,
        reason: z.string().max(500).optional()
    }),
    params: z.object({
        id: cuidString
    })
};

export const cancelOrderValidation = {
    body: z.object({
        reason: z.string().max(500),
        refundAmount: z.number().min(0).optional()
    }),
    params: z.object({
        id: cuidString
    })
};

export const refundOrderValidation = {
    body: z.object({
        amount: z.number().min(0),
        reason: z.string().max(500),
        refundType: z.enum(['FULL', 'PARTIAL']).default('PARTIAL')
    }),
    params: z.object({
        id: cuidString
    })
};
