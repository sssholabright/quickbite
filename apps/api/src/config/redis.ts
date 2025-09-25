import { createClient, RedisClientType } from "redis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

class RedisService {
    private client: RedisClientType | null = null;
    private isConnected = false;

    async connect(): Promise<void> {
        try {
            // Use REDIS_URL if provided, otherwise use default localhost:6379
            const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

            this.client = createClient({ 
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis connection failed after 10 retries');
                            logger.error('Redis connection failed after 10 retries');
                            return new Error('Redis connection failed');
                        }
                        console.log(`Redis connection attempt ${retries + 1} failed, retrying in ${Math.min(retries * 50, 500)}ms`);
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis client error:', err);
                logger.error({ error: err }, 'Redis client error');
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis client connected');
                logger.info('Redis client connected');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                console.log('Redis client disconnected');
                logger.warn('Redis client disconnected');
                this.isConnected = false;
            });

            await this.client.connect();

            console.log('Redis connected successfully');
            logger.info('Redis connected successfully');
            this.isConnected = true;
        } catch (error) {
            console.error('Redis connection failed:', error);
            logger.error({ error }, 'Redis connection failed');
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.client) {
                await this.client.disconnect();
                console.log('Redis client disconnected');
                logger.info('Redis client disconnected');
                this.isConnected = false;
            }
        } catch (error) {
            console.error('Redis disconnection failed:', error);
            logger.error({ error }, 'Redis disconnection failed');
            this.isConnected = false;
            throw error;
        }
    }

    getClient(): RedisClientType {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client not initialized or not connected');
        }
        return this.client;
    }

    isRedisConnected(): boolean {
        return this.isConnected;
    }

    // Cache operations
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        const client = this.getClient();
        if (ttlSeconds) {
            await client.setEx(key, ttlSeconds, value);
        } else {
            await client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        const client = this.getClient();
        return await client.get(key);
    }

    async del(key: string): Promise<number> {
        const client = this.getClient();
        return await client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const client = this.getClient();
        const result = await client.exists(key);
        return result === 1;
    }

    // Hash operations
    async hSet(key: string, field: string, value: string): Promise<number> {
        const client = this.getClient();
        return await client.hSet(key, field, value);
    }

    async hGet(key: string, field: string): Promise<string | null> {
        const client = this.getClient();
        return await client.hGet(key, field);
    }

    async hGetAll(key: string): Promise<Record<string, string>> {
        const client = this.getClient();
        return await client.hGetAll(key);
    }

    async hDel(key: string, field: string): Promise<number> {
        const client = this.getClient();
        return await client.hDel(key, field);
    }

    // Set operations
    async sAdd(key: string, ...members: string[]): Promise<number> {
        const client = this.getClient();
        return await client.sAdd(key, members);
    }

    async sMembers(key: string): Promise<string[]> {
        const client = this.getClient();
        return await client.sMembers(key);
    }

    async sRem(key: string, ...members: string[]): Promise<number> {
        const client = this.getClient();
        return await client.sRem(key, members);
    }

    // List operations
    async lPush(key: string, ...elements: string[]): Promise<number> {
        const client = this.getClient();
        return await client.lPush(key, elements);
    }

    async rPop(key: string): Promise<string | null> {
        const client = this.getClient();
        return await client.rPop(key);
    }

    async lLen(key: string): Promise<number> {
        const client = this.getClient();
        return await client.lLen(key);
    }

    // Expire operations
    async expire(key: string, seconds: number): Promise<boolean> {
        const client = this.getClient();
        const result = await client.expire(key, seconds);
        return result === 1;
    }

    async ttl(key: string): Promise<number> {
        const client = this.getClient();
        return await client.ttl(key);
    }

    // Pub/Sub operations
    async publish(channel: string, message: string): Promise<number> {
        const client = this.getClient();
        return await client.publish(channel, message);
    }

    async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
        const client = this.getClient();
        await client.subscribe(channel, callback);
    }

    async unsubscribe(channel: string): Promise<void> {
        const client = this.getClient();
        await client.unsubscribe(channel);
    }

    // Add this method to the RedisService class
    async lTrim(key: string, start: number, stop: number): Promise<void> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        await this.client.lTrim(key, start, stop);
    }

    // Add this method to the RedisService class
    async lRange(key: string, start: number, stop: number): Promise<string[]> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        return await this.client.lRange(key, start, stop);
    }
}

// Create singleton instance
const redisService = new RedisService();

export { redisService };
export default redisService;