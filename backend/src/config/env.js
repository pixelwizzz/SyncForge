import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment variable schema — validates and coerces all env vars at startup.
 * The app crashes immediately if required vars are missing or invalid.
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DB_HOST: z.string().default('postgres'),
  DB_PORT: z.coerce.number().int().default(5432),
  DB_NAME: z.string().default('syncforge'),
  DB_USER: z.string().default('syncforge_user'),
  DB_PASSWORD: z.string().default('syncforge_pass'),

  // Redis
  REDIS_URL: z.string().default('redis://redis:6379'),
  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().default(''),

  // Clerk
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().default(''),

  // CORS
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((val) => val.split(',')),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(100),

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('debug'),
  LOG_FILE: z.string().default('logs/app.log'),

  // File Uploads
  MAX_FILE_SIZE: z.coerce.number().int().default(10485760), // 10MB
  UPLOAD_DIR: z.string().default('uploads'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('╔══════════════════════════════════════════╗');
    console.error('║   ❌ Environment validation failed       ║');
    console.error('╚══════════════════════════════════════════╝');
    console.error(formatted);
    console.error('\nCheck your .env file against .env.example\n');

    process.exit(1);
  }

  return Object.freeze(result.data);
}

const env = validateEnv();

export default env;
