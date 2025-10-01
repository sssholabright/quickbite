import { Queue, Worker, Job } from 'bullmq';
import { DeliveryJobData, ETAUpdateJobData, LocationUpdateJobData, OrderTimeoutJobData } from './../../types/queue.js';
import { env } from './../../config/env.js';
import { logger } from './../../utils/logger.js';
import { CustomError } from '../../middlewares/errorHandler.js';

export class QueueService {
    private static instance: QueueService;
    private deliveryQueue: Queue<DeliveryJobData>;
    private locationQueue: Queue<LocationUpdateJobData>;
    private etaQueue: Queue<ETAUpdateJobData>;
    private timeoutQueue: Queue<OrderTimeoutJobData>;

    // Workers for processing jobs
    // private deliveryWorker!: Worker<DeliveryJobData>;
    private locationWorker!: Worker<LocationUpdateJobData>;
    private etaWorker!: Worker<ETAUpdateJobData>;
    private timeoutWorker!: Worker<OrderTimeoutJobData>;

    private constructor() {
        // Use consistent Redis connection configuration
        const connection = {
            url: env.REDIS_URL || 'redis://localhost:6379'
        };

        // Initialize queues
        this.deliveryQueue = new Queue<DeliveryJobData>('delivery-jobs', {
            connection,
            defaultJobOptions: {
                removeOnComplete: 10,
                removeOnFail: 5,
                attempts: 1, // Only try once
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            }
        });
        this.locationQueue = new Queue<LocationUpdateJobData>('location-updates', { connection });
        this.etaQueue = new Queue<ETAUpdateJobData>('eta-updates', { connection });
        this.timeoutQueue = new Queue<OrderTimeoutJobData>('timeout-jobs', { connection });

        // Initialize workers
        this.initializeWorkers();
    }

