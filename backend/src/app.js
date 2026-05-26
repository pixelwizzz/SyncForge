import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';
import { clerkMiddleware } from '@clerk/express';

import path from 'node:path';
import crypto from 'node:crypto';

import env from './config/env.js';
import { morganStream } from './utils/logger.js';
import { successResponse } from './utils/apiResponse.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import authRoutes from './auth/auth.routes.js';
import webhookRoutes from './webhooks/webhook.routes.js';
import taskRoutes from './tasks/task.routes.js';
import teamRoutes from './teams/team.routes.js';
import rateLimiter from './middleware/rateLimiter.js';
import uploadRoutes from './uploads/upload.routes.js';

const app = express();

// ── Trust proxy (for rate limiting behind Nginx/LB) ──
app.set('trust proxy', 1);

// ── Security Headers ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
  maxAge: 86400, // 24 hours preflight cache
}));

// ── Compression ───────────────────────────────────────
app.use(compression());

// ── HTTP Parameter Pollution Protection ───────────────
app.use(hpp());

// ── Body Parsers ──────────────────────────────────────
// NOTE: Webhook routes need raw body — they must be registered BEFORE these parsers
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── HTTP Logging ──────────────────────────────────────
app.use(morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream },
));

// ── Clerk Authentication (global) ─────────────────────
// Parses session JWT from cookies/headers, attaches req.auth
app.use(clerkMiddleware());
app.use(rateLimiter);

// ── Request ID ────────────────────────────────────────
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ══════════════════════════════════════════════════════
// ══ ROUTES ═══════════════════════════════════════════
// ══════════════════════════════════════════════════════

// ── Health Check ──────────────────────────────────────
app.get('/api/v1/system/health', (req, res) => {
  return successResponse(res, {
    data: {
      status: 'healthy',
      service: 'syncforge-api',
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
    message: 'SyncForge API is running',
  });
});

// ── API Routes ────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1', uploadRoutes);

// ── Static Asset Serving ──────────────────────────────
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ══════════════════════════════════════════════════════
// ══ ERROR HANDLING ═══════════════════════════════════
// ══════════════════════════════════════════════════════

// 404 — must be after all routes
app.use(notFound);

// Global error handler — must be last
app.use(errorHandler);

export default app;
