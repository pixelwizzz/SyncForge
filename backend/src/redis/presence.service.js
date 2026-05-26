import redisClient from './redis.client.js';
import logger from '../utils/logger.js';

class PresenceService {
  privateKey = 'presence:online';

  /**
   * Set user status to online and store their active socket ID.
   */
  async setOnline(userId, socketId) {
    try {
      await redisClient.hset(this.privateKey, userId, socketId);
      logger.debug(`⚡ Redis Presence: User ${userId} marked as ONLINE`);
      return true;
    } catch (error) {
      logger.error(`Presence setOnline error for User ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Remove user from online registry on disconnect.
   */
  async setOffline(userId) {
    try {
      await redisClient.hdel(this.privateKey, userId);
      logger.debug(`⚡ Redis Presence: User ${userId} marked as OFFLINE`);
      return true;
    } catch (error) {
      logger.error(`Presence setOffline error for User ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Query which of the provided user IDs are currently online.
   * Returns a map of user ID -> true/false.
   * 
   * @param {Array<string>} userIds - List of user UUIDs to inspect.
   */
  async getOnlineStatuses(userIds) {
    if (!userIds || userIds.length === 0) return {};

    try {
      const results = await redisClient.hmget(this.privateKey, ...userIds);
      
      const statusMap = {};
      userIds.forEach((id, index) => {
        // If there's a stored socket ID for the user, they are online
        statusMap[id] = results[index] !== null;
      });

      return statusMap;
    } catch (error) {
      logger.error('Presence getOnlineStatuses failure:', error.message);
      return {};
    }
  }
}

export default new PresenceService();
