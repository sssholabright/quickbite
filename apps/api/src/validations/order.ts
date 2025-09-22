import { z } from 'zod';

export const createOrderSchema = z.object({
    vendorId: z.string().min(1, 'Vendor ID is required'),
    items: z.array(z.object({
        menuItemId: z.string().min(1, 'Menu item ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        specialInstructions: z.string().optional(),
        addOns: z.array(z.object({
            addOnId: z.string().min(1, 'Add-on ID is required'),
            quantity: z.number().int().min(1, 'Add-on quantity must be at least 1')
        })).optional().default([])
    })).min(1, 'At least one item is required'),
    deliveryAddress: z.object({
        label: z.string().min(1, 'Address label is required'),
        address: z.string().min(1, 'Address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number()
        })
    }),
    specialInstructions: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
    riderId: z.string().optional(),
    estimatedDeliveryTime: z.date().optional(),
    notes: z.string().optional()
});

export const cancelOrderSchema = z.object({
    reason: z.string().optional()
});
