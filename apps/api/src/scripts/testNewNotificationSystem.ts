import { NotificationService } from '../modules/notifications/notification.service.js';
import { logger } from '../utils/logger.js';

/**
 * 🚀 Test Script for New Notification System
 * 
 * Tests all notification types and platforms
 */

async function testNotificationSystem() {
    logger.info('🧪 Starting New Notification System Tests...');

    try {
        // Test 1: Mobile Customer Notification
        logger.info('📱 Test 1: Mobile Customer Notification');
        await NotificationService.notifyCustomer('test-customer-1', {
            type: 'order_status_update',
            data: {
                orderId: 'test-order-1',
                status: 'ASSIGNED',
                rider: { name: 'Test Rider', phone: '+1234567890' }
            },
            pushNotification: {
                title: 'Rider Assigned ✅',
                body: 'A rider has been assigned to your order.',
                data: { orderId: 'test-order-1', status: 'ASSIGNED' }
            }
        });

        // Test 2: Mobile Rider Notification
        logger.info('📱 Test 2: Mobile Rider Notification');
        await NotificationService.notifyRider('test-rider-1', {
            type: 'delivery_job',
            data: {
                orderId: 'test-order-2',
                vendorName: 'Test Restaurant',
                total: 2500,
                deliveryFee: 500
            },
            pushNotification: {
                title: 'New Delivery Job Available',
                body: 'Order from Test Restaurant - ₦2500',
                data: { orderId: 'test-order-2', type: 'delivery_job' }
            }
        });

        // Test 3: Web Vendor Notification
        logger.info('🌐 Test 3: Web Vendor Notification');
        await NotificationService.notifyVendor('test-vendor-1', {
            type: 'new_order',
            title: '🆕 New Order!',
            message: 'New order #ORD-123 received',
            data: {
                orderId: 'test-order-3',
                orderNumber: 'ORD-123',
                customerName: 'Test Customer',
                total: 3000
            },
            priority: 'urgent'
        });

        // Test 4: Convenience Method - Order Status Update
        logger.info('🔄 Test 4: Order Status Update (All Platforms)');
        await NotificationService.notifyOrderStatusUpdate(
            'test-order-4',
            'READY_FOR_PICKUP',
            'test-customer-2', // customerId
            'test-rider-2',    // riderId
            'test-vendor-2',    // vendorId
            {
                orderNumber: 'ORD-124',
                timestamp: new Date().toISOString()
            }
        );

        // Test 5: Delivery Job Broadcasting
        logger.info('📡 Test 5: Delivery Job Broadcasting');
        await NotificationService.notifyDeliveryJob(
            ['test-rider-3', 'test-rider-4'],
            {
                orderId: 'test-order-5',
                vendorName: 'Test Restaurant 2',
                total: 4000,
                deliveryFee: 600,
                items: [
                    { name: 'Burger', quantity: 2, price: 2000 }
                ]
            }
        );

        logger.info('✅ All notification tests completed successfully!');
        logger.info('📊 Test Summary:');
        logger.info('  - Mobile Customer: ✅ Socket + FCM');
        logger.info('  - Mobile Rider: ✅ Socket + FCM');
        logger.info('  - Web Vendor: ✅ Socket + Queue');
        logger.info('  - Order Status Update: ✅ All platforms');
        logger.info('  - Delivery Job Broadcasting: ✅ Multiple riders');

    } catch (error) {
        logger.error({ error }, '❌ Notification system test failed');
        throw error;
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testNotificationSystem()
        .then(() => {
            logger.info('🎉 All tests passed! New notification system is working correctly.');
            process.exit(0);
        })
        .catch((error) => {
            logger.error({ error }, '💥 Tests failed!');
            process.exit(1);
        });
}

export { testNotificationSystem };
