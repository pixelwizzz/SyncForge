import { Sequelize } from 'sequelize';
import env from './env.js';
import logger from '../utils/logger.js';

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),

  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },

  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },

  dialectOptions: {
    ...(env.NODE_ENV === 'production' && {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }),
  },
});

/**
 * Test the database connection and log status.
 * Called once during server startup.
 */
export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    if (env.NODE_ENV === 'development') {
      logger.info(`   Database: ${env.DB_NAME} @ ${env.DB_HOST}:${env.DB_PORT}`);
    }
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Sync models in development (auto-create tables).
 * In production, use migrations instead.
 */
export async function syncDatabase() {
  if (env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true });
    logger.info('✅ Database models synced (dev mode)');
  }
}

export default sequelize;
