import { z } from 'zod';

export const processRefundValidation = z.object({
    body: z.object({
        amount: z.number().positive().optional(),
        reason: z.string().min(1, 'Refund reason is required')
    })
});

export const retryPaymentValidation = z.object({
    body: z.object({
        paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'WALLET', 'CASH']).optional(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().min(10).optional()
    })
});

export const paymentsListValidation = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
        gateway: z.enum(['PAYSTACK', 'FLUTTERWAVE', 'STRIPE', 'SQUARE']).optional(),
        paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'WALLET', 'CASH']).optional(),
        'filters[dateRange][start]': z.string().optional(),
        'filters[dateRange][end]': z.string().optional(),
        'filters[amountRange][min]': z.string().optional(),
        'filters[amountRange][max]': z.string().optional(),
        sortField: z.enum(['amount', 'status', 'createdAt', 'completedAt', 'customerEmail']).optional(),
        sortDirection: z.enum(['asc', 'desc']).optional()
    })
});

export const paymentDetailsValidation = z.object({
    params: z.object({
        id: z.string().min(1, 'Payment ID is required')
    })
});
