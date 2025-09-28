import { UpdateMenuItemData, CategoryData } from './../../types/menu.js';
import { logger } from './../../utils/logger.js';
import { MenuItemData } from "../../types/menu.js";
import { PrismaClient } from "@prisma/client";
import { CloudinaryService } from './../../services/cloudinary.service.js';

const prisma = new PrismaClient();

class MenuService {
    // Create a new menu item
    static async createMenuItem(vendorId: string, data: MenuItemData) {
        try {
            // Verify vendor exists by userId
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found!');
            }

            // Verify category exists
            const category = await prisma.category.findUnique({
                where: { id: data.categoryId }
            });

            if (!category) {
                throw new Error('Category not found');
            }

            // Create menu item with add-ons
            const menuItem = await prisma.menuItem.create({
                data: {
                    vendorId: vendor.id, // Use the actual vendor.id
                    categoryId: data.categoryId,
                    name: data.name,
                    description: data.description || null,
                    price: data.price,
                    image: data.image || null,
                    preparationTime: data.preparationTime || 15,
                    addOns: {
                        create: data.addOns?.map(addOn => ({
                            name: addOn.name,
                            description: addOn.description || null,
                            price: addOn.price,
                            isRequired: addOn.isRequired || false,
                            maxQuantity: addOn.maxQuantity || 1,
                            category: addOn.category
                        })) || []
                    }
                },
                include: {
                    category: true,
                    addOns: true
                }
            });

            logger.info(`Menu item created: ${menuItem.id} for vendor: ${vendor.id}`);
            return menuItem;
        } catch (error) {
            logger.error({error}, 'Error creating menu item');
            throw error;
        }
    }

    // Get all menu items for a vendor
    static async getVendorMenuItems(vendorId: string, filters?: {
        categoryId?: string;
        isAvailable?: boolean;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        try {
            // First find the vendor by userId
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            const where: any = { vendorId: vendor.id }; // Use the actual vendor.id

            if (filters?.categoryId) {
                where.categoryId = filters.categoryId;
            }

            if (filters?.isAvailable !== undefined) {
                where.isAvailable = filters.isAvailable;
            }

            if (filters?.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;

            const [menuItems, total] = await Promise.all([
                prisma.menuItem.findMany({
                    where,
                    include: {
                        category: true,
                        addOns: true
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.menuItem.count({ where })
            ]);

            return {
                items: menuItems,
                total,
                page,
                limit
            };
        } catch (error) {
            logger.error({error}, 'Error fetching menu items');
            throw error;
        }
    }

    // Get single menu item
    static async getMenuItem(vendorId: string, menuItemId: string) {
        try {
            // First find the vendor by userId
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            const menuItem = await prisma.menuItem.findFirst({
                where: {
                    id: menuItemId,
                    vendorId: vendor.id // Use the actual vendor.id
                },
                include: {
                    category: true,
                    addOns: true
                }
            });

            if (!menuItem) {
                throw new Error('Menu item not found');
            }

            return menuItem;
        } catch (error) {
            logger.error({error}, 'Error fetching menu item');
            throw error;
        }
    }

    // Update menu item
    static async updateMenuItem(vendorId: string, menuItemId: string, data: UpdateMenuItemData) {
        try {
            // First find the vendor by userId
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            // Verify menu item belongs to vendor
            const existingItem = await prisma.menuItem.findFirst({
                where: {
                    id: menuItemId,
                    vendorId: vendor.id // Use the actual vendor.id
                }
            });

            if (!existingItem) {
                throw new Error('Menu item not found');
            }

            // If categoryId is being updated, verify category exists
            if (data.categoryId) {
                const category = await prisma.category.findUnique({
                    where: { id: data.categoryId }
                });

                if (!category) {
                    throw new Error('Category not found');
                }
            }

            // Update menu item
            const updateData: any = { ...data };
            delete updateData.addOns;

            const menuItem = await prisma.menuItem.update({
                where: { id: menuItemId },
                data: updateData,
                include: {
                    category: true,
                    addOns: true
                }
            });

            // Update add-ons if provided
            if (data.addOns) {
                // 🚀 FIX: Safer add-on update approach - only check active orders
                const existingAddOns = await prisma.menuAddOn.findMany({
                    where: { menuItemId }
                });

                // Check which add-ons are referenced by ACTIVE (non-delivered) orders only
                const referencedAddOns = await prisma.orderItemAddOn.findMany({
                    where: {
                        addOnId: {
                            in: existingAddOns.map(addOn => addOn.id)
                        },
                        orderItem: {
                            order: {
                                status: {
                                    not: 'DELIVERED' // Only check non-delivered orders
                                }
                            }
                        }
                    },
                    select: { addOnId: true }
                });

                const referencedAddOnIds = new Set(referencedAddOns.map(ref => ref.addOnId));

                // Delete only add-ons that are not referenced by active orders
                const addOnsToDelete = existingAddOns.filter(addOn => !referencedAddOnIds.has(addOn.id));
                if (addOnsToDelete.length > 0) {
                    await prisma.menuAddOn.deleteMany({
                        where: {
                            id: {
                                in: addOnsToDelete.map(addOn => addOn.id)
                            }
                        }
                    });
                }

                // Create new add-ons
                if (data.addOns.length > 0) {
                    await prisma.menuAddOn.createMany({
                        data: data.addOns.map(addOn => ({
                            menuItemId,
                            name: addOn.name,
                            description: addOn.description || null,
                            price: addOn.price,
                            isRequired: addOn.isRequired || false,
                            maxQuantity: addOn.maxQuantity || 1,
                            category: addOn.category
                        }))
                    });
                }
            }

            logger.info(`Menu item updated: ${menuItemId} for vendor: ${vendor.id}`);
            return menuItem;
        } catch (error) {
            logger.error({error}, 'Error updating menu item');
            throw error;
        }
    }

     // Delete menu item
     static async deleteMenuItem(vendorId: string, menuItemId: string) {
        try {
            // First find the vendor by userId
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            // Verify menu item belongs to vendor
            const existingItem = await prisma.menuItem.findFirst({
                where: {
                    id: menuItemId,
                    vendorId: vendor.id // Use the actual vendor.id
                }
            });

            if (!existingItem) {
                throw new Error('Menu item not found');
            }

            // 🚀 FIX: Check if menu item is referenced by non-delivered orders
            const activeOrders = await prisma.orderItem.findMany({
                where: {
                    menuItemId: menuItemId,
                    order: {
                        status: {
                            not: 'DELIVERED' // Only check non-delivered orders
                        }
                    }
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            status: true,
                            orderNumber: true
                        }
                    }
                }
            });

            if (activeOrders.length > 0) {
                const orderNumbers = activeOrders.map(item => item.order.orderNumber).join(', ');
                throw new Error(`Cannot delete menu item. It is referenced by active orders: ${orderNumbers}. Only items from delivered orders can be deleted.`);
            }

            // Delete associated image from Cloudinary if exists
            if (existingItem.image) {
                try {
                    const publicId = CloudinaryService.extractPublicId(existingItem.image);
                    if (publicId) {
                        await CloudinaryService.deleteImage(publicId);
                        logger.info(`Deleted image from Cloudinary: ${publicId}`);
                    }
                } catch (imageError) {
                    logger.warn({ imageError }, 'Failed to delete image from Cloudinary, continuing with menu item deletion');
                }
            }

            // Delete menu item (add-ons will be deleted due to cascade)
            await prisma.menuItem.delete({
                where: { id: menuItemId }
            });

            logger.info(`Menu item deleted: ${menuItemId} for vendor: ${vendor.id}`);
            return { success: true };
        } catch (error) {
            logger.error({error}, 'Error deleting menu item');
            throw error;
        }
    }

    // Toggle menu item availability
    static async toggleMenuItemAvailability(vendorId: string, menuItemId: string) {
        try {
            // First find the vendor by userId
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            const menuItem = await prisma.menuItem.findFirst({
                where: {
                    id: menuItemId,
                    vendorId: vendor.id // Use the actual vendor.id
                }
            });

            if (!menuItem) {
                throw new Error('Menu item not found');
            }

            const updatedItem = await prisma.menuItem.update({
                where: { id: menuItemId },
                data: { isAvailable: !menuItem.isAvailable },
                include: {
                    category: true,
                    addOns: true
                }
            });

            logger.info(`Menu item availability toggled: ${menuItemId} for vendor: ${vendor.id}`);
            return updatedItem;
        } catch (error) {
            logger.error({error}, 'Error toggling menu item availability');
            throw error;
        }
    }

     // Category management
     static async createCategory(vendorId: string, data: CategoryData) {
        try {
            // Verify vendor exists by userId (not by vendor id)
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId } // Changed from { id: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            // Check if category name already exists
            const existingCategory = await prisma.category.findFirst({
                where: { name: data.name }
            });

            if (existingCategory) {
                throw new Error('Category name already exists');
            }

            const category = await prisma.category.create({
                data: {
                    name: data.name,
                    description: data.description || null,
                    image: data.image || null,
                    vendors: {
                        connect: { id: vendor.id } // Use the actual vendor.id here
                    }
                }
            });

            logger.info(`Category created: ${category.id} for vendor: ${vendor.id}`);
            return category;
        } catch (error) {
            logger.error({error}, 'Error creating category');
            throw error;
        }
    }

    static async getVendorCategories(vendorId: string) {
        try {
            // First find the vendor by userId
            const vendor = await prisma.vendor.findUnique({
                where: { userId: vendorId }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            const categories = await prisma.category.findMany({
                where: {
                    vendors: {
                        some: { id: vendor.id } // Use the actual vendor.id here
                    },
                    isActive: true
                },
                orderBy: { name: 'asc' }
            });

            return categories; // Remove the error throwing for empty categories
        } catch (error) {
            logger.error({error}, 'Error fetching categories');
            throw error;
        }
    }

    static async updateCategory(categoryId: string, data: any) {
        try {
            // Convert undefined to null for Prisma
            const updateData = {
                ...data,
                description: data.description ?? null,
                image: data.image ?? null
            };

            const category = await prisma.category.update({
                where: { id: categoryId },
                data: updateData
            });

            logger.info(`Category updated: ${categoryId}`);
            return category;
        } catch (error) {
            logger.error({error}, 'Error updating category');
            throw error;
        }
    }

    static async deleteCategory(categoryId: string) {
        try {
            // Check if category has menu items
            const menuItemsCount = await prisma.menuItem.count({
                where: { categoryId }
            });

            if (menuItemsCount > 0) {
                throw new Error('Cannot delete category with existing menu items');
            }

            await prisma.category.delete({
                where: { id: categoryId }
            });

            logger.info(`Category deleted: ${categoryId}`);
            return { success: true };
        } catch (error) {
            logger.error({error}, 'Error deleting category');
            throw error;
        }
    }

    // Public (customer) - List active vendors (optionally onlt those with avaialble items)
    static async getCustomerVendors(filters?: {
        search?: string;
        hasAvailableItems?: boolean;
    }) {
        try {
            const where: any = { isActive: true };

            if (filters?.search) {
                where.OR = [
                    { businessName: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            if (filters?.hasAvailableItems !== undefined) {
                where.menuItems = { some: { isAvailable: true } };
            }

            const vendors = await prisma.vendor.findMany({
                where,
                select: {
                    id: true,
                    businessName: true,
                    description: true,
                    logo: true,
                    coverImage: true,
                    rating: true,
                    isOpen: true,
                    isActive: true,
                },
                orderBy: { businessName: 'asc' }
            });

            return vendors;
        } catch (error) {
            logger.error({error}, 'Error fetching vendors');
            throw error;
        }
    }

    // Public (customer) - get categories for a vendor that have at least one available menu item
    static async getCustomerCategories(vendorId: string) {
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { id: vendorId }
            })

            if (!vendor || !vendor.isActive) {
                throw new Error('Vendor not found');
            }

            // Categories linked to vendor and having at least one available item
            const categories = await prisma.category.findMany({
                where: {
                    isActive: true,
                    vendors: { some: { id: vendorId } },
                    menuItems: { some: { vendorId, isAvailable: true } }
                }, orderBy: { name: 'asc' }
            });
            
            return categories;
        } catch (error) {
            logger.error({error}, 'Error fetching categories');
            throw error;
        }
    }

    // Public (customer) - get all menu items for a vendor, with optional filters
    static async getCustomerMenuItems(vendorId: string, filters?: {
        categoryId?: string;
        search?: string;
    }) {
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { id: vendorId }
            })

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            const where: any = { vendorId, isAvailable: true };
            
            if (filters?.categoryId) {
                where.categoryId = filters.categoryId;
            }

            if (filters?.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            const items = await prisma.menuItem.findMany({
                where,
                include: {
                    category: true,
                    addOns: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return items;
        } catch (error) {
            logger.error({error}, 'Error fetching menu items');
            throw error;
        }
    }
}

export default MenuService;