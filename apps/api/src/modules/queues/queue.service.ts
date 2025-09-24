import { Queue, Worker, Job } from 'bullmq';
import { DeliveryJobData, ETAUpdateJobData, LocationUpdateJobData, OrderTimeoutJobData } from './../../types/queue.js';
import { env } from './../../config/env.js';
import { logger } from './../../utils/logger.js';

export class QueueService {
    private static instance: QueueService;
    private deliveryQueue: Queue<DeliveryJobData>;
    private locationQueue: Queue<LocationUpdateJobData>;
    private etaQueue: Queue<ETAUpdateJobData>;
    private timeoutQueue: Queue<OrderTimeoutJobData>;

    // Workers for processing jobs
    private deliveryWorker!: Worker<DeliveryJobData>;
    private locationWorker!: Worker<LocationUpdateJobData>;
    private etaWorker!: Worker<ETAUpdateJobData>;
    private timeoutWorker!: Worker<OrderTimeoutJobData>;

    private constructor() {
        // Use consistent Redis connection configuration
        const connection = {
            url: env.REDIS_URL || 'redis://localhost:6379'
        };

        // Initialize queues
        this.deliveryQueue = new Queue<DeliveryJobData>('delivery-jobs', { connection });
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
        this.deliveryWorker = new Worker<DeliveryJobData>(
            'delivery-jobs',
            async (job: Job<DeliveryJobData>) => {
                logger.info(`Processing delivery job for order ${job.data.orderId}`);

                // Import here to avoid circular dependencies
                const { DeliveryJobService } = await import('../delivery/deliveryJob.service.js');
                await DeliveryJobService.broadcastDeliveryJob(job.data);
            },
            { connection }
        );

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
        this.deliveryWorker.on('error', (error) => {
            logger.error({ error }, 'Delivery job worker error');
        });

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
    public async addDeliveryJob(data: DeliveryJobData, options?: any): Promise<Job<DeliveryJobData>> {
        return await this.deliveryQueue.add('broadcast-delivery', data, {
            delay: 0, // process immediately
            attempts: 3, // retry 3 times if failed
            backoff: {
                type: 'exponential', // exponential backoff: first retry after 1s, second after 2s, third after 4s, etc.
                delay: 2000 // 2 second delay between retries
            }, 
            ...options
        });
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
            this.deliveryWorker.close(),
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
}

// Export the instance
export const queueService = QueueService.getInstance();