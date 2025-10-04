import * as cron from 'node-cron';
import { VendorOperatingHoursService } from '../services/vendorOperatingHours.service.js';
import { logger } from '../utils/logger.js';

export class VendorStatusUpdaterJob {
    private static job: cron.ScheduledTask | null = null;

    // Start the cron job to update vendor status every 5 minutes
    static start(): void {
        if (this.job) {
            logger.warn('Vendor status updater job is already running');
            return;
        }

        // Run every 5 minutes
        this.job = cron.schedule('*/5 * * * *', async () => {
            try {
                logger.info('Running vendor status updater job...');
                await VendorOperatingHoursService.updateAllVendorsOpenStatus();
                logger.info('Vendor status updater job completed successfully');
            } catch (error) {
                logger.error({ error }, 'Vendor status updater job failed');
            }
        });

        this.job.start();
        logger.info('Vendor status updater job started (runs every 5 minutes)');
    }

    // Stop the cron job
    static stop(): void {
        if (this.job) {
            this.job.stop();
            this.job = null;
            logger.info('Vendor status updater job stopped');
        }
    }

    // Manually trigger the job
    static async runNow(): Promise<void> {
        try {
            logger.info('Manually running vendor status updater job...');
            await VendorOperatingHoursService.updateAllVendorsOpenStatus();
            logger.info('Manual vendor status updater job completed successfully');
        } catch (error) {
            logger.error({ error }, 'Manual vendor status updater job failed');
            throw error;
        }
    }
}