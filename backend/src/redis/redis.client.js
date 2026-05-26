import Redis from 'ioredis';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let redisClient = null;

/**
 * Initialize and get the Redis client singleton.
 * Uses configuration values validated by env.js.
 */
export function getRedisClient() {
  if (redisClient) return redisClient;

  logger.info('🔌 Connecting to Redis...');

  const options = {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      logger.warn(`Redis connection retry attempt ${times} after ${delay}ms...`);
      return delay;
    },
  };

  // Construct client from URL or parts
  if (env.REDIS_URL) {
    redisClient = new Redis(env.REDIS_URL, options);
  } else {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      ...options,
    });
  }

  // ── Redis Connection Event Listeners ───────────────────────
  redisClient.on('connect', () => {
    logger.info('✅ Redis server connecting...');
  });

  redisClient.on('ready', () => {
    logger.info('✅ Redis connected successfully and ready');
  });

  redisClient.on('error', (error) => {
    logger.error('❌ Redis connection error:', error.message);
  });

  redisClient.on('close', () => {
    logger.warn('⚠️ Redis connection closed');
  });

  return redisClient;
}

export default getRedisClient();
