import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export async function initializeRedis() {
  try {
    if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
      console.warn('⚠️  Redis credentials not set, running without cache');
      return;
    }

    redisClient = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });

    // Test connection
    await redisClient.set('ping', 'pong');
    const pong = await redisClient.get('ping');
    if (pong === 'pong') {
      isRedisAvailable = true;
      console.log('✅ Redis (Upstash) connected');
    }
  } catch (error: any) {
    console.warn('⚠️  Redis not available, running without cache:', error.message);
    isRedisAvailable = false;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!isRedisAvailable || !redisClient) return null;
  try {
    return await redisClient.get<string>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, expirySeconds?: number): Promise<void> {
  if (!isRedisAvailable || !redisClient) return;
  try {
    if (expirySeconds) {
      await redisClient.setex(key, expirySeconds, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error: any) {
    console.warn('Cache set failed:', error.message);
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!isRedisAvailable || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error: any) {
    console.warn('Cache delete failed:', error.message);
  }
}

export default redisClient;
