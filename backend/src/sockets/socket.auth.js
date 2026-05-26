import { clerkClient } from '@clerk/express';
import { findUserByClerkId } from '../users/user.service.js';
import logger from '../utils/logger.js';

/**
 * Socket.io Handshake Authentication Middleware.
 * 1. Extracts the Clerk session token from auth.token or Authorization header.
 * 2. Cryptographically verifies the Clerk JWT.
 * 3. Resolves and attaches the local PostgreSQL user model to `socket.user`.
 */
export async function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token || 
                socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    logger.warn('🔌 WebSocket connection rejected: Missing session token');
    return next(new Error('Authentication error: Session token is required'));
  }

  try {
    // 1. Cryptographically verify Clerk session token using official SDK (stateless cached JWKS checks)
    const sessionClaims = await clerkClient.verifyToken(token);
    const clerkId = sessionClaims.sub;

    if (!clerkId) {
      logger.warn('🔌 WebSocket connection rejected: Invalid sub in token payload');
      return next(new Error('Authentication error: Invalid session credentials'));
    }

    // 2. Look up the synced user in PostgreSQL database
    const dbUser = await findUserByClerkId(clerkId);
    if (!dbUser) {
      logger.warn(`🔌 WebSocket connection rejected: Local DB user record missing for Clerk User ${clerkId}`);
      return next(new Error('Authentication error: Account record not found. Please sync.'));
    }

    // 3. Attach user database context to socket for all subsequent event handlers
    socket.user = dbUser;
    logger.debug(`🔌 WebSocket connection authenticated: ${dbUser.name} (${dbUser.email})`);
    
    next();
  } catch (error) {
    logger.error('🔌 WebSocket connection auth failure:', error.message);
    return next(new Error('Authentication error: Session token has expired or is invalid'));
  }
}

export default socketAuth;
