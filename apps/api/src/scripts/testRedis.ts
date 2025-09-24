import { redisService } from '../config/redis.js';
import { logger } from '../utils/logger.js';

async function testRedisConnection() {
    try {
        console.log('🔴 Testing Redis connection...');
        
        // Connect to Redis
        await redisService.connect();
        console.log('✅ Redis connected successfully');
        
        // Test basic operations
        console.log('�� Testing Redis operations...');
        
        // Test SET/GET
        await redisService.set('test:key', 'Hello Redis!', 60);
        const value = await redisService.get('test:key');
        console.log('✅ SET/GET test:', value === 'Hello Redis!' ? 'PASSED' : 'FAILED');
        
        // Test Hash operations
        await redisService.hSet('test:hash', 'field1', 'value1');
        await redisService.hSet('test:hash', 'field2', 'value2');
        const hashValue = await redisService.hGet('test:hash', 'field1');
        console.log('✅ Hash operations test:', hashValue === 'value1' ? 'PASSED' : 'FAILED');
        
        // Test Set operations
        await redisService.sAdd('test:set', 'member1', 'member2', 'member3');
        const setMembers = await redisService.sMembers('test:set');
        console.log('✅ Set operations test:', setMembers.length === 3 ? 'PASSED' : 'FAILED');
        
        // Test List operations
        await redisService.lPush('test:list', 'item1', 'item2', 'item3');
        const listLength = await redisService.lLen('test:list');
        console.log('✅ List operations test:', listLength === 3 ? 'PASSED' : 'FAILED'); 
        
        // Test TTL
        await redisService.set('test:ttl', 'expires', 5);
        const ttl = await redisService.ttl('test:ttl');
        console.log('✅ TTL test:', ttl > 0 && ttl <= 5 ? 'PASSED' : 'FAILED');
        
        // Cleanup test keys
        await redisService.del('test:key');
        await redisService.del('test:hash');
        await redisService.del('test:set');
        await redisService.del('test:list');
        await redisService.del('test:ttl');
        console.log('🧹 Cleaned up test keys');
        
        console.log('🎉 All Redis tests passed!');
        
    } catch (error) {
        console.error('❌ Redis test failed:', error);
        logger.error({ error }, 'Redis test failed');
    } finally {
        // Disconnect
        await redisService.disconnect();
        console.log('🔴 Redis disconnected');
        process.exit(0);
    }
}

// Run the test
testRedisConnection();
