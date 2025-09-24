import { queueService } from '../modules/queues/queue.service.js';
import { redisService } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { DeliveryJobData, LocationUpdateJobData } from '../types/queue.js';

async function testQueueService() {
    try {
        console.log('📋 Testing Queue Service...');
        
        // Connect Redis first
        await redisService.connect();
        console.log('✅ Redis connected');
        
        // Wait a moment for queue service to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test delivery job queue
        console.log('🧪 Testing delivery job queue...');
        
        const testDeliveryJob: DeliveryJobData = {
            orderId: 'test-order-123',
            vendorId: 'test-vendor-456',
            customerId: 'test-customer-789',
            vendorName: 'Test Restaurant',
            customerName: 'Test Customer',
            pickupAddress: '123 Test St, Test City',
            deliveryAddress: '456 Delivery Ave, Test City',
            deliveryFee: 5.99,
            distance: 2.5,
            items: [
                {
                    id: 'item-1',
                    name: 'Test Burger',
                    quantity: 1,
                    price: 12.99
                }
            ],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        };
        
        const deliveryJob = await queueService.addDeliveryJob(testDeliveryJob);
        console.log('✅ Delivery job added:', deliveryJob.id);
        
        // Test location update queue
        console.log('🧪 Testing location update queue...');
        
        const testLocationUpdate: LocationUpdateJobData = {
            riderId: 'test-rider-123',
            orderId: 'test-order-123',
            latitude: 40.7128,
            longitude: -74.0060,
            timestamp: new Date()
        };
        
        const locationJob = await queueService.addLocationUpdate(testLocationUpdate);
        console.log('✅ Location update job added:', locationJob.id);
        
        // Wait for jobs to process
        console.log('⏳ Waiting for jobs to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check queue stats
        const stats = await queueService.getQueueStats();
        console.log('📊 Queue Stats:', JSON.stringify(stats, null, 2));
        
        console.log('🎉 Queue service tests completed!');
        
    } catch (error) {
        console.error('❌ Queue test failed:', error);
        logger.error({ error }, 'Queue test failed');
    } finally {
        // Cleanup
        await queueService.close();
        await redisService.disconnect();
        console.log('🔴 Services closed');
        process.exit(0);
    }
}

// Run the test
testQueueService();
