import { prisma } from "../../../config/db.js";
import { CustomError } from "../../../middlewares/errorHandler.js";
import { ActionResponse } from "../../../types/admin/logistics.js";
import { CreateVendorRequest, UpdateVendorLocationRequest, UpdateVendorRequest, VendorDetails, VendorsListParams, VendorsListResponse } from "../../../types/admin/vendors.js";
import { PasswordService } from "../../../utils/password.js";
import { CloudinaryService } from "../../../services/cloudinary.service.js";
import { logger } from "../../../utils/logger.js";

class VendorsService {
    // Get list of vendors with pagination, filters, and sorting
    async getVendorsList(params: VendorsListParams): Promise<VendorsListResponse> {
        const { page, limit, filters, sort } = params;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (filters.search) {
            where.OR = [
                { businessName: { contains: filters.search, mode: 'insensitive' } },
                { user: { email: { contains: filters.search, mode: 'insensitive' } } },
                { user: { phone: { contains: filters.search, mode: 'insensitive' } } }
            ];
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.isOpen !== undefined) {
            where.isOpen = filters.isOpen;
        }

        // Get total count
        const total = await prisma.vendor.count({ where });

        // Get vendors
        const vendors = await prisma.vendor.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        name: true
                    }
                },
                menuItems: {
                    where: { isAvailable: true },
                    select: { id: true }
                }
            },
            orderBy: {
                [sort.field]: sort.direction
            },
            skip,
            take: limit
        });

        const data = vendors.map((vendor: any) => ({
            id: vendor.id,
            businessName: vendor.businessName,
            email: vendor?.user?.email,
            phone: vendor?.user?.phone || '',
            status: vendor.status as 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'BLOCKED',
            isOpen: vendor.isOpen,
            rating: vendor.rating,
            totalOrders: vendor.totalOrders,
            completedOrders: vendor.completedOrders,
            cancelledOrders: vendor.cancelledOrders,
            avgPrepTime: vendor.avgPrepTime,
            activeMenuCount: vendor.menuItems.length,
            logo: vendor.logo,
            location: {
                latitude: vendor.latitude,
                longitude: vendor.longitude,
                address: vendor.businessAddress
            },
            operationalHours: {
                openingTime: vendor.openingTime,
                closingTime: vendor.closingTime,
                operatingDays: vendor.operatingDays
            },
            createdAt: vendor.createdAt.toISOString(),
            updatedAt: vendor.updatedAt.toISOString()
        }));

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Get vendor details
    async getVendorDetails(vendorId: string): Promise<VendorDetails> {
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        name: true,
                        avatar: true,
                        isActive: true
                    }
                },
                menuItems: {
                    where: { isAvailable: true },
                    select: { id: true }
                }
            }
        });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        const completionRate = vendor.totalOrders > 0
            ? (vendor.completedOrders / vendor.totalOrders) * 100
            : 0;

        return {
            id: vendor.id,
            businessName: vendor.businessName,
            email: vendor?.user?.email,
            phone: vendor.user.phone || '',
            status: vendor.status as 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'BLOCKED',
            isOpen: vendor.isOpen,
            rating: vendor.rating,
            totalOrders: vendor.totalOrders,
            completedOrders: vendor.completedOrders,
            cancelledOrders: vendor.cancelledOrders,
            avgPrepTime: vendor.avgPrepTime,
            activeMenuCount: vendor.menuItems.length,
            logo: vendor.logo,
            description: vendor.description,
            coverImage: vendor.coverImage,
            location: {
                latitude: vendor.latitude,
                longitude: vendor.longitude,
                address: vendor.businessAddress
            },
            operationalHours: {
                openingTime: vendor.openingTime,
                closingTime: vendor.closingTime,
                operatingDays: vendor.operatingDays
            },
            user: {
                id: vendor.user.id,
                name: vendor.user.name,
                avatar: vendor.user.avatar,
                isActive: vendor.user.isActive
            },
            performance: {
                totalOrders: vendor.totalOrders,
                completedOrders: vendor.completedOrders,
                cancelledOrders: vendor.cancelledOrders,
                avgPrepTime: vendor.avgPrepTime,
                completionRate
            },
            createdAt: vendor.createdAt.toISOString(),
            updatedAt: vendor.updatedAt.toISOString()
        };
    }

    // Create vendor
    async createVendor(data: CreateVendorRequest, logoFile?: Express.Multer.File): Promise<ActionResponse> {
        // Check if email or phone already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phone: data.phone }
                ]
            }
        });

        if (existingUser) {
            throw new CustomError('Email or phone already exists', 400);
        }

        // Hash password
        const hashedPassword = await PasswordService.hashPassword(data.password);

        // Handle logo upload if present
        let logoUrl = data.logo;
        if (logoFile) {
            try {
                const uploadResult = await CloudinaryService.uploadVendorLogo(logoFile.buffer, `vendor-${Date.now()}`);
                logoUrl = uploadResult.secure_url;
                logger.info(`Vendor logo uploaded: ${uploadResult.public_id}`);
            } catch (uploadError) {
                logger.error({ uploadError }, 'Failed to upload vendor logo');
                throw new CustomError('Failed to upload logo. Please try again.', 400);
            }
        }

        // Create user and vendor
        await prisma.user.create({
            data: {
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                name: data.name,
                role: 'VENDOR',
                vendor: {
                    create: {
                        businessName: data.businessName,
                        businessAddress: data.businessAddress || null,
                        latitude: data.latitude !== undefined ? (typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude) : null,
                        longitude: data.longitude !== undefined ? (typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude) : null,
                        description: data.description || null,
                        logo: logoUrl || null,
                        openingTime: data.openingTime || null,
                        closingTime: data.closingTime || null,
                        operatingDays: data.operatingDays || [],
                        status: 'PENDING'
                    }
                }
            }
        });

        return {
            success: true,
            message: 'Vendor created successfully'
        };
    }

    // Update vendor
    async updateVendor(vendorId: string, data: UpdateVendorRequest, logoFile?: Express.Multer.File): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            include: { user: true }
        });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        // Check if email or phone is being changed and already exists
        if (data.email || data.phone) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    AND: [
                        { id: { not: vendor.userId } },
                        {
                            OR: [
                                ...(data.email ? [{ email: data.email }] : []),
                                ...(data.phone ? [{ phone: data.phone }] : [])
                            ]
                        }
                    ]
                }
            });

            if (existingUser) {
                throw new CustomError('Email or phone already exists', 400);
            }
        }

        // Handle logo upload if present
        let logoUrl = data.logo;
        if (logoFile) {
            try {
                // Delete existing images if they exist
                const imagesToDelete = [];
                if (vendor.logo) imagesToDelete.push(vendor.logo);
                if (vendor.coverImage) imagesToDelete.push(vendor.coverImage);

                // Delete all existing images
                for (const imageUrl of imagesToDelete) {
                    try {
                        await CloudinaryService.deleteImage(imageUrl);
                        logger.info(`Deleted existing image: ${imageUrl}`);
                    } catch (deleteError) {
                        logger.warn({ deleteError, imageUrl }, 'Failed to delete existing image, continuing');
                    }
                }

                const uploadResult = await CloudinaryService.uploadVendorLogo(logoFile.buffer, vendorId);
                logoUrl = uploadResult.secure_url;
                logger.info(`Vendor logo uploaded: ${uploadResult.public_id}`);
            } catch (uploadError) {
                logger.error({ uploadError }, 'Failed to upload vendor logo');
                throw new CustomError('Failed to upload logo. Please try again.', 400);
            }
        }

        // Update user data
        if (data.name || data.email || data.phone) {
            await prisma.user.update({
                where: { id: vendor.userId },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.email && { email: data.email }),
                    ...(data.phone && { phone: data.phone })
                }
            });
        }

        // Update vendor data - Convert strings to numbers for latitude/longitude
        await prisma.vendor.update({
            where: { id: vendorId },
            data: {
                ...(data.businessName && { businessName: data.businessName }),
                ...(data.businessAddress !== undefined && { businessAddress: data.businessAddress }),
                ...(data.latitude !== undefined && { latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude }),
                ...(data.longitude !== undefined && { longitude: typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude }),
                ...(data.description !== undefined && { description: data.description }),
                ...(logoUrl !== undefined && { logo: logoUrl }),
                ...(data.openingTime !== undefined && { openingTime: data.openingTime }),
                ...(data.closingTime !== undefined && { closingTime: data.closingTime }),
                ...(data.operatingDays !== undefined && { operatingDays: data.operatingDays }),
                ...(data.status && { status: data.status })
            }
        });

        return {
            success: true,
            message: 'Vendor updated successfully'
        };
    }

    // Update vendor location
    async updateVendorLocation(vendorId: string, data: UpdateVendorLocationRequest): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        await prisma.vendor.update({
            where: { id: vendorId },
            data: {
                latitude: data.latitude,
                longitude: data.longitude,
                ...(data.businessAddress && { businessAddress: data.businessAddress })
            }
        });

        return {
            success: true,
            message: 'Vendor location updated successfully'
        };
    }

    // Approve vendor
    async approveVendor(vendorId: string): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        if (vendor.status === 'APPROVED') {
            throw new CustomError('Vendor is already approved', 400);
        }

        await prisma.vendor.update({
            where: { id: vendorId },
            data: { status: 'APPROVED', isActive: true }
        });

        return {
            success: true,
            message: 'Vendor approved successfully'
        };
    }

    // Suspend vendor
    async suspendVendor(vendorId: string, reason?: string): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        if (vendor.status === 'SUSPENDED') {
            throw new CustomError('Vendor is already suspended', 400);
        }

        await prisma.vendor.update({
            where: { id: vendorId },
            data: { 
                status: 'SUSPENDED', 
                isActive: false,
                isOpen: false
            }
        });

        return {
            success: true,
            message: `Vendor suspended successfully${reason ? `: ${reason}` : ''}`
        };
    }

    // Reject vendor
    async rejectVendor(vendorId: string, reason?: string): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        if (vendor.status === 'REJECTED') {
            throw new CustomError('Vendor is already rejected', 400);
        }

        await prisma.vendor.update({
            where: { id: vendorId },
            data: { 
                status: 'REJECTED',
                isActive: false,
                isOpen: false
            }
        });

        return {
            success: true,
            message: `Vendor rejected successfully${reason ? `: ${reason}` : ''}`
        };
    }

     // Block vendor
     async blockVendor(vendorId: string, reason?: string): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        if (vendor.status === 'BLOCKED') {
            throw new CustomError('Vendor is already blocked', 400);
        }

        await prisma.vendor.update({
            where: { id: vendorId },
            data: { 
                status: 'BLOCKED',
                isActive: false,
                isOpen: false
            }
        });

        // Also deactivate user account
        await prisma.user.update({
            where: { id: vendor.userId },
            data: { isActive: false }
        });

        return {
            success: true,
            message: `Vendor blocked successfully${reason ? `: ${reason}` : ''}`
        };
    }

    // Activate vendor (from suspended/rejected)
    async activateVendor(vendorId: string): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        if (vendor.status === 'BLOCKED') {
            throw new CustomError('Cannot activate a blocked vendor. Please unblock first.', 400);
        }

        await prisma.vendor.update({
            where: { id: vendorId },
            data: { 
                status: 'APPROVED',
                isActive: true
            }
        });

        // Also activate user account
        await prisma.user.update({
            where: { id: vendor.userId },
            data: { isActive: true }
        });

        return {
            success: true,
            message: 'Vendor activated successfully'
        };
    }

    // Check and update vendor open/closed status based on operational hours
    async updateVendorOpenStatus(vendorId: string): Promise<ActionResponse> {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        if (!vendor.openingTime || !vendor.closingTime || vendor.operatingDays.length === 0) {
            throw new CustomError('Vendor operational hours not set', 400);
        }

        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const isOperatingDay = vendor.operatingDays.includes(currentDay);
        const isWithinHours = currentTime >= vendor.openingTime && currentTime <= vendor.closingTime;
        const shouldBeOpen = isOperatingDay && isWithinHours && vendor.status === 'APPROVED';

        // Only update if different
        if (vendor.isOpen !== shouldBeOpen) {
            await prisma.vendor.update({
                where: { id: vendorId },
                data: { isOpen: shouldBeOpen }
            });

            return {
                success: true,
                message: `Vendor is now ${shouldBeOpen ? 'open' : 'closed'}`
            };
        }

        return {
            success: true,
            message: `Vendor status unchanged: ${vendor.isOpen ? 'open' : 'closed'}`
        };
    }
}

export const vendorsService = new VendorsService();