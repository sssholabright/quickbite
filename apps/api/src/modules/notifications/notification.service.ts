import { notificationQueueService } from './../../services/notificationQueue.service.js';
import { getSocketManager } from './../../config/socket.js';
import { FCMService } from './../../services/fcm.service.js';
import { logger } from './../../utils/logger.js';
import { MobileNotification, WebNotification } from './../../types/notification.js';

/**
 * 🚀 NEW: Unified Notification Service
 * 
 * Clean separation of concerns:
 * - Mobile Apps: Socket Events + FCM Push Notifications
 * - Web Apps: Socket Events + Notification Queue
 * 
 * Single entry point for all notifications with platform-specific routing
 */

export class NotificationService {
    // Mobile notification to customer (Socket + FCM)
    static async notifyCustomer(customerId: string, notification: MobileNotification, options?: { delayFCM?: number }): Promise<void> {
        try {
            logger.info(`📱 Notifying customer ${customerId}: ${notification.type}`);

            // 1. Send socket event immediately (real-time)
            await this.sendSocketEvent('customer', customerId, notification);

            // 2. Send FCM push notification with delay (if configured)
            if (notification.pushNotification) {
                const delay = options?.delayFCM || 1000; // Default 1 second delay
                setTimeout(async () => {
                    try {
                        await FCMService.sendToCustomer(customerId, {
                            title: notification.pushNotification!.title,
                            body: notification.pushNotification!.body,
                            data: notification.pushNotification!.data || notification.data
                        }, {
                            orderId: notification.data?.orderId
                        });
                        logger.info(`📱 FCM sent to customer ${customerId}`);
                    } catch (error) {
                        logger.error({ error, customerId }, 'Failed to send FCM to customer');
                    }
                }, delay);
            }

            logger.info(`✅ Customer ${customerId} notification sent successfully`);
        } catch (error) {
            logger.error({ error, customerId, notification }, 'Failed to notify customer');
            throw error;
        } 
    }

    // 🚀 MOBILE: Send notification to rider (Socket + FCM)
    static async notifyRider(riderId: string, notification: MobileNotification, options?: { delayFCM?: number }): Promise<void> {
        try {
            logger.info(`📱 Notifying rider ${riderId}: ${notification.type}`);

            // 1. Send socket event immediately (real-time)
            await this.sendSocketEvent('rider', riderId, notification);

            // 2. Send FCM push notification with delay (if configured)
            if (notification.pushNotification) {
                const delay = options?.delayFCM || 1000; // Default 1 second delay
                setTimeout(async () => {
                    try {
                        await FCMService.sendToRider(riderId, {  // ✅ CORRECT: Use sendToRider directly
                            title: notification.pushNotification!.title,
                            body: notification.pushNotification!.body,
                            data: notification.pushNotification!.data || notification.data
                        }, {
                            orderId: notification.data?.orderId
                        });
                        logger.info(`📱 FCM sent to rider ${riderId}`);
                    } catch (error) {
                        logger.error({ error, riderId }, 'Failed to send FCM to rider');
                    }
                }, delay);
            }

            logger.info(`✅ Rider ${riderId} notification sent successfully`);
        } catch (error) {
            logger.error({ error, riderId, notification }, 'Failed to notify rider');
            throw error;
        }
    }

    // 🚀 WEB: Send notification to vendor (Socket + Queue)
    static async notifyVendor(vendorId: string, notification: WebNotification): Promise<void> {
        try {
            logger.info(`🌐 Notifying vendor ${vendorId}: ${notification.type}`);

            // 1. Send socket event immediately (real-time)
            await this.sendSocketEvent('vendor', vendorId, notification);

            // 2. Queue notification for persistence (if offline)
            await this.queueWebNotification('vendor', vendorId, notification);

            logger.info(`✅ Vendor ${vendorId} notification sent successfully`);
        } catch (error) {
            logger.error({ error, vendorId, notification }, 'Failed to notify vendor');
            throw error;
        }
    }

    // 🚀 WEB: Send notification to admin (Socket + Queue)
    static async notifyAdmin(adminId: string, notification: WebNotification): Promise<void> {
        try {
            logger.info(`🌐 Notifying admin ${adminId}: ${notification.type}`);

            // 1. Send socket event immediately (real-time)
            await this.sendSocketEvent('admin', adminId, notification);

            // 2. Queue notification for persistence (if offline)
            await this.queueWebNotification('admin', adminId, notification);

            logger.info(`✅ Admin ${adminId} notification sent successfully`);
        } catch (error) {
            logger.error({ error, adminId, notification }, 'Failed to notify admin');
            throw error;
        }
    }

    // 🚀 HELPER: Send socket event (unified for all platforms)
    private static async sendSocketEvent(target: 'customer' | 'rider' | 'vendor' | 'admin', targetId: string, notification: MobileNotification | WebNotification): Promise<void> {
        try {
            const socketManager = getSocketManager();
            
            // Determine event name based on notification type
            const eventName = this.getEventName(notification.type);
            
            // Send via appropriate socket method
            switch (target) {
                case 'customer':
                    socketManager.emitToCustomer(targetId, eventName, notification.data);
                    break;
                case 'rider':
                    socketManager.emitToRider(targetId, eventName, notification.data);
                    break;
                case 'vendor':
                    socketManager.emitToVendor(targetId, eventName, notification.data);
                    break;
                case 'admin':
                    socketManager.emitToVendor(targetId, eventName, notification.data); // Admin uses vendor socket
                    break;
            }

            logger.info(`📡 Socket event ${eventName} sent to ${target}:${targetId}`);
        } catch (error) {
            logger.error({ error, target, targetId }, 'Failed to send socket event');
        }
    }

    // 🚀 HELPER: Queue web notification for persistence
    private static async queueWebNotification(target: 'vendor' | 'admin', targetId: string, notification: WebNotification): Promise<void> {
        try {
            await notificationQueueService.addNotification({
                id: `${notification.type}-${targetId}-${Date.now()}`,
                type: notification.type as 'order' | 'delivery' | 'payment' | 'system',
                title: notification.title,
                message: notification.message,
                data: notification.data,
                priority: notification.priority,
                actions: notification.actions || [],
                timestamp: new Date().toISOString(),
                targetType: target,
                targetId
            });
            logger.info(`📋 Web notification queued for ${target}:${targetId}`);
        } catch (error) {
            logger.error({ error, target, targetId }, 'Failed to queue web notification');
        }
    }

    // 🚀 HELPER: Get event name based on notification type
    private static getEventName(notificationType: string): string {
        const eventMap: Record<string, string> = {
            // Mobile events
            'delivery_job': 'delivery_job',
            'order_status_update': 'order_status_update',
            'rider_assigned': 'rider_assigned',
            'order_delivered': 'order_delivered',
            'eta_update': 'eta_update',
            
            // Web events
            'new_order': 'new_order',
            'system_alert': 'system_alert',
            'delivery_update': 'delivery_update'
        };
        return eventMap[notificationType] || 'notification_received';
    }

    // 🚀 CONVENIENCE: Order-specific notifications
    static async notifyOrderStatusUpdate(orderId: string, status: string, customerId?: string, riderId?: string, vendorId?: string, additionalData?: any): Promise<void> {
        const promises: Promise<void>[] = [];

        // Notify customer (mobile)
        if (customerId) {
            promises.push(this.notifyCustomer(customerId, {
                type: 'order_status_update',
                data: {
                    orderId,
                    status,
                    ...additionalData
                },
                pushNotification: {
                    title: this.getStatusTitle(status),
                    body: this.getStatusMessage(status, additionalData),
                    data: {
                        orderId,
                        status,
                        type: 'order_status_update'
                    }
                }
            }));
        }

        // Notify rider (mobile)
        if (riderId) {
            promises.push(this.notifyRider(riderId, {
                type: 'order_status_update',
                data: {
                    orderId,
                    status,
                    ...additionalData
                },
                pushNotification: {
                    title: this.getStatusTitle(status),
                    body: this.getStatusMessage(status, additionalData),
                    data: {
                        orderId,
                        status,
                        type: 'order_status_update'
                    }
                }
            }));
        }

        // Notify vendor (web)
        if (vendorId) {
            promises.push(
                this.notifyVendor(vendorId, {
                    type: 'order_status_update',
                    title: this.getStatusTitle(status),
                    message: this.getStatusMessage(status, additionalData),
                    data: { orderId, status, ...additionalData },
                    priority: this.getStatusPriority(status)
                })
            );
        }

        await Promise.allSettled(promises);
    }

    // 🚀 CONVENIENCE: Delivery job notification
    static async notifyDeliveryJob(riderIds: string[], orderData: any): Promise<void> {
        const promises = riderIds.map(riderId => 
            this.notifyRider(riderId, {
                type: 'delivery_job',
                data: orderData,
                pushNotification: {
                    title: '🚚 New Delivery Job!',
                    body: `Order from ${orderData.vendorName} - ₦${orderData.deliveryFee} delivery fee`,
                    data: {
                        orderId: orderData.orderId,
                        type: 'delivery_job'
                    }
                }
            })
        )

        // Notify riders (mobile)
        await Promise.allSettled(promises);
    }

    // 🚀 HELPER: Get status-specific titles and messages
    private static getStatusTitle(status: string): string {
        const titles: Record<string, string> = {
            'CONFIRMED': 'Order Confirmed ✅',
            'PREPARING': 'Preparing Your Food 👨‍🍳',
            'READY_FOR_PICKUP': 'Ready for Pickup 🍱',
            'ASSIGNED': 'Rider Assigned ✅',
            'PICKED_UP': 'Picked Up ✅',
            'OUT_FOR_DELIVERY': 'Out for Delivery 🚚',
            'DELIVERED': 'Order Delivered 📦',
            'CANCELLED': 'Order Cancelled ❌'
        };
        return titles[status] || 'Order Status Updated';
    }

    private static getStatusMessage(status: string, data?: any): string {
        const messages: Record<string, string> = {
            'CONFIRMED': 'Your order has been confirmed by the restaurant.',
            'PREPARING': 'The restaurant is preparing your food.',
            'READY_FOR_PICKUP': 'Your food is ready for pickup.',
            'ASSIGNED': 'A rider has been assigned to your order.',
            'PICKED_UP': 'Your rider has picked up your order.',
            'OUT_FOR_DELIVERY': 'Your order is on the way.',
            'DELIVERED': 'Your order has been delivered successfully.',
            'CANCELLED': 'Your order has been cancelled.'
        };
        return messages[status] || 'Your order status has been updated.';
    }

    private static getStatusPriority(status: string): 'low' | 'normal' | 'high' | 'urgent' {
        const priorities: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
            'CONFIRMED': 'high',
            'PREPARING': 'normal',
            'READY_FOR_PICKUP': 'high',
            'ASSIGNED': 'high',
            'PICKED_UP': 'high',
            'OUT_FOR_DELIVERY': 'high',
            'DELIVERED': 'high',
            'CANCELLED': 'high'
        };
        return priorities[status] || 'normal';
    }
}