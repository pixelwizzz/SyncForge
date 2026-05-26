import { Server } from 'socket.io';
import env from '../config/env.js';
import socketAuth from './socket.auth.js';
import registerTaskEvents from './task.events.js';
import registerPresenceEvents from './presence.events.js';
import logger from '../utils/logger.js';

let ioInstance = null;

/**
 * Bootstraps and configures the global Socket.io WebSocket server.
 * Binds it to the existing Node.js HTTP server.
 * 
 * @param {import('http').Server} httpServer - Node HTTP server instance.
 */
export function initSocketServer(httpServer) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Standard connection heartbeat parameters
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 1. Authenticate every connection handshake using Clerk session token
  ioInstance.use(socketAuth);

  // 2. Track connection events and bind registries
  ioInstance.on('connection', (socket) => {
    logger.debug(`🔌 WebSocket: Active connection established: ${socket.id} (User: ${socket.user.name})`);

    // Bind task rooms and real-time data sync listeners
    registerTaskEvents(ioInstance, socket);

    // Bind typing states and active presence tracking listeners
    registerPresenceEvents(ioInstance, socket);
  });

  logger.info('✅ WebSocket Socket.io server initialized successfully');
  return ioInstance;
}

/**
 * Get the initialized Socket.io Server instance.
 * Allows downstream controllers or webhooks to broadcast events dynamically.
 */
export function getIo() {
  return ioInstance;
}
