import { z } from 'zod';

const cuidString = z.string().cuid();

// Logistics companies validation
export const createLogisticsCompanyValidation = {
    body: z.object({
        name: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
        contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Contact person name too long'),
        phone: z.string().min(1, 'Phone number is required').regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
        email: z.string().email('Invalid email format'),
        address: z.string().max(500, 'Address too long').optional()
    })
};

export const updateLogisticsCompanyValidation = {
    body: z.object({
        name: z.string().min(1, 'Company name is required').max(100, 'Company name too long').optional(),
        contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Contact person name too long').optional(),
        phone: z.string().min(1, 'Phone number is required').regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
        email: z.string().email('Invalid email format').optional(),
        address: z.string().max(500, 'Address too long').optional(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']).optional()
    }),
    params: z.object({
        id: cuidString
    })
};

export const logisticsCompaniesListValidation = {
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        'filters[status]': z.string().optional(),
        'filters[search]': z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        sortField: z.enum(['name', 'status', 'createdAt']).optional(),
        'sort[field]': z.enum(['name', 'status', 'createdAt']).optional(),
        sortDirection: z.enum(['asc', 'desc']).optional(),
        'sort[direction]': z.enum(['asc', 'desc']).optional()
    })
};

export const logisticsCompanyDetailsValidation = {
    params: z.object({
        id: cuidString
    })
};

export const suspendCompanyValidation = {
    params: z.object({
        id: cuidString
    }),
    body: z.object({
        reason: z.string().max(500, 'Reason too long').optional()
    })
};

export const activateCompanyValidation = {
    params: z.object({
        id: cuidString
    })
};

export const blockCompanyValidation = {
    params: z.object({
        id: cuidString
    }),
    body: z.object({
        reason: z.string().max(500, 'Reason too long').optional()
    })
};