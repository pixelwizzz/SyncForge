import presenceService from '../redis/presence.service.js';
import logger from '../utils/logger.js';

/**
 * Register Socket.io presence and user interaction events (typing indicators, connection tracking).
 * 
 * @param {import('socket.io').Server} io - Socket.io Server instance
 * @param {import('socket.io').Socket} socket - Connecting Socket instance
 */
export function registerPresenceEvents(io, socket) {
  const userId = socket.user.id;

  // 1. Mark user as online in Redis immediately upon WebSocket connection
  presenceService.setOnline(userId, socket.id);

  /**
   * Listen for typing indicators.
   * Client emits 'typing:start' with { teamId, taskId } when they focus on a task edit.
   */
  socket.on('typing:start', ({ teamId, taskId }) => {
    if (!teamId || !taskId) return;

    const roomName = `team:${teamId}`;
    
    // Broadcast 'user:typing' to all other team members in the room
    socket.to(roomName).emit('user:typing', {
      taskId,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        avatar_url: socket.user.avatar_url,
      },
    });
  });

  /**
   * Listen for typing stop.
   * Client emits 'typing:stop' with { teamId, taskId } when they blur input or finish editing.
   */
  socket.on('typing:stop', ({ teamId, taskId }) => {
    if (!teamId || !taskId) return;

    const roomName = `team:${teamId}`;
    
    // Broadcast 'user:stop_typing' to all other team members in the room
    socket.to(roomName).emit('user:stop_typing', {
      taskId,
      userId: socket.user.id,
    });
  });

  /**
   * Track client queries for active team members online.
   * Client emits 'team:presence' with { teamId, memberIds } to check who is active.
   */
  socket.on('team:presence', async ({ memberIds }, callback) => {
    if (!memberIds || memberIds.length === 0) {
      if (callback) callback({});
      return;
    }

    try {
      const activeStatuses = await presenceService.getOnlineStatuses(memberIds);
      if (callback) callback(activeStatuses);
    } catch (error) {
      logger.error('WebSocket team:presence query error:', error.message);
      if (callback) callback({});
    }
  });

  /**
   * Handle user disconnection.
   * Clean up presence states in Redis.
   */
  socket.on('disconnect', async () => {
    try {
      await presenceService.setOffline(userId);
      logger.debug(`🔌 WebSocket: User ${socket.user.name} disconnected`);
    } catch (error) {
      logger.error('WebSocket disconnect cleanup failure:', error.message);
    }
  });
}

export default registerPresenceEvents;
