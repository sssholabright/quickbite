import { prisma } from '../config/db.js';
import { redisService } from '../config/redis.js';
import { QueueService } from '../modules/queues/queue.service.js';
import { logger } from '../utils/logger.js';

async function testDeliveryBroadcast() {
    try {
        console.log('🚀 Testing Delivery Job Broadcasting...');
        
        // Connect Redis
        await redisService.connect();
        console.log('✅ Redis connected');
        
        // Initialize Queue Service
        const queueService = QueueService.getInstance();
        console.log('✅ Queue service initialized');
        
        // Find existing READY_FOR_PICKUP orders
        const orders = await prisma.order.findMany({
            where: {
                status: 'READY_FOR_PICKUP'
            },
            include: {
                vendor: true,
                customer: {
                    include: {
                        user: true
                    }
                },
                items: {
                    include: {
                        menuItem: true
                    }
                }
            },
            take: 1 // Just test with one order
        });
        
        if (orders.length === 0) {
            console.log('❌ No READY_FOR_PICKUP orders found');
            return;
        }
        
        const order = orders[0];
        if (!order) {
            console.log('❌ No order found');
            return;
        }
        console.log(`📦 Found order: ${order.orderNumber}`);
        
        // Create delivery job data
        const jobData = {
            orderId: order.id,
            vendorId: order.vendorId,
            customerId: order.customerId,
            vendorName: order.vendor.businessName,
            customerName: order.customer.user.name,
            pickupAddress: order.vendor.businessAddress || '',
            deliveryAddress: JSON.stringify(order.deliveryAddress),
            deliveryFee: order.deliveryFee,
            distance: 0,
            items: order.items.map((item: any) => ({
                id: item.id,
                name: item.menuItem.name,
                quantity: item.quantity,
                price: item.unitPrice
            })),
            createdAt: order.createdAt,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        };
        
        console.log('📤 Adding delivery job to queue...');
        
        // Add job to queue
        const job = await queueService.addDeliveryJob(jobData as any);
        console.log(`✅ Delivery job added: ${job}`);
        
        // Wait a bit for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check queue stats
        const stats = await queueService.getQueueStats();
        console.log('📊 Queue Stats:', JSON.stringify(stats, null, 2));
        
        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await redisService.disconnect();
        await prisma.$disconnect();
    }
}

testDeliveryBroadcast();
