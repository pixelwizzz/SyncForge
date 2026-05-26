# ── Stage 1: Dependencies ─────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Build ────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# ── Stage 3: Production ──────────────────────────
FROM node:20-alpine AS production

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S syncforge -u 1001

WORKDIR /app

# Copy production deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY --chown=syncforge:nodejs . .

# Create required directories
RUN mkdir -p logs uploads && chown -R syncforge:nodejs logs uploads

USER syncforge

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/system/health || exit 1

CMD ["node", "src/server.js"]
