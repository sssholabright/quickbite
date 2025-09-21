import { z } from "zod";

// Validation schemas
export const createOrderSchema = z.object({
    vendorId: z.string().min(1, 'Vendor ID is required'),
    items: z.array(z.object({
        menuItemId: z.string().min(1, 'Menu item ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        specialInstructions: z.string().optional()
    })).min(1, 'At least one item is required'),
    deliveryAddress: z.object({
        label: z.string().min(1, 'Address label is required'),
        address: z.string().min(1, 'Address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        coordinates: z.object({
            lat: z.number().min(-90).max(90, 'Invalid latitude'),
            lng: z.number().min(-180).max(180, 'Invalid longitude')
        })
    }),
    specialInstructions: z.string().optional(),
});
    
export const updateOrderStatusSchema = z.object({
    status: z.enum([
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
    ], { message: 'Invalid order status' }),
    riderId: z.string().optional(),
    estimatedDeliveryTime: z.string().datetime().optional(),
    notes: z.string().optional()
});
    
export const orderFiltersSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
    vendorId: z.string().optional(),
    customerId: z.string().optional(),
    riderId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
});
    
export const cancelOrderSchema = z.object({
    reason: z.string().optional()
});