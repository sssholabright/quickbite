import { DeliveryJobService } from '../modules/delivery/deliveryJob.service.js';
import { logger } from '../utils/logger.js';
import { SocketService } from '../config/socket.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

/**
 * 🚀 UPDATED STANDALONE SCRIPT: Broadcast existing ready orders using sequential processing
 * Real-world: Uses the industry-standard sequential broadcasting instead of batch processing
 * 
 * Usage:
 * - Run manually: npm run script:broadcast-orders
 * - Schedule with cron: Every 5 minutes
 * - Trigger from admin dashboard
 */
async function broadcastExistingOrders() {
    try {
        console.log('🚀 Starting broadcast of existing READY_FOR_PICKUP orders...');
        
        // 🚀 FIXED: Initialize socket manager for standalone script
        const httpServer = createServer();
        const io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // Initialize socket service
        const socketService = new SocketService(io as any);
        console.log('✅ Socket manager initialized for script');
        
        // 🚀 UPDATED: Use DeliveryJobService.checkWaitingOrders() instead of OrderService.broadcastExistingReadyOrders()
        // This ensures we use the sequential processing system
        console.log('🔄 Checking for waiting orders using sequential processing...');
        
        try {
            await DeliveryJobService.checkWaitingOrders();
            console.log('✅ Successfully triggered sequential broadcasting of waiting orders');
            
            // Wait a moment for processing to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('📊 Broadcast Results:');
            console.log('✅ Success: true');
            console.log('📝 Message: Successfully triggered sequential broadcasting');
            console.log('🎯 Broadcast completed successfully!');
            
            process.exit(0);
        } catch (deliveryError) {
            console.error('❌ Error during sequential broadcasting:', deliveryError);
            
            // Fallback: Try the old method if sequential processing fails
            console.log('🔄 Falling back to batch broadcasting...');
            const { OrderService } = await import('../modules/orders/order.service.js');
            const result = await OrderService.broadcastExistingReadyOrders();
            
            console.log('📊 Fallback Broadcast Results:');
            console.log(`✅ Success: ${result.success}`);
            console.log(`📝 Message: ${result.message}`);
            console.log(`📦 Orders Found: ${result.ordersFound}`);
            console.log(`📤 Orders Broadcasted: ${result.ordersBroadcasted}`);
            
            if (result.errors.length > 0) {
                console.log('❌ Errors:');
                result.errors.forEach(error => console.log(`   - ${error}`));
            }
            
            if (result.success) {
                console.log('🎯 Fallback broadcast completed successfully!');
                process.exit(0);
            } else {
                console.log('❌ Fallback broadcast failed!');
                process.exit(1);
            }
        }
        
    } catch (error) {
        console.error('❌ Fatal error during broadcast:', error);
        process.exit(1);
    }
}

// Run the script
broadcastExistingOrders();
