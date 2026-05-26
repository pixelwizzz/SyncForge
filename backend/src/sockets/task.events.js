import TeamMember from '../teams/teamMember.model.js';
import logger from '../utils/logger.js';

/**
 * Register Socket.io event listeners for task collaborations and team rooms.
 * 
 * @param {import('socket.io').Server} io - Socket.io Server instance
 * @param {import('socket.io').Socket} socket - Connecting Socket instance
 */
export function registerTaskEvents(io, socket) {
  /**
   * Securely join a team room.
   * Client emits 'join:team' with { teamId } when opening a team workspace.
   */
  socket.on('join:team', async ({ teamId }, callback) => {
    try {
      if (!teamId) {
        if (callback) callback({ success: false, message: 'Team ID is required' });
        return;
      }

      // Verify the authenticated socket user belongs to this team
      const member = await TeamMember.findOne({
        where: { team_id: teamId, user_id: socket.user.id },
      });

      if (!member && !socket.user.is_admin) {
        logger.warn(`⚠️ WebSocket: Unauthorized join attempt to Team Room ${teamId} by User ${socket.user.id}`);
        if (callback) callback({ success: false, message: 'Access denied: You are not a member of this team' });
        return;
      }

      const roomName = `team:${teamId}`;
      socket.join(roomName);
      
      logger.debug(`🔌 WebSocket: User ${socket.user.name} joined Team Room: ${roomName}`);
      
      if (callback) callback({ success: true, message: `Joined room successfully` });
    } catch (error) {
      logger.error('WebSocket join:team error:', error.message);
      if (callback) callback({ success: false, message: 'Internal server error joining room' });
    }
  });

  /**
   * Leave a team room.
   * Client emits 'leave:team' with { teamId } when navigating away from a workspace.
   */
  socket.on('leave:team', ({ teamId }) => {
    if (!teamId) return;
    const roomName = `team:${teamId}`;
    socket.leave(roomName);
    logger.debug(`🔌 WebSocket: User ${socket.user.name} left Team Room: ${roomName}`);
  });
}

export default registerTaskEvents;
