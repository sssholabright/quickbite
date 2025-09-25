import { prisma } from '../config/db.js';
import { redisService } from '../config/redis.js';
import { queueService } from '../modules/queues/queue.service.js';
import { logger } from '../utils/logger.js';

async function triggerExistingDeliveryJobs() {
    try {
        console.log('🚀 Triggering delivery jobs for existing READY_FOR_PICKUP orders...');
        
        // Connect Redis
        await redisService.connect();
        console.log('✅ Redis connected');
        
        // Initialize queue service
        const queue = queueService.getInstance();
        console.log('✅ Queue service initialized');
        
        // Find all READY_FOR_PICKUP orders
        const readyOrders = await prisma.order.findMany({
            where: {
                status: 'READY_FOR_PICKUP',
                riderId: null // Not assigned yet
            },
            include: {
                vendor: { include: { user: true } },
                customer: { include: { user: true } },
                items: { include: { menuItem: true } }
            }
        });
        
        console.log(`📦 Found ${readyOrders.length} orders ready for pickup`);
        
        if (readyOrders.length === 0) {
            console.log('❌ No orders found');
            return;
        }
        
        // Check available riders
        const availableRiders = await prisma.rider.findMany({
            where: {
                isOnline: true,
                isAvailable: true,
                currentLat: { not: null },
                currentLng: { not: null }
            },
            include: {
                user: { select: { name: true, email: true } }
            }
        });
        
        console.log(`👥 Available riders: ${availableRiders.length}`);
        availableRiders.forEach(rider => {
            console.log(`  - ${rider.user.name} (${rider.user.email})`);
        });
        
        // Trigger delivery jobs for each order
        for (const order of readyOrders) {
            console.log(`\n🎯 Triggering delivery job for order: ${order.id}`);
            
            const deliveryJobData = {
                orderId: order.id,
                vendorId: order.vendorId,
                customerId: order.customerId,
                customerName: order.customer.user.name,
                vendorName: order.vendor.businessName,
                pickupAddress: order.vendor.businessAddress || 'Vendor Address',
                deliveryAddress: JSON.stringify(order.deliveryAddress),
                deliveryFee: order.deliveryFee,
                distance: 0,
                items: order.items.map(item => ({
                    id: item.id,
                    name: item.menuItem.name,
                    quantity: item.quantity,
                    price: item.unitPrice
                })),
                createdAt: order.createdAt,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            };
            
            try {
                await queue.addDeliveryJob(deliveryJobData);
                console.log(`✅ Delivery job added to queue for order ${order.id}`);
            } catch (error) {
                console.error(`❌ Failed to add delivery job for order ${order.id}:`, error);
            }
        }
        
        console.log('\n🎯 Check your rider app for delivery job notifications!');
        console.log('📱 If you don\'t see notifications, check:');
        console.log('  1. WebSocket connection status in rider app');
        console.log('  2. API logs for any errors');
        console.log('  3. Redis connection status');
        
    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

triggerExistingDeliveryJobs();
