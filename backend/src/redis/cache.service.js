import redisClient from './redis.client.js';
import logger from '../utils/logger.js';

class CacheService {
  /**
   * Fetch an item from the cache.
   * Parses JSON string back into an object/array.
   */
  async get(key) {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Cache get failure for key "${key}":`, error.message);
      return null; // Fail gracefully so database fallback works
    }
  }

  /**
   * Store an item in the cache.
   * Serializes value to JSON and sets an optional TTL (Time To Live).
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set failure for key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Delete specific cache key.
   */
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete failure for key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Invalidate all cached task list keys associated with a specific team.
   * Scans keys matching: `tasks:team:{teamId}:*` and deletes them.
   */
  async invalidateTeamTasks(teamId) {
    try {
      const pattern = `tasks:team:${teamId}:*`;
      const stream = redisClient.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on('data', async (keys) => {
        if (keys.length > 0) {
          try {
            await redisClient.del(...keys);
            logger.debug(`Successfully invalidated ${keys.length} cached task list keys for team: ${teamId}`);
          } catch (err) {
            logger.error(`Failed to delete scanned cache keys:`, err.message);
          }
        }
      });

      stream.on('error', (err) => {
        logger.error(`Scan stream error for key pattern "${pattern}":`, err.message);
      });
    } catch (error) {
      logger.error(`Invalidate team tasks failed for team "${teamId}":`, error.message);
    }
  }
}

export default new CacheService();
