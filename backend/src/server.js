import http from 'node:http';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { connectDatabase, syncDatabase } from './config/database.js';
import setupAssociations from './models/associations.js';
import { initSocketServer } from './sockets/socket.init.js';

const server = http.createServer(app);

/**
 * Bootstrap the application:
 * 1. Connect to PostgreSQL
 * 2. Sync models (dev only)
 * 3. Start HTTP server
 */
async function bootstrap() {
  try {
    // ── Setup Model Associations ──────────────────
    setupAssociations();

    // ── Database ──────────────────────────────────
    await connectDatabase();
    await syncDatabase();

    // ── Socket.io (Phase 4) ──────────────────────
    initSocketServer(server);

    // ── Start Listening ──────────────────────────
    server.listen(env.PORT, () => {
      logger.info('╔══════════════════════════════════════════╗');
      logger.info('║       🔧 SyncForge API Server            ║');
      logger.info('╚══════════════════════════════════════════╝');
      logger.info(`   Environment : ${env.NODE_ENV}`);
      logger.info(`   Port        : ${env.PORT}`);
      logger.info(`   API Version : ${env.API_VERSION}`);
      logger.info(`   Health      : http://localhost:${env.PORT}/api/v1/system/health`);
      logger.info('──────────────────────────────────────────────');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ── Graceful Shutdown ─────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`\n${signal} received — shutting down gracefully...`);

  server.close(async () => {
    logger.info('   HTTP server closed');

    // Close database pool
    try {
      const { default: sequelize } = await import('./config/database.js');
      await sequelize.close();
      logger.info('   PostgreSQL disconnected');
    } catch (err) {
      logger.error('   Error closing database:', err.message);
    }

    // Close Redis (Phase 4)
    // try {
    //   await redisClient.quit();
    //   logger.info('   Redis disconnected');
    // } catch (err) {
    //   logger.error('   Error closing Redis:', err.message);
    // }

    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  });

  // Force kill after 10 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown — timeout exceeded');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Unhandled errors ──────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────
bootstrap();

export default server;
