import { z } from "zod";

// Menu Add-on validation schema
export const menuAddOnSchema = z.object({
    name: z.string().min(1, 'Add-on name is required'),
    description: z.string().nullable().optional().transform(val => val || undefined), // 🚀 FIX: Handle null values
    price: z.number().min(0, 'Price must be non-negative'),
    isRequired: z.boolean().default(false),
    maxQuantity: z.number().int().min(1).max(10).default(1),
    category: z.enum(['EXTRA', 'SIZE', 'SIDE', 'CUSTOMIZATION'], {
        message: 'Category must be EXTRA, SIZE, SIDE, or CUSTOMIZATION'
    })
});

// Menu Item validation schema for FormData
export const createMenuItemSchema = z.object({
    name: z.string().min(1, 'Menu item name is required'),
    description: z.string().nullable().optional().transform(val => val || undefined), // 🚀 FIX: Handle null values
    price: z.coerce.number().min(0, 'Price must be non-negative'),
    image: z.string().optional(),
    categoryId: z.string().min(1, 'Category ID is required'),
    preparationTime: z.coerce.number().int().min(1).max(120).default(15),
    addOns: z.string().optional().transform((val) => {
        if (!val) return [];
        try {
            return JSON.parse(val);
        } catch {
            return [];
        }
    }).pipe(z.array(menuAddOnSchema))
});

export const updateMenuItemSchema = z.object({
    name: z.string().min(1, 'Menu item name is required').optional(),
    description: z.string().nullable().optional().transform(val => val || undefined), // 🚀 FIX: Handle null values
    price: z.coerce.number().min(0, 'Price must be non-negative').optional(),
    image: z.string().optional(),
    categoryId: z.string().min(1, 'Category ID is required').optional(),
    isAvailable: z.coerce.boolean().optional(),
    preparationTime: z.coerce.number().int().min(1).max(120).optional(),
    addOns: z.string().optional().transform((val) => {
        if (!val) return undefined;
        try {
            return JSON.parse(val);
        } catch {
            return undefined;
        }
    }).pipe(z.array(menuAddOnSchema).optional())
});

// Category validation schema for FormData
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().nullable().optional().transform(val => val || undefined), // 🚀 FIX: Handle null values
    image: z.string().optional()
});

export const updateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required').optional(),
    description: z.string().nullable().optional().transform(val => val || undefined), // 🚀 FIX: Handle null values
    image: z.string().optional()
});