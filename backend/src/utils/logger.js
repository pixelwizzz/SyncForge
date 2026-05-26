import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Determine log level from env — defers to LOG_LEVEL env var,
 * falls back to sensible defaults per environment.
 */
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Human-readable format for console output.
 */
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

/**
 * Winston logger instance with dual transports:
 * - Console: colorized, human-readable (always active)
 * - File: JSON format for structured log aggregation (production)
 */
const logger = winston.createLogger({
  level,
  defaultMeta: { service: 'syncforge-api' },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    // Console — always active
    new winston.transports.Console({
      format: combine(colorize(), devFormat),
    }),

    // File — JSON structured logs
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/app.log',
      format: combine(json()),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Error-only file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],

  // Don't crash on unhandled rejections — log them
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

/**
 * Morgan stream adapter — pipes HTTP request logs through Winston.
 */
export const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
