import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { redisService } from '../src/config/redis.js';
import { queueService } from '../src/modules/queues/queue.service.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('Delivery System Integration Tests', () => {
    let testVendor: any;
    let testCustomer: any;
    let testRider: any;
    let testOrder: any;
    let vendorToken: string;
    let riderToken: string;

    beforeAll(async () => {
        // Connect Redis
        await redisService.connect();
        
        // Wait for queue service to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create test data
        testVendor = await prisma.vendor.create({
            data: {
                // userId: 'test-vendor-user',
                businessName: 'Test Delivery Restaurant',
                // address: '123 Test Vendor St, Test City',
                // phone: '+1234567890',
                isActive: true,
                isOpen: true,
                latitude: 40.7128,
                longitude: -74.0060,
                user: {
                    create: {
                        email: 'vendor@test.com',
                        name: 'Test Vendor',
                        password: 'hashedpassword',
                        role: 'VENDOR'
                    }
                }
            },
            include: { user: true }
        });

        testCustomer = await prisma.customer.create({
            data: {
                // userId: 'test-customer-user',
                user: {
                    create: {
                        email: 'customer@test.com',
                        name: 'Test Customer',
                        password: 'hashedpassword',
                        phone: '+1234567890',
                        role: 'CUSTOMER'
                    }
                }
            },
            include: { user: true }
        });

        testRider = await prisma.rider.create({
            data: {
                // userId: 'test-rider-user',
                vehicleType: 'BIKE',
                isOnline: true,
                currentLat: 40.7589,
                currentLng: -73.9851,
                user: {
                    create: {
                        email: 'rider@test.com',
                        name: 'Test Rider',
                        password: 'hashedpassword',
                        role: 'RIDER'
                    }
                }
            },
            include: { user: true }
        });

        // Create a category first
        const testCategory = await prisma.category.create({
            data: {
                name: 'Test Category',
                description: 'A test category for delivery testing'
            }
        });

        // Then create the menu item with the valid categoryId
        const testMenuItem = await prisma.menuItem.create({
            data: {
                vendorId: testVendor.id,
                categoryId: testCategory.id, // Use the actual category ID
                name: 'Test Burger',
                description: 'A delicious test burger',
                price: 12.99
            }
        });

        testOrder = await prisma.order.create({
            data: {
                orderNumber: 'TEST-API-001',
                customerId: testCustomer.id as string,
                vendorId: testVendor.id as string,
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
            }
        });

        // Create JWT tokens
        vendorToken = jwt.sign(
            { userId: testVendor.userId, role: 'VENDOR' },
            env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        riderToken = jwt.sign(
            { userId: testRider.userId, role: 'RIDER' },
            env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Cleanup test data
        await prisma.orderItem.deleteMany({
            where: { order: { orderNumber: 'TEST-API-001' } }
        });
        
        await prisma.order.deleteMany({
            where: { orderNumber: 'TEST-API-001' }
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

        // Close services
        await queueService.close();
        await redisService.disconnect();
    });

    describe('Order Status Update Triggers Delivery Job', () => {
        it('should trigger delivery job when order status is updated to READY_FOR_PICKUP', async () => {
            const response = await request(app)
                .patch(`/api/v1/orders/${testOrder.id}/status`)
                .set('Authorization', `Bearer ${vendorToken}`)
                .send({
                    status: 'READY_FOR_PICKUP'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('READY_FOR_PICKUP');

            // Wait for delivery job to be processed
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check queue stats
            const queueStats = await queueService.getQueueStats();
            expect(queueStats.delivery.completed.length).toBeGreaterThan(0);
        });
    });

    describe('Rider Delivery Job Endpoints', () => {
        it('should allow rider to accept delivery job', async () => {
            const response = await request(app)
                .post(`/api/v1/riders/delivery-jobs/${testOrder.id}/accept`)
                .set('Authorization', `Bearer ${riderToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.orderId).toBe(testOrder.id);

            // Verify order was assigned to rider
            const updatedOrder = await prisma.order.findUnique({
                where: { id: testOrder.id },
                include: { rider: { include: { user: true } } }
            });

            expect(updatedOrder?.riderId).toBe(testRider.id);
            expect(updatedOrder?.status).toBe('ASSIGNED');
        });

        it('should allow rider to reject delivery job', async () => {
            // Create another test order for rejection test
            const testOrder2 = await prisma.order.create({
                data: {
                    orderNumber: 'TEST-API-002',
                    customerId: testCustomer.id,
                    vendorId: testVendor.id,
                    status: 'READY_FOR_PICKUP',
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

            const response = await request(app)
                .post(`/api/v1/riders/delivery-jobs/${testOrder2.id}/reject`)
                .set('Authorization', `Bearer ${riderToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.orderId).toBe(testOrder2.id);

            // Cleanup
            await prisma.order.delete({ where: { id: testOrder2.id } });
        });

        it('should require authentication for delivery job endpoints', async () => {
            const response = await request(app)
                .post(`/api/v1/riders/delivery-jobs/${testOrder.id}/accept`);

            expect(response.status).toBe(401);
        });
    });

    describe('Rider Status Endpoints', () => {
        it('should allow rider to update status', async () => {
            const response = await request(app)
                .put('/api/v1/riders/status')
                .set('Authorization', `Bearer ${riderToken}`)
                .send({
                    isOnline: true,
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.isOnline).toBe(true);
        });

        it('should allow rider to get status', async () => {
            const response = await request(app)
                .get('/api/v1/riders/status')
                .set('Authorization', `Bearer ${riderToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('isOnline');
        });
    });
});
