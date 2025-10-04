import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.js';
import { CustomError } from '../../middlewares/errorHandler.js';
import { VendorProfileData, VendorProfileResponse } from '../../types/vendor.js';
import { VendorOperatingHoursService } from '../../services/vendorOperatingHours.service.js';

export class VendorService {
    // Get vendor profile
    static async getVendorProfile(userId: string): Promise<VendorProfileResponse> {
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { userId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true
                        }
                    }
                }
            });

            if (!vendor) {
                throw new CustomError('Vendor not found', 404);
            }

            return {
                id: vendor.id,
                userId: vendor.userId,
                businessName: vendor.businessName,
                businessAddress: vendor.businessAddress || '',
                latitude: vendor.latitude || 0,
                longitude: vendor.longitude || 0,
                description: vendor.description || '',
                logo: vendor.logo || '',
                coverImage: vendor.coverImage || '',
                isActive: vendor.isActive,
                isOpen: vendor.isOpen,
                rating: vendor.rating,
                status: vendor.status || '',
                openingTime: vendor.openingTime || '',
                closingTime: vendor.closingTime || '',
                operatingDays: vendor.operatingDays || [],
                totalOrders: vendor.totalOrders || 0,
                completedOrders: vendor.completedOrders || 0,
                cancelledOrders: vendor.cancelledOrders || 0,
                avgPrepTime: vendor.avgPrepTime || 0,
                createdAt: vendor.createdAt.toISOString(),
                updatedAt: vendor.updatedAt.toISOString(),
                user: vendor.user as any
            };
        } catch (error: any) {
            logger.error({ error, userId }, 'Error fetching vendor profile');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to fetch vendor profile', 500);
        }
    }

    // Update vendor profile
    static async updateVendorProfile(userId: string, updateData: VendorProfileData): Promise<VendorProfileResponse> {
        try {
            // Check if vendor exists
            const existingVendor = await prisma.vendor.findUnique({
                where: { userId }
            });

            if (!existingVendor) {
                throw new CustomError('Vendor not found', 404);
            }

            // Prepare update data
            const updateFields: any = {};
            
            if (updateData.businessName !== undefined) {
                updateFields.businessName = updateData.businessName;
            }
            if (updateData.businessAddress !== undefined) {
                updateFields.businessAddress = updateData.businessAddress;
            }
            if (updateData.description !== undefined) {
                updateFields.description = updateData.description;
            }
            if (updateData.logo !== undefined) {
                updateFields.logo = updateData.logo;
            }
            if (updateData.latitude !== undefined) {
                updateFields.latitude = updateData.latitude;
            }
            if (updateData.longitude !== undefined) {
                updateFields.longitude = updateData.longitude;
            }
            if (updateData.isOpen !== undefined) {
                updateFields.isOpen = updateData.isOpen;
            }
            if (updateData.openingTime !== undefined) {
                updateFields.openingTime = updateData.openingTime;
            }
            if (updateData.closingTime !== undefined) {
                updateFields.closingTime = updateData.closingTime;
            }
            if (updateData.operatingDays !== undefined) {
                updateFields.operatingDays = updateData.operatingDays;
            }

            // Update vendor
            let updatedVendor = await prisma.vendor.update({
                where: { userId },
                data: updateFields,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true
                        }
                    }
                }
            });

            logger.info({ userId, updateData }, 'Vendor profile updated successfully');

            // After updating the vendor, recalculate isOpen status
            if (updateData.openingTime !== undefined || updateData.closingTime !== undefined || updateData.operatingDays !== undefined) {
                await VendorOperatingHoursService.updateVendorOpenStatus(updatedVendor.id);
                
                // Refetch the vendor to get updated isOpen status
                const refreshedVendor = await prisma.vendor.findUnique({
                    where: { id: updatedVendor.id },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                avatar: true
                            }
                        }
                    }
                });

                if (refreshedVendor) {
                    updatedVendor = refreshedVendor;
                }
            }

            return {
                id: updatedVendor.id,
                userId: updatedVendor.userId,
                businessName: updatedVendor.businessName,
                businessAddress: updatedVendor.businessAddress || '',
                latitude: updatedVendor.latitude || 0,
                longitude: updatedVendor.longitude || 0,
                description: updatedVendor.description || '',
                logo: updatedVendor.logo || '',
                coverImage: updatedVendor.coverImage || '',
                isActive: updatedVendor.isActive,
                isOpen: updatedVendor.isOpen,
                rating: updatedVendor.rating || 0,
                status: updatedVendor.status || '',
                openingTime: updatedVendor.openingTime || '',
                closingTime: updatedVendor.closingTime || '',
                operatingDays: updatedVendor.operatingDays || [],
                totalOrders: updatedVendor.totalOrders || 0,
                completedOrders: updatedVendor.completedOrders || 0,
                cancelledOrders: updatedVendor.cancelledOrders || 0,
                avgPrepTime: updatedVendor.avgPrepTime || 0,
                createdAt: updatedVendor.createdAt.toISOString(),
                updatedAt: updatedVendor.updatedAt.toISOString(),
                user: updatedVendor.user as any
            };
        } catch (error: any) {
            logger.error({ error, userId, updateData }, 'Error updating vendor profile');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update vendor profile', 500);
        }
    }

    // Update vendor settings (business hours, etc.)
    static async updateVendorSettings(userId: string, settings: {
        isOpen?: boolean;
        openingTime?: string;
        closingTime?: string;
        operatingDays?: string[];
    }): Promise<VendorProfileResponse> {
        try {
            const existingVendor = await prisma.vendor.findUnique({
                where: { userId }
            });

            if (!existingVendor) {
                throw new CustomError('Vendor not found', 404);
            }

            const updateFields: any = {};
            
            if (settings.isOpen !== undefined) {
                updateFields.isOpen = settings.isOpen;
            }
            if (settings.openingTime !== undefined) {
                updateFields.openingTime = settings.openingTime;
            }
            if (settings.closingTime !== undefined) {
                updateFields.closingTime = settings.closingTime;
            }
            if (settings.operatingDays !== undefined) {
                updateFields.operatingDays = settings.operatingDays;
            }

            const updatedVendor = await prisma.vendor.update({
                where: { userId },
                data: updateFields,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true
                        }
                    }
                }
            });

            logger.info({ userId, settings }, 'Vendor settings updated successfully');

            return {
                id: updatedVendor.id,
                userId: updatedVendor.userId,
                businessName: updatedVendor.businessName,
                businessAddress: updatedVendor.businessAddress || '',
                latitude: updatedVendor.latitude || 0,
                longitude: updatedVendor.longitude || 0,
                description: updatedVendor.description || '',
                logo: updatedVendor.logo || '',
                coverImage: updatedVendor.coverImage || '',
                isActive: updatedVendor.isActive,
                isOpen: updatedVendor.isOpen,
                rating: updatedVendor.rating || 0,
                status: updatedVendor.status || '',
                openingTime: updatedVendor.openingTime || '',
                closingTime: updatedVendor.closingTime || '',
                operatingDays: updatedVendor.operatingDays || [],
                totalOrders: updatedVendor.totalOrders || 0,
                completedOrders: updatedVendor.completedOrders || 0,
                cancelledOrders: updatedVendor.cancelledOrders || 0,
                avgPrepTime: updatedVendor.avgPrepTime || 0,
                createdAt: updatedVendor.createdAt.toISOString(),
                updatedAt: updatedVendor.updatedAt.toISOString(),
                user: updatedVendor.user as any
            };
        } catch (error: any) {
            logger.error({ error, userId, settings }, 'Error updating vendor settings');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update vendor settings', 500);
        }
    }

    // Get vendor statistics
    static async getVendorStats(userId: string) {
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { userId },
                select: {
                    id: true,
                    totalOrders: true,
                    completedOrders: true,
                    cancelledOrders: true,
                    rating: true,
                    avgPrepTime: true,
                    isOpen: true,
                    createdAt: true
                }
            });

            if (!vendor) {
                throw new CustomError('Vendor not found', 404);
            }

            // Calculate additional stats
            const completionRate = vendor.totalOrders > 0 
                ? (vendor.completedOrders / vendor.totalOrders) * 100 
                : 0;

            const cancellationRate = vendor.totalOrders > 0 
                ? (vendor.cancelledOrders / vendor.totalOrders) * 100 
                : 0;

            return {
                totalOrders: vendor.totalOrders,
                completedOrders: vendor.completedOrders,
                cancelledOrders: vendor.cancelledOrders,
                completionRate: Math.round(completionRate * 100) / 100,
                cancellationRate: Math.round(cancellationRate * 100) / 100,
                rating: vendor.rating,
                avgPrepTime: vendor.avgPrepTime,
                isOpen: vendor.isOpen,
                daysActive: Math.floor((Date.now() - new Date(vendor.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            };
        } catch (error: any) {
            logger.error({ error, userId }, 'Error fetching vendor stats');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to fetch vendor statistics', 500);
        }
    }
}