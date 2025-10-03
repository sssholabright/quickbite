import { z } from 'zod';

export const createPayoutValidation = z.object({
    body: z.object({
        recipientType: z.enum(['VENDOR', 'RIDER']),
        recipientId: z.string().min(1, 'Recipient ID is required'),
        amount: z.number().positive('Amount must be positive'),
        description: z.string().optional(),
        notes: z.string().optional()
    })
});

export const updatePayoutValidation = z.object({
    body: z.object({
        status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']).optional(),
        notes: z.string().optional(),
        approvedBy: z.string().optional()
    })
});

export const payoutsListValidation = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']).optional(),
        recipientType: z.enum(['VENDOR', 'RIDER']).optional(),
        'filters[dateRange][start]': z.string().optional(),
        'filters[dateRange][end]': z.string().optional(),
        'filters[amountRange][min]': z.string().optional(),
        'filters[amountRange][max]': z.string().optional(),
        sortField: z.enum(['amount', 'status', 'createdAt', 'completedAt', 'recipientName']).optional(),
        sortDirection: z.enum(['asc', 'desc']).optional()
    })
});

export const walletsListValidation = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        recipientType: z.enum(['VENDOR', 'RIDER']).optional(),
        search: z.string().optional(),
        'filters[hasBalance]': z.string().optional(),
        'filters[canPayout]': z.string().optional(),
        'filters[isActive]': z.string().optional(),
        sortField: z.enum(['currentBalance', 'pendingBalance', 'totalEarnings', 'lastPayoutDate', 'recipientName']).optional(),
        sortDirection: z.enum(['asc', 'desc']).optional()
    })
});

export const payoutDetailsValidation = z.object({
    params: z.object({
        id: z.string().min(1, 'Payout ID is required')
    })
});

