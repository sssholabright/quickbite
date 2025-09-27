import { Queue, Worker, Job } from 'bullmq';
import { NotificationJobData } from '../types/queue.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getSocketManager } from '../config/socket.js';

export class NotificationQueueService {
    private static instance: NotificationQueueService;
    private notificationQueue: Queue<NotificationJobData>;
    private notificationWorker: Worker<NotificationJobData> | null = null;

    private constructor() {
        const connection = {
            url: env.REDIS_URL || 'redis://localhost:6379'
        };

        // Initialize notification queue
        this.notificationQueue = new Queue<NotificationJobData>('notifications', {
            connection,
            defaultJobOptions: {
                removeOnComplete: 50, // Keep last 50 completed notifications
                removeOnFail: 20,     // Keep last 20 failed notifications
                attempts: 3,          // Retry 3 times
                backoff: {
                    type: 'exponential',
                    delay: 2000,      // Start with 2 second delay
                },
            }
        });

        // Initialize worker
        this.initializeWorker();
    }

    public static getInstance(): NotificationQueueService {
        if (!NotificationQueueService.instance) {
            NotificationQueueService.instance = new NotificationQueueService();
        }
        return NotificationQueueService.instance;
    }

    private initializeWorker(): void {
        const connection = {
            url: env.REDIS_URL || 'redis://localhost:6379'
        };

        this.notificationWorker = new Worker<NotificationJobData>(
            'notifications',
            async (job: Job<NotificationJobData>) => {
                console.log(`🔔 Processing notification: ${job.data.title} (attempt ${job.attemptsMade + 1})`);
                
                try {
                    await this.deliverNotification(job.data);
                    console.log(`✅ Notification delivered: ${job.data.title}`);
                    logger.info(`Notification delivered: ${job.data.title}`);
                } catch (error) {
                    console.error(`❌ Failed to deliver notification: ${error}`);
                    logger.error({ error, notificationId: job.data.id }, 'Failed to deliver notification');
                    throw error;
                }
            },
            { 
                connection,
                concurrency: 5, // Process up to 5 notifications concurrently
                removeOnComplete: { count: 50 },
                removeOnFail: { count: 20 }
            }
        );

        this.notificationWorker.on('error', (error) => {
            logger.error({ error }, 'Notification worker error');
        });
    }

    
    private async deliverNotification(notification: NotificationJobData): Promise<void> {
        console.log(`🔔 Starting notification delivery for ${notification.targetType}:${notification.targetId}`);
        
        const socketManager = getSocketManager();
        
        // Check if target is online
        const isOnline = await this.isTargetOnline(notification.targetType, notification.targetId);
        console.log(`🔔 Target ${notification.targetType}:${notification.targetId} is online: ${isOnline}`);
        
        if (isOnline) {
            // 🚀 FIXED: Increase delay for critical notifications to ensure UI updates first
            if (notification.priority === 'urgent' || notification.type === 'order') {
                // Wait longer for order-related notifications to ensure UI state is updated first
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
            } else if (notification.priority === 'high') {
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
            }
            
            console.log(`🔔 Delivering notification via socket to ${notification.targetType}:${notification.targetId}`);
            await this.deliverViaSocket(socketManager, notification);
        } else {
            console.log(`🔔 Storing notification for later delivery to ${notification.targetType}:${notification.targetId}`);
            await this.storeForLaterDelivery(notification);
        }
    }

    private async isTargetOnline(targetType: string, targetId: string): Promise<boolean> {
        try {
            const socketManager = getSocketManager();
            const roomName = `${targetType}:${targetId}`;
            
            // Get the room from the socket.io adapter
            const room = socketManager.getIO().sockets.adapter.rooms.get(roomName);
            const isOnline = room && room.size > 0;
            
            console.log(`🔍 Checking if ${targetType}:${targetId} is online:`);
            console.log(`🔍 Room name: ${roomName}`);
            console.log(`🔍 Room exists: ${!!room}`);
            console.log(`🔍 Room size: ${room?.size || 0}`);
            console.log(`🔍 Is online: ${isOnline}`);
            
            return isOnline || false;
        } catch (error) {
            console.error(`❌ Error checking if target is online:`, error);
            return false;
        }
    }

    private async deliverViaSocket(socketManager: any, notification: NotificationJobData): Promise<void> {
        const { targetType, targetId } = notification;
        
        // Use the correct emit method based on target type
        switch (targetType) {
            case 'vendor':
                socketManager.emitToVendor(targetId, 'notification_received', {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data,
                    priority: notification.priority,
                    actions: notification.actions,
                    timestamp: notification.timestamp,
                    read: false
                });
                break;
            case 'customer':
                socketManager.emitToCustomer(targetId, 'notification_received', {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data,
                    priority: notification.priority,
                    actions: notification.actions,
                    timestamp: notification.timestamp,
                    read: false
                });
                break;
            case 'rider':
                socketManager.emitToRider(targetId, 'notification_received', {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data,
                    priority: notification.priority,
                    actions: notification.actions,
                    timestamp: notification.timestamp,
                    read: false
                });
                break;
            default:
                console.error(`Unknown target type: ${targetType}`);
        }
    }

    private async storeForLaterDelivery(notification: NotificationJobData): Promise<void> {
        // Store in Redis for later delivery when user comes online
        const redis = await import('../config/redis.js');
        const key = `pending_notifications:${notification.targetType}:${notification.targetId}`;
        
        await redis.redisService.lPush(key, JSON.stringify(notification));
        await redis.redisService.expire(key, 7 * 24 * 60 * 60); // Expire after 7 days
        
        console.log(`📝 Notification stored for later delivery: ${notification.title}`);
    }

    // Public methods
    public async addNotification(notification: NotificationJobData): Promise<void> {
        try {
            const job = await this.notificationQueue.add('deliver-notification', notification, {
                delay: 0, // Process immediately
                priority: this.getPriorityValue(notification.priority),
            });
            
            console.log(`📋 Notification queued: ${notification.title} (Job ID: ${job.id})`);
            logger.info(`Notification queued: ${notification.title}`);
        } catch (error) {
            console.error(`❌ Failed to queue notification: ${error}`);
            logger.error({ error, notificationId: notification.id }, 'Failed to queue notification');
            throw error;
        }
    }

    private getPriorityValue(priority: string): number {
        switch (priority) {
            case 'urgent': return 1;
            case 'high': return 2;
            case 'normal': return 3;
            case 'low': return 4;
            default: return 3;
        }
    }

    // Check for pending notifications when user comes online
    public async deliverPendingNotifications(targetType: string, targetId: string): Promise<void> {
        const redis = await import('../config/redis.js');
        const key = `pending_notifications:${targetType}:${targetId}`;
        
        try {
            const pendingNotifications = await redis.redisService.lRange(key, 0, -1);
            
            if (pendingNotifications.length > 0) {
                console.log(`📬 Delivering ${pendingNotifications.length} pending notifications to ${targetType}:${targetId}`);
                
                for (const notificationStr of pendingNotifications) {
                    const notification = JSON.parse(notificationStr);
                    await this.addNotification(notification);
                }
                
                // Clear pending notifications
                await redis.redisService.del(key);
            }
        } catch (error) {
            logger.error({ error, targetType, targetId }, 'Error delivering pending notifications');
        }
    }

    public async close(): Promise<void> {
        await this.notificationWorker?.close();
        await this.notificationQueue.close();
        logger.info('Notification queue service closed');
    }
}

export const notificationQueueService = NotificationQueueService.getInstance();