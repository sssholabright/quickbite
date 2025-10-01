import { prisma } from '../config/db.js';
import { OrderService } from '../modules/orders/order.service.js';
import { logger } from '../utils/logger.js';

async function testDeliveryJob() {
    try {
        console.log('🚀 Testing Delivery Job Broadcasting...');
        
        // Find any existing order
        const existingOrder = await prisma.order.findFirst({
            where: {
                status: 'PENDING'
            },
            include: {
                vendor: { include: { user: true } },
                customer: { include: { user: true } },
                items: { include: { menuItem: true } }
            }
        });
        
        if (!existingOrder) {
            console.log('❌ No existing orders found. Please create an order first.');
            return;
        }
        
        console.log(`📦 Found order: ${existingOrder.id}`);
        console.log(`📦 Current status: ${existingOrder.status}`);
        
        // Update order status to READY_FOR_PICKUP
        console.log('🔄 Updating order status to READY_FOR_PICKUP...');
        
        const updatedOrder = await OrderService.updateOrderStatus(
            existingOrder.id,
            { status: 'READY_FOR_PICKUP' },
            existingOrder.vendor.userId, // Use vendor's userId
            'VENDOR'
        );
        
        console.log('✅ Order status updated!');
        console.log('📦 New status:', updatedOrder.status);
        
        // Check if any riders are available
        const availableRiders = await prisma.rider.findMany({
            where: {
                isOnline: true,
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
        
        console.log('🎯 Check your rider app for delivery job notifications!');
        
    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testDeliveryJob();
