import { z } from "zod";

// Menu Add-on validation schema
export const menuAddOnSchema = z.object({
    name: z.string().min(1, 'Add-on name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    isRequired: z.boolean().default(false),
    maxQuantity: z.number().int().min(1).max(10).default(1),
    category: z.enum(['EXTRA', 'SIZE', 'SIDE', 'CUSTOMIZATION'], {
        message: 'Category must be EXTRA, SIZE, SIDE, or CUSTOMIZATION'
    })
});

// Menu Item validation schema
export const createMenuItemSchema = z.object({
    name: z.string().min(1, 'Menu item name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    image: z.string().url('Image must be a valid URL').optional(),
    categoryId: z.string().min(1, 'Category ID is required'),
    preparationTime: z.number().int().min(1).max(120).default(15),
    addOns: z.array(menuAddOnSchema).optional().default([])
});

export const updateMenuItemSchema = z.object({
    name: z.string().min(1, 'Menu item name is required').optional(),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    image: z.string().url('Image must be a valid URL').optional(),
    categoryId: z.string().min(1, 'Category ID is required').optional(),
    isAvailable: z.boolean().optional(),
    preparationTime: z.number().int().min(1).max(120).optional(),
    addOns: z.array(menuAddOnSchema).optional()
});

// Category validation schema
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    image: z.string().url('Image must be a valid URL').optional()
});

export const updateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required').optional(),
    description: z.string().optional(),
    image: z.string().url('Image must be a valid URL').optional()
});