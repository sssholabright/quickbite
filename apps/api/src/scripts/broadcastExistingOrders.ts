import { OrderService } from '../modules/orders/order.service.js';
import { logger } from '../utils/logger.js';

/**
 * 🚀 STANDALONE SCRIPT: Broadcast existing ready orders
 * Real-world: Can be run manually or scheduled to ensure riders see all available jobs
 * 
 * Usage:
 * - Run manually: npm run script:broadcast-orders
 * - Schedule with cron: Every 5 minutes
 * - Trigger from admin dashboard
 */
async function broadcastExistingOrders() {
    try {
        console.log('🚀 Starting broadcast of existing READY_FOR_PICKUP orders...');
        
        const result = await OrderService.broadcastExistingReadyOrders();
        
        console.log('📊 Broadcast Results:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`�� Message: ${result.message}`);
        console.log(`�� Orders Found: ${result.ordersFound}`);
        console.log(`�� Orders Broadcasted: ${result.ordersBroadcasted}`);
        
        if (result.errors.length > 0) {
            console.log('❌ Errors:');
            result.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (result.success) {
            console.log('🎯 Broadcast completed successfully!');
            process.exit(0);
        } else {
            console.log('�� Broadcast failed!');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Fatal error during broadcast:', error);
        process.exit(1);
    }
}

// Run the script
broadcastExistingOrders();