    public static getInstance(): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }

    private initializeWorkers(): void {
        // Use consistent connection for all workers
        const connection = {
            url: env.REDIS_URL || 'redis://localhost:6379'
        };

        // Delivery job worker - broadcasts delivery jobs to riders
        // this.deliveryWorker = new Worker<DeliveryJobData>(
        //     'delivery-jobs',
        //     async (job: Job<DeliveryJobData>) => {
        //         console.log(`🔄 WORKER: Processing delivery job for order ${job.data.orderId} (attempt ${job.attemptsMade + 1})`);

        //         try {
        //             // Import here to avoid circular dependencies
        //             const { DeliveryJobService } = await import('../delivery/deliveryJob.service.js');
                    
        //             // Try to get the socket manager, but don't fail if it's not available
        //             let socketManager = null;
        //             try {
        //                 const { getSocketManager } = await import('../../config/socket.js');
        //                 socketManager = getSocketManager();
        //                 console.log(`🔌 WORKER: Socket manager obtained successfully`);
        //             } catch (error) {
        //                 console.error(`❌ WORKER: Socket manager not available: ${error}`);
        //                 logger.warn('Socket manager not available in worker context, skipping WebSocket broadcast');
        //             }
                    
        //             // Pass the socket manager to the delivery service (can be null)
        //             await DeliveryJobService.broadcastDeliveryJob(job.data, socketManager);
                    
        //             console.log(`✅ WORKER: Successfully processed delivery job for order ${job.data.orderId}`);
        //             logger.info(`✅ Successfully processed delivery job for order ${job.data.orderId}`);
                    
        //         } catch (error) {
        //             console.error(`❌ WORKER: Error processing delivery job: ${error}`);
        //             logger.error({ error, orderId: job.data.orderId, attempt: job.attemptsMade + 1 }, 'Error processing delivery job');
        //             throw error;
        //         }
        //     },
        //     { 
        //         connection,
        //         concurrency: 1, // Process only one job at a time
        //         removeOnComplete: { count: 5 }, // Keep only 5 completed jobs
        //         removeOnFail: { count: 3 } // Keep only 3 failed jobs
        //     }
        // );

        // Location update worker - processes rider location updates
        this.locationWorker = new Worker<LocationUpdateJobData>(
            'location-updates',
            async (job: Job<LocationUpdateJobData>) => {
                logger.info(`Processing location update for rider ${job.data.riderId}`);

                // Import here to avoid circular dependencies
                const { LocationService } = await import('../location/location.service.js');
                await LocationService.processLocationUpdate(job.data);
            },
            { connection }
        );

        // ETA update worker - calculates and broadcasts ETA updates
        this.etaWorker = new Worker<ETAUpdateJobData>(
            'eta-updates',
            async (job: Job<ETAUpdateJobData>) => {
                logger.info(`Processing ETA update for order ${job.data.orderId}`);

                // Import here to avoid circular dependencies
                const { ETAService } = await import('../eta/eta.service.js');
                await ETAService.processETAUpdate(job.data);
            },
            { connection }
        );

        // Timeout worker - handles order timeouts
        this.timeoutWorker = new Worker<OrderTimeoutJobData>(
            'order-timeouts',
            async (job: Job<OrderTimeoutJobData>) => {
                logger.info(`Processing order timeout for order ${job.data.orderId}`);

                // Import here to avoid circular dependencies
                const { TimeoutService } = await import('../timeout/timeout.service.js');
                await TimeoutService.processOrderTimeout(job.data);
            },
            { connection }
        );

        // Add error handling for all workers
        // this.deliveryWorker.on('error', (error) => {
        //     logger.error({ error }, 'Delivery job worker error');
        // });

        this.locationWorker.on('error', (error) => {
            logger.error({ error }, 'Location update worker error');
        });
        
        this.etaWorker.on('error', (error) => {
            logger.error({ error }, 'ETA update worker error');
        });
        
        this.timeoutWorker.on('error', (error) => {
            logger.error({ error }, 'Order timeout worker error');
        });
    }

    // Queue management methods
    public async addDeliveryJob(jobData: DeliveryJobData): Promise<void> {
        try {
            console.log(`📋 Adding delivery job to queue: ${jobData.orderId}`);
            
            const job = await this.deliveryQueue.add('broadcast-delivery-job', jobData, {
                delay: 0, // Process immediately
                priority: 1, // High priority
            });
            
            console.log(`✅ Delivery job added to queue with ID: ${job.id}`);
            logger.info(`Delivery job added to queue for order ${jobData.orderId}`);
        } catch (error) {
            console.error(`❌ ERROR adding delivery job to queue: ${error}`);
            logger.error({ error, orderId: jobData.orderId }, 'Failed to add delivery job to queue');
            throw new CustomError('Failed to add delivery job to queue', 500);
        }
    }

    public async addLocationUpdate(data: LocationUpdateJobData): Promise<Job<LocationUpdateJobData>> {
        return await this.locationQueue.add('process-location', data, {
            delay: 0, // process immediately
            attempts: 2, // retry 2 times if failed
            removeOnComplete: 10, // Keep only last 10 completed jobs
            removeOnFail: 5, // Keep only last 5 failed jobs
        });
    }

    public async addETAUpdate(data: ETAUpdateJobData): Promise<Job<ETAUpdateJobData>> {
        return await this.etaQueue.add('calculate-eta', data, {
            delay: 0, // process immediately
            attempts: 2, // retry 2 times if failed
            removeOnComplete: 10, // Keep only last 10 completed jobs
            removeOnFail: 5, // Keep only last 5 failed jobs
        });
    }

    public async addOrderTimeout(data: OrderTimeoutJobData): Promise<Job<OrderTimeoutJobData>> {
        return await this.timeoutQueue.add('process-timeout', data, {
            delay: data.timeoutMinutes * 60 * 1000, // Delay by the timeout in minutes
            attempts: 1, // Don't retry, just process once
            removeOnComplete: 5, // Keep only last 5 completed jobs
            removeOnFail: 5, // Keep only last 5 failed jobs
        });
    }

    // Queue status methods
    public async getQueueStats() {
        return {
            delivery: {
                waiting: await this.deliveryQueue.getWaiting(),
                active: await this.deliveryQueue.getActive(),
                completed: await this.deliveryQueue.getCompleted(),
                failed: await this.deliveryQueue.getFailed(),
            },
            location: {
                waiting: await this.locationQueue.getWaiting(),
                active: await this.locationQueue.getActive(),
                completed: await this.locationQueue.getCompleted(),
                failed: await this.locationQueue.getFailed(),
            },
            eta: {
                waiting: await this.etaQueue.getWaiting(),
                active: await this.etaQueue.getActive(),
                completed: await this.etaQueue.getCompleted(),
                failed: await this.etaQueue.getFailed(),
            },
            timeout: {
                waiting: await this.timeoutQueue.getWaiting(),
                active: await this.timeoutQueue.getActive(),
                completed: await this.timeoutQueue.getCompleted(),
                failed: await this.timeoutQueue.getFailed(),
            }
        };
    }

    // Clean up methods
    public async close(): Promise<void> {
        await Promise.all([
            // this.deliveryWorker.close(),
            this.locationWorker.close(),
            this.etaWorker.close(),
            this.timeoutWorker.close(),
            this.deliveryQueue.close(),
            this.locationQueue.close(),
            this.etaQueue.close(),
            this.timeoutQueue.close(),
        ]);
        logger.info('All queues and workers closed');
    }

    async cancelOrderTimeout(orderId: string): Promise<void> {
        try {
            // Cancel any pending timeout jobs for this order
            const jobs = await this.timeoutQueue.getJobs(['delayed', 'waiting']);
            for (const job of jobs) {
                if (job.data.orderId === orderId) {
                    await job.remove();
                    logger.info(`Cancelled timeout job for order ${orderId}`);
                }
            }
        } catch (error) {
            logger.error({ error, orderId }, 'Error cancelling order timeout');
            throw error;
        }
    }
}

// Export the instance
export const queueService = QueueService.getInstance();