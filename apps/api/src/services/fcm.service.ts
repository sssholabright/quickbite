import { logger } from '../utils/logger.js';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import admin from 'firebase-admin';

// Instead of reading from file, use environment variables
const serviceAccount = {
    type: "service_account",
    project_id: env.FCM_PROJECT_ID,
    private_key_id: env.FCM_PRIVATE_KEY_ID,
    private_key: env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: env.FCM_CLIENT_EMAIL,
    client_id: env.FCM_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${env.FCM_CLIENT_EMAIL}`
};

interface FCMMessage {
    title: string;
    body: string;
    data?: any;
    imageUrl?: string;
}

interface FCMSendOptions {
    userId?: string;
    riderId?: string;
    customerId?: string;
    vendorId?: string;
    orderId?: string;
}

export class FCMService {
    private static initialized = false;

    /**
     * Initialize Firebase Admin SDK
     */
    private static initializeFirebase(): void {
        if (this.initialized) return;

        try {
            logger.info(`🚀 Initializing Firebase Admin SDK...`);
            logger.info(`FCM_PROJECT_ID: ${env.FCM_PROJECT_ID}`);

            // Check if FCM is configured
            if (!env.FCM_PROJECT_ID) {
                logger.warn('FCM not configured - skipping Firebase initialization');
                this.initialized = true;
                return;
            }

            logger.info(`📁 Using imported service account`);

            // Check if app already exists
            if (admin.apps.length === 0) {
                logger.info(`🚀 Initializing Firebase app...`);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
                    projectId: env.FCM_PROJECT_ID
                });
                logger.info(`✅ Firebase app initialized`);
            } else {
                logger.info(`ℹ️ Firebase app already exists, skipping initialization`);
            }

            this.initialized = true;
            logger.info('✅ Firebase Admin SDK initialized successfully');
        } catch (error) {
            logger.error('❌ Error initializing Firebase Admin SDK:', error as any);
            this.initialized = true;
        }
    }

    /**
     * Send notification to specific rider - supports both FCM and Expo tokens
     */
    static async sendToRider(riderId: string, message: FCMMessage, options?: FCMSendOptions): Promise<boolean> {
        try {
            const rider = await prisma.rider.findUnique({
                where: { id: riderId },
                select: { pushToken: true, user: { select: { name: true } } }
            });

            if (!rider || !rider.pushToken) {
                logger.warn(`No push token found for rider: ${riderId}`);
                return false;
            }

            logger.info(`Push token for rider ${riderId}: ${rider.pushToken.substring(0, 20)}...`);
            logger.info(`Push token length: ${rider.pushToken.length}`);

            // Check token type and route accordingly
            if (rider.pushToken.startsWith('ExponentPushToken[')) {
                logger.info(`📱 Using Expo Push API for rider ${riderId}`);
                return await this.sendExpoNotification(rider.pushToken, message, options);
            } else {
                logger.info(`🔥 Using FCM for rider ${riderId}`);
                return await this.sendFCMNotification(rider.pushToken, message, options);
            }

        } catch (error) {
            logger.error({ error, riderId }, 'Error sending notification to rider');
            return false;
        }
    }

    /**
     * Send notification to specific customer - supports both FCM and Expo tokens
     */
    static async sendToCustomer(customerId: string, message: FCMMessage, options?: FCMSendOptions): Promise<boolean> {
        try {
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
                select: { pushToken: true, user: { select: { name: true } } }
            });

            if (!customer || !customer.pushToken) {
                logger.warn(`No push token found for customer: ${customerId}`);
                return false;
            }

            logger.info(`Push token for customer ${customerId}: ${customer.pushToken.substring(0, 20)}...`);
            logger.info(`Push token length: ${customer.pushToken.length}`);
            logger.info(`Push token starts with ExponentPushToken: ${customer.pushToken.startsWith('ExponentPushToken[')}`);

            // Check token type and route accordingly
            if (customer.pushToken.startsWith('ExponentPushToken[')) {
                logger.info(`📱 Using Expo Push API for customer ${customerId}`);
                return await this.sendExpoNotification(customer.pushToken, message, options);
            } else {
                logger.info(`🔥 Using FCM for customer ${customerId}`);
                return await this.sendFCMNotification(customer.pushToken, message, options);
            }

        } catch (error) {
            logger.error({ error, customerId }, 'Error sending notification to customer');
            return false;
        }
    }

    /**
     * Send notification to specific vendor - supports Expo tokens only
     */
    static async sendToVendor(vendorId: string, message: FCMMessage, options?: FCMSendOptions): Promise<boolean> {
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { id: vendorId },
                select: { pushToken: true, user: { select: { name: true } } }
            });

            if (!vendor || !vendor.pushToken) {
                logger.warn(`No push token found for vendor: ${vendorId}`);
                return false;
            }

            logger.info(`Push token for vendor ${vendorId}: ${vendor.pushToken.substring(0, 20)}...`);
            logger.info(`Push token length: ${vendor.pushToken.length}`);

            // 🚀 FIX: Only handle Expo tokens, skip everything else
            if (vendor.pushToken.startsWith('ExponentPushToken[')) {
                logger.info(`📱 Using Expo Push API for vendor ${vendorId}`);
                return await this.sendExpoNotification(vendor.pushToken, message, options);
            } else {
                logger.info(`🌐 Non-Expo token detected for vendor ${vendorId} - skipping notification`);
                logger.warn(`Only Expo push notifications are supported for vendor ${vendorId}`);
                return false; // Skip non-Expo tokens
            }

        } catch (error) {
            logger.error({ error, vendorId }, 'Error sending notification to vendor');
            return false;
        }
    }

    /**
     * Send notification via Expo Push API
     */
    private static async sendExpoNotification(token: string, message: FCMMessage, options?: FCMSendOptions): Promise<boolean> {
        try {
            const payload = {
                to: token,
                title: message.title,
                body: message.body,
                data: {
                    ...message.data,
                    ...options,
                    timestamp: new Date().toISOString()
                },
                sound: 'default',
                badge: 1,
                priority: 'high',
                channelId: 'order-updates', // 🚀 NEW: Use high-priority channel
                projectId: env.FCM_PROJECT_ID
            };

            logger.info(`📱 Sending Expo push to: ${token.substring(0, 20)}...`);
            logger.info(`📱 Payload: ${JSON.stringify(payload)}`);

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`Expo push send failed: ${response.status} - ${errorText}`);
                return false;
            }

            const result = await response.json();
            logger.info(`📱 Expo push response:`, result);
            
            if (result.data && result.data[0] && result.data[0].status === 'error') {
                logger.error(`Expo push error: ${result.data[0].message}`);
                return false;
            }

            logger.info(`✅ Expo push notification sent successfully`);
            return true;

        } catch (error) {
            logger.error({ error }, 'Error sending Expo push notification');
            return false;
        }
    }

    /**
     * Send notification via Firebase Cloud Messaging
     */
    private static async sendFCMNotification(token: string, message: FCMMessage, options?: FCMSendOptions): Promise<boolean> {
        try {
            this.initializeFirebase();

            // Check if FCM is configured
            if (!env.FCM_PROJECT_ID) {
                logger.warn('FCM not configured - skipping notification');
                return false;
            }

            // 🚀 ENHANCED: Better token validation
            logger.info(`🔥 Attempting FCM send to token: ${token.substring(0, 20)}...`);
            
            // Double-check this isn't an Expo token
            if (token.startsWith('ExponentPushToken[')) {
                logger.error(`❌ FCM received Expo token: ${token.substring(0, 20)}...`);
                return false;
            }

            const payload = {
                token: token,
                notification: {
                    title: message.title,
                    body: message.body,
                },
                data: {
                    // Convert all values to strings
                    ...Object.fromEntries(
                        Object.entries({
                            ...message.data,
                            ...options,
                            timestamp: new Date().toISOString()
                        }).map(([key, value]) => [key, String(value)])
                    )
                },
                android: {
                    notification: {
                        icon: 'ic_notification',
                        color: '#FF4500',
                        sound: 'default',
                        channelId: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            const result = await admin.messaging().send(payload);

            logger.info(`✅ FCM notification sent successfully`);
            return true;

        } catch (error) {
            logger.error({ error, token: token.substring(0, 20) }, 'Error sending FCM notification');
            return false;
        }
    }

    /**
     * Send notification to multiple riders
     */
    static async sendToMultipleRiders(riderIds: string[], message: FCMMessage, options?: FCMSendOptions): Promise<{ success: number; failed: number }> {
        const results = await Promise.allSettled(
            riderIds.map(riderId => this.sendToRider(riderId, message, options))
        );

        const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - success;

        return { success, failed };
    }

    /**
     * Send notification to multiple customers
     */
    static async sendToMultipleCustomers(customerIds: string[], message: FCMMessage, options?: FCMSendOptions): Promise<{ success: number; failed: number }> {
        const results = await Promise.allSettled(
            customerIds.map(customerId => this.sendToCustomer(customerId, message, options))
        );

        const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - success;

        return { success, failed };
    }

    /**
     * Send notification to multiple vendors
     */
    static async sendToMultipleVendors(vendorIds: string[], message: FCMMessage, options?: FCMSendOptions): Promise<{ success: number; failed: number }> {
        const results = await Promise.allSettled(
            vendorIds.map(vendorId => this.sendToVendor(vendorId, message, options))
        );

        const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - success;

        return { success, failed };
    }

    /**
     * Send notification to riders in specific area
     */
    static async sendToRidersInArea(
        latitude: number, 
        longitude: number, 
        radiusKm: number, 
        message: FCMMessage, 
        options?: FCMSendOptions
    ): Promise<{ success: number; failed: number }> {
        try {
            // Find riders within radius (simplified query - you might want to use PostGIS for better performance)
            const riders = await prisma.rider.findMany({
                where: {
                    isOnline: true,
                    pushToken: { not: null },
                    currentLat: { not: null },
                    currentLng: { not: null }
                },
                select: { id: true, currentLat: true, currentLng: true }
            });

            // Filter riders within radius (simplified distance calculation)
            const nearbyRiders = riders.filter((rider: any) => {
                if (!rider.currentLat || !rider.currentLng) return false;
                
                const distance = this.calculateDistance(
                    latitude, longitude,
                    rider.currentLat, rider.currentLng
                );
                
                return distance <= radiusKm;
            });

            const riderIds = nearbyRiders.map((r: any) => r.id);
            return await this.sendToMultipleRiders(riderIds, message, options);
        } catch (error) {
            logger.error({ error, latitude, longitude, radiusKm }, 'Error sending notifications to riders in area');
            return { success: 0, failed: 0 };
        }
    }

    /**
     * Send order-related notifications
     */
    static async sendOrderNotification(
        orderId: string, 
        message: FCMMessage, 
        targetRole: 'RIDER' | 'CUSTOMER' | 'VENDOR'
    ): Promise<boolean> {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    rider: { select: { id: true, pushToken: true } },
                    customer: { select: { id: true, user: { select: { name: true } } } },
                    vendor: { select: { id: true, user: { select: { name: true } } } }
                }
            });

            if (!order) {
                logger.warn(`Order not found: ${orderId}`);
                return false;
            }

            const options: FCMSendOptions = { orderId };

            switch (targetRole) {
                case 'RIDER':
                    if (!order.riderId) {
                        logger.warn(`No rider assigned to order: ${orderId}`);
                        return false;
                    }
                    return await this.sendToRider(order.riderId, message, options);

                case 'CUSTOMER':
                    // 🚀 FIXED: Now supports customer push notifications
                    if (!order.customerId) {
                        logger.warn(`No customer assigned to order: ${orderId}`);
                        return false;
                    }
                    return await this.sendToCustomer(order.customerId, message, options);

                case 'VENDOR':
                    // 🚀 FIXED: Now supports vendor push notifications
                    if (!order.vendorId) {
                        logger.warn(`No vendor assigned to order: ${orderId}`);
                        return false;
                    }
                    return await this.sendToVendor(order.vendorId, message, options);

                default:
                    logger.warn(`Invalid target role: ${targetRole}`);
                    return false;
            }
        } catch (error) {
            logger.error({ error, orderId, targetRole }, 'Error sending order notification');
            return false;
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
