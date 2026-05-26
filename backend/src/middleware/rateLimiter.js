import redisClient from '../redis/redis.client.js';
import env from '../config/env.js';
import { errorResponse, ErrorCodes } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Shared API Rate Limiting Middleware backed by Redis.
 * Ensures consistent rate limits across clustered/load-balanced server environments.
 */
export async function rateLimiter(req, res, next) {
  // Use user ID if authenticated, fallback to client IP
  const identifier = req.dbUser ? `user:${req.dbUser.id}` : `ip:${req.ip}`;
  const key = `ratelimit:${identifier}`;

  try {
    const requests = await redisClient.incr(key);

    // If it's a new request window, set the expiration window
    if (requests === 1) {
      await redisClient.expire(key, Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000));
    }

    const ttl = await redisClient.ttl(key);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', env.RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, env.RATE_LIMIT_MAX_REQUESTS - requests));
    res.setHeader('X-RateLimit-Reset', ttl > 0 ? ttl : 0);

    if (requests > env.RATE_LIMIT_MAX_REQUESTS) {
      logger.warn(`Rate Limit Exceeded: ${identifier} has made ${requests} requests in the current window`);
      
      return errorResponse(res, {
        statusCode: 429,
        code: ErrorCodes.RATE_LIMITED,
        message: `Too many requests. Please retry in ${ttl} seconds.`,
      });
    }

    next();
  } catch (error) {
    logger.error('Rate Limiter error:', error.message);
    // Fail-open strategy: If Redis goes down, we allow the request through to prevent a full system outage
    next();
  }
}

export default rateLimiter;
