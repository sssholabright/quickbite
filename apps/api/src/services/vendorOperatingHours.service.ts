import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

export class VendorOperatingHoursService {
    // Check if a vendor should be open based on current time and operating hours
    static isVendorOpen(vendor: {
        openingTime?: string | null;
        closingTime?: string | null;
        operatingDays: string[];
    }): boolean {
        // If no operating hours set, vendor is closed
        if (!vendor.openingTime || !vendor.closingTime || vendor.operatingDays.length === 0) {
            return false;
        }

        // Get current time in vendor's timezone (assuming local timezone for now)
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

        // Check if today is an operating day
        if (!vendor.operatingDays.includes(currentDay)) {
            return false;
        }

        // Check if current time is within operating hours
        return currentTime >= vendor.openingTime && currentTime <= vendor.closingTime;
    }

    // Update all vendors' isOpen status based on their operating hours
    static async updateAllVendorsOpenStatus(): Promise<void> {
        try {
            const vendors = await prisma.vendor.findMany({
                where: {
                    isActive: true,
                    openingTime: { not: null },
                    closingTime: { not: null }
                },
                select: {
                    id: true,
                    openingTime: true,
                    closingTime: true,
                    operatingDays: true,
                    isOpen: true
                }
            });

            const updatePromises = vendors.map(async (vendor) => {
                const shouldBeOpen = this.isVendorOpen(vendor);
                
                // Only update if status needs to change
                if (vendor.isOpen !== shouldBeOpen) {
                    return prisma.vendor.update({
                        where: { id: vendor.id },
                        data: { isOpen: shouldBeOpen }
                    });
                }
                return null;
            });

            const results = await Promise.all(updatePromises);
            const updatedCount = results.filter(result => result !== null).length;

            if (updatedCount > 0) {
                logger.info(`Updated isOpen status for ${updatedCount} vendors`);
            }
        } catch (error) {
            logger.error({ error }, 'Failed to update vendor open status');
            throw error;
        }
    }

    // Update a specific vendor's isOpen status
    static async updateVendorOpenStatus(vendorId: string): Promise<boolean> {
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { id: vendorId },
                select: {
                    id: true,
                    openingTime: true,
                    closingTime: true,
                    operatingDays: true,
                    isOpen: true
                }
            });

            if (!vendor) {
                throw new Error('Vendor not found');
            }

            const shouldBeOpen = this.isVendorOpen(vendor);
            
            if (vendor.isOpen !== shouldBeOpen) {
                await prisma.vendor.update({
                    where: { id: vendorId },
                    data: { isOpen: shouldBeOpen }
                });
            }

            return shouldBeOpen;
        } catch (error) {
            logger.error({ error, vendorId }, 'Failed to update vendor open status');
            throw error;
        }
    }
}