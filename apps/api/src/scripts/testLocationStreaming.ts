import { prisma } from '../config/db.js';
import { redisService } from '../config/redis.js';
import { queueService } from '../modules/queues/queue.service.js';
import { LocationService } from '../modules/location/location.service.js';
import { logger } from '../utils/logger.js';

async function testLocationStreaming() {
    try {
        console.log('📍 Testing Location Streaming System...');
        
        // Connect Redis
        await redisService.connect();
        console.log('✅ Redis connected');
        
        // Wait for queue service
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create test data
        console.log('📝 Creating test data...');
        
        // Create test customer first
        const testCustomer = await prisma.customer.create({
            data: {
                user: {
                    create: {
                        email: 'location-customer@test.com',
                        name: 'Location Test Customer',
                        password: 'hashedpassword',
                        role: 'CUSTOMER' as any
                    }
                }
            },
            include: { user: true }
        });
        console.log('✅ Test customer created:', testCustomer.id);
        
        // Create test vendor
        const testVendor = await prisma.vendor.create({
            data: {
                businessName: 'Location Test Restaurant',
                isActive: true,
                isOpen: true,
                latitude: 40.7128,
                longitude: -74.0060,
                user: {
                    create: {
                        email: 'location-vendor@test.com',
                        name: 'Location Test Vendor',
                        password: 'hashedpassword',
                        role: 'VENDOR' as any
                    }
                }
            },
            include: { user: true }
        });
        console.log('✅ Test vendor created:', testVendor.id);
        
        // Create test rider
        const testRider = await prisma.rider.create({
            data: {
                vehicleType: 'BIKE',
                isOnline: true,
                isAvailable: true,
                currentLat: 40.7128,
                currentLng: -74.0060,
                user: {
                    create: {
                        email: 'location-rider@test.com',
                        name: 'Location Test Rider',
                        password: 'hashedpassword',
                        role: 'RIDER' as any
                    }
                }
            },
            include: { user: true }
        });
        console.log('✅ Test rider created:', testRider.id);
        
        // Create test order with rider assigned
        const testOrder = await prisma.order.create({
            data: {
                orderNumber: 'LOCATION-TEST-001',
                customerId: testCustomer.id,
                vendorId: testVendor.id,
                riderId: testRider.id,
                status: 'ASSIGNED',
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
                }
            }
        });
        console.log('✅ Test order created:', testOrder.id);
        
        // Test location updates
        console.log('🔄 Testing location updates...');
        
        // Simulate rider moving (like GPS updates every 10 seconds)
        const locations = [
            { lat: 40.7128, lng: -74.0060, name: 'Starting Point' },
            { lat: 40.7200, lng: -74.0100, name: 'Moving North' },
            { lat: 40.7300, lng: -74.0150, name: 'Moving Northeast' },
            { lat: 40.7400, lng: -74.0200, name: 'Getting Closer' },
            { lat: 40.7589, lng: -73.9851, name: 'Destination' }
        ];
        
        for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            console.log(`📍 Simulating location ${i + 1}: ${location?.name}`);
            
            // Update rider location in database
            await prisma.rider.update({
                where: { id: testRider.id },
                data: {
                    currentLat: location?.lat ?? 0,
                    currentLng: location?.lng ?? 0
                }
            });
            
            // Add location update to queue
            await queueService.addLocationUpdate({
                riderId: testRider.id,
                orderId: testOrder.id,
                latitude: location?.lat ?? 0,
                longitude: location?.lng ?? 0,
                timestamp: new Date()
            });
            
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Wait for all location updates to be processed
        console.log('⏳ Waiting for location updates to be processed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Test Redis location storage
        console.log('🧪 Testing Redis location storage...');
        
        const currentLocation = await LocationService.getRiderCurrentLocation(testRider.id);
        console.log('✅ Current location from Redis:', currentLocation);
        
        const locationHistory = await LocationService.getRiderLocationHistory(testRider.id, 10);
        console.log('✅ Location history from Redis:', locationHistory.length, 'points');
        
        // Show location history details
        if (locationHistory.length > 0) {
            console.log('📍 Location history details:');
            locationHistory.forEach((loc, index) => {
                console.log(`  ${index + 1}. Lat: ${loc.lat}, Lng: ${loc.lng}, Time: ${loc.timestamp}`);
            });
        }
        
        // Test order location lookup
        const orderLocation = await LocationService.getRiderLocationForOrder(testOrder.id);
        console.log('✅ Order location data:', orderLocation);
        
        // Check queue stats
        const queueStats = await queueService.getQueueStats();
        console.log('📊 Location Queue Stats:', JSON.stringify(queueStats.location, null, 2));
        
        console.log('🎉 Location streaming test completed successfully!');
        
    } catch (error) {
        console.error('❌ Location streaming test failed:', error);
        logger.error({ error }, 'Location streaming test failed');
    } finally {
        // Cleanup test data
        try {
            console.log('🧹 Cleaning up test data...');
            
            // Delete in reverse order due to foreign key constraints
            await prisma.order.deleteMany({
                where: { orderNumber: 'LOCATION-TEST-001' }
            });
            
            await prisma.rider.deleteMany({
                where: { user: { email: 'location-rider@test.com' } }
            });
            
            await prisma.customer.deleteMany({
                where: { user: { email: 'location-customer@test.com' } }
            });
            
            await prisma.vendor.deleteMany({
                where: { businessName: 'Location Test Restaurant' }
            });
            
            await prisma.user.deleteMany({
                where: { 
                    email: { 
                        in: [
                            'location-rider@test.com', 
                            'location-customer@test.com', 
                            'location-vendor@test.com'
                        ] 
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
testLocationStreaming();
