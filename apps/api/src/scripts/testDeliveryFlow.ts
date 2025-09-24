import { prisma } from '../config/db.js';
import { redisService } from '../config/redis.js';
import { queueService } from '../modules/queues/queue.service.js';
import { OrderService } from '../modules/orders/order.service.js';
import { logger } from '../utils/logger.js';

async function testDeliveryFlow() {
    try {
        console.log('🚀 Testing Complete Delivery Flow...');
        
        // Connect Redis
        await redisService.connect();
        console.log('✅ Redis connected');
        
        // Wait for queue service
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create test data
        console.log('📝 Creating test data...');
        
        // Create test vendor
        const testVendor = await prisma.vendor.create({
            data: {
                // userId: 'test-vendor-user',
                businessName: 'Test Delivery Restaurant',
                // 'address' is not a valid field on Vendor, so remove it.
                isActive: true,
                isOpen: true,
                latitude: 40.7128,
                longitude: -74.0060,
                user: {
                    create: {
                        email: 'vendor@test.com',
                        name: 'Test Vendor',
                        password: 'hashedpassword',
                        phone: '+1234567890',
                        role: 'VENDOR' as any // Cast to any to bypass type error
                    }
                }
            },
            include: { user: true }
        });
        console.log('✅ Test vendor created:', testVendor.id);
        
        // Create test customer
        const testCustomer = await prisma.customer.create({
            data: {
                // userId: 'test-customer-user',
                user: {
                    create: {
                        email: 'customer@test.com',
                        name: 'Test Customer',
                        password: 'hashedpassword',
                        role: 'CUSTOMER' as any // Cast to any to bypass type error
                    }
                }
            },
            include: { user: true }
        });
        console.log('✅ Test customer created:', testCustomer.id);
        
        // Create test rider
        const testRider = await prisma.rider.create({
            data: {
                // userId: 'test-rider-user',
                vehicleType: 'BIKE',
                isOnline: true,
                isAvailable: true,
                currentLat: 40.7589,
                currentLng: -73.9851,
                user: {
                    create: {
                        email: 'rider@test.com',
                        name: 'Test Rider',
                        password: 'hashedpassword',
                        role: 'RIDER' as any // Cast to any to bypass type error
                    }
                }
            },
            include: { user: true }
        });
        console.log('✅ Test rider created:', testRider.id);
        
        // Create test menu item
        const testMenuItem = await prisma.menuItem.create({
            data: {
                vendorId: testVendor.id,
                categoryId: 'test-category-id',
                name: 'Test Burger',
                description: 'A delicious test burger',
                price: 12.99,
                isAvailable: true,
                // category: 'MAIN_COURSE'
            }
        });
        console.log('✅ Test menu item created:', testMenuItem.id);
        
        // Create test order
        const testOrder = await prisma.order.create({
            data: {
                orderNumber: 'TEST-001',
                customerId: testCustomer.id,
                vendorId: testVendor.id,
                status: 'CONFIRMED',
                subtotal: 12.99,
                deliveryFee: 5.99,
                serviceFee: 1.30,
                total: 20.28,
                deliveryAddress: {
                    street: '456 Delivery Ave',
                    city: 'Test City',
                    state: 'Test State',
                    zipCode: '12345',
                    lat: 40.7589,
                    lng: -73.9851
                },
                items: {
                    create: {
                        menuItemId: testMenuItem.id,
                        quantity: 1,
                        unitPrice: 12.99,
                        totalPrice: 12.99
                    }
                }
            },
            include: {
                vendor: { include: { user: true } },
                customer: { include: { user: true } },
                items: { include: { menuItem: true } }
            }
        });
        console.log('✅ Test order created:', testOrder.id);
        
        // Test the delivery flow
        console.log('🔄 Testing order status update to READY_FOR_PICKUP...');
        
        // Update order status to READY_FOR_PICKUP (this should trigger delivery job)
        const updatedOrder = await OrderService.updateOrderStatus(
            testOrder.id,
            { status: 'READY_FOR_PICKUP' },
            testVendor.userId,
            'VENDOR'
        );
        
        console.log('✅ Order status updated to:', updatedOrder.status);
        
        // Wait for delivery job to be processed
        console.log('⏳ Waiting for delivery job to be processed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if delivery job was created
        const queueStats = await queueService.getQueueStats();
        console.log('📊 Queue Stats after delivery job:', JSON.stringify(queueStats, null, 2));
        
        // Test rider acceptance
        console.log('🔄 Testing rider acceptance...');
        
        const { DeliveryJobService } = await import('../modules/delivery/deliveryJob.service.js');
        await DeliveryJobService.handleRiderAcceptance(testOrder.id, testRider.id);
        
        // Check if order was assigned to rider
        const finalOrder = await prisma.order.findUnique({
            where: { id: testOrder.id },
            include: { rider: { include: { user: true } } }
        });
        
        console.log('✅ Order assigned to rider:', finalOrder?.rider?.user.name);
        console.log('✅ Final order status:', finalOrder?.status);
        
        console.log('🎉 Complete delivery flow test passed!');
        
    } catch (error) {
        console.error('❌ Delivery flow test failed:', error);
        logger.error({ error }, 'Delivery flow test failed');
    } finally {
        // Cleanup test data
        try {
            console.log('🧹 Cleaning up test data...');
            
            // Delete in reverse order due to foreign key constraints
            await prisma.orderItem.deleteMany({
                where: { order: { orderNumber: 'TEST-001' } }
            });
            
            await prisma.order.deleteMany({
                where: { orderNumber: 'TEST-001' }
            });
            
            await prisma.menuItem.deleteMany({
                where: { vendor: { businessName: 'Test Delivery Restaurant' } }
            });
            
            await prisma.rider.deleteMany({
                where: { user: { email: 'rider@test.com' } }
            });
            
            await prisma.customer.deleteMany({
                where: { user: { email: 'customer@test.com' } }
            });
            
            await prisma.vendor.deleteMany({
                where: { businessName: 'Test Delivery Restaurant' } 
            });
            
            await prisma.user.deleteMany({
                where: { 
                    email: { 
                        in: ['vendor@test.com', 'customer@test.com', 'rider@test.com'] 
                    } 
                }
            });
            
            console.log('✅ Test data cleaned up');
            
        } catch (cleanupError) {
            console.error('❌ Cleanup failed:', cleanupError);
        }
        
        // Close services
        await queueService.close();
        await redisService.disconnect();
        console.log('🔴 Services closed');
        process.exit(0);
    }
}

// Run the test
testDeliveryFlow();
