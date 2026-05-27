# SyncForge — System Design Document

> **Version:** 1.0  
> **Type:** Backend Platform — Real-Time Collaborative Task Management  
> **Architecture Style:** Modular Monolith (Docker-Containerized)

---

## Table of Contents

1. [Finalized Requirements](#1-finalized-requirements)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Request Lifecycle](#3-request-lifecycle)
4. [Database Schema & Relationships](#4-database-schema--relationships)
5. [Authentication Flow](#5-authentication-flow)
6. [Real-Time Architecture (WebSockets)](#6-real-time-architecture-websockets)
7. [Caching Strategy (Redis)](#7-caching-strategy-redis)
8. [File Upload Pipeline](#8-file-upload-pipeline)
9. [API Design Map](#9-api-design-map)
10. [Folder Structure](#10-folder-structure)
11. [Docker & Infrastructure](#11-docker--infrastructure)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Security Layers](#13-security-layers)
14. [Non-Functional Requirements — Finalized](#14-non-functional-requirements--finalized)
15. [Milestone Plan](#15-milestone-plan)

---

## 1. Finalized Requirements

### 1.1 Functional Requirements

| #     | Requirement                              | Priority    | Notes                        |
|-------|------------------------------------------|-------------|------------------------------|
| FR-01 | User registration & login via Clerk      | Must Have   | Clerk frontend SDK           |
| FR-02 | Session-based auth via Clerk JWTs        | Must Have   | @clerk/express middleware    |
| FR-03 | Create, Read, Update, Delete tasks       | Must Have   | With validation              |
| FR-04 | Task assignment to team members          | Must Have   | FK to users table            |
| FR-05 | Task status tracking                     | Must Have   | todo / in-progress / done    |
| FR-06 | Task priority levels                     | Must Have   | low / medium / high / urgent |
| FR-07 | Due dates on tasks                       | Must Have   | Date field                   |
| FR-08 | Create teams and invite members          | Must Have   | Role-based                   |
| FR-09 | Team roles: Owner, Admin, Member         | Must Have   | RBAC middleware              |
| FR-10 | Real-time task updates via WebSockets    | Must Have   | Socket.io rooms              |
| FR-11 | Presence system (online/offline/typing)  | Must Have   | Redis presence tracking      |
| FR-12 | File attachments on tasks                | Must Have   | Multer + local/cloud         |
| FR-13 | Search, filter, sort, paginate tasks     | Must Have   | Query params                 |
| FR-14 | Rate limiting on all API routes          | Must Have   | Redis-backed                 |
| FR-15 | Health check endpoint                    | Must Have   | Docker + monitoring          |
| FR-16 | Email notifications on task assignment   | Should Have | Stretch — Week 6             |
| FR-17 | Activity logs / audit trail              | Should Have | Stretch                      |
| FR-18 | Swagger/OpenAPI documentation            | Must Have   | Week 6                       |

### 1.2 Non-Functional Requirements (Finalized)

| Category    | Requirement          | Target                            |
|-------------|----------------------|-----------------------------------|
| Performance | REST API response    | < 300ms (p95)                     |
| Performance | WebSocket latency    | < 100ms                           |
| Security    | Auth mechanism       | Clerk-issued JWTs (RS256)         |
| Security    | Password storage     | Managed by Clerk (external)       |
| Security    | Rate limiting        | 100 req/min per IP                |
| Scalability | Caching layer        | Redis for hot reads               |
| Scalability | Stateless API design | No server-side sessions           |
| Reliability | Error handling       | Centralized error middleware      |
| Reliability | Logging              | Morgan (HTTP) + Winston (app)     |
| DevOps      | Containerization     | Full Docker Compose stack         |
| DevOps      | CI                   | GitHub Actions on PR/push         |
| Observability | Health check       | GET /health endpoint              |

### 1.3 Out of Scope (MVP)

- Kubernetes / microservices migration
- Kafka/RabbitMQ event bus
- GraphQL layer
- Mobile clients
- AI task suggestions
- Prometheus/Grafana (stretch only)

---

## 2. High-Level Architecture

```
  ┌─────────────────────────────────────────────────────┐
  │                      CLIENTS                        │
  │                                                     │
  │   ┌─────────────┐  ┌────────────┐  ┌────────────┐  │
  │   │ Web Browser │  │ Mobile App │  │ API Client │  │
  └───┴──────┬──────┴──┴─────┬──────┴──┴─────┬──────┴──┘
             │  HTTP / WS    │               │
             └───────────────┼───────────────┘
                             │
                    ┌────────▼────────┐
                    │      NGINX      │
                    │ Reverse Proxy   │
                    │  Port 80/443    │
                    └────────┬────────┘
                             │
  ┌──────────────────────────▼──────────────────────────┐
  │              APPLICATION SERVER (Node.js)           │
  │                                                     │
  │  ┌──────────────────────────────────────────────┐   │
  │  │  Middleware Stack                            │   │
  │  │  Helmet · CORS · Morgan · Rate Limiter       │   │
  │  └──────────────────────────────────────────────┘   │
  │                         │                           │
  │          ┌──────────────┴─────────────┐             │
  │          │                            │             │
  │  ┌───────▼────────┐        ┌──────────▼──────────┐  │
  │  │  REST API       │        │   Socket.io Server  │  │
  │  │  /auth /tasks   │        │   Real-Time Events  │  │
  │  │  /teams /users  │        │                     │  │
  │  └───────┬────────┘        └──────────┬──────────┘  │
  │          │                            │             │
  │          └──────────────┬─────────────┘             │
  │                         │                           │
  │  ┌──────────────────────▼──────────────────────┐    │
  │  │         Business Logic Layer                │    │
  │  │         Services / Controllers              │    │
  │  └──────────────────────┬──────────────────────┘    │
  └─────────────────────────┼───────────────────────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
    ┌────────▼───────┐  ┌───▼────────┐  ┌─▼──────────────┐
    │  PostgreSQL    │  │   Redis    │  │  File Storage   │
    │  Primary DB    │  │  Cache +   │  │  Local / S3     │
    │                │  │  Presence  │  │                 │
    └────────────────┘  └────────────┘  └────────────────┘
```

---

## 3. Request Lifecycle

### 3.1 REST API Request Flow

```
  Client          NGINX         Middleware        Router / Auth       Service            Redis / DB
    │               │               │                  │                 │                   │
    │── HTTP Req ──►│               │                  │                 │                   │
    │               │── forward ───►│                  │                 │                   │
    │               │               │                  │                 │                   │
    │               │               ├─ Helmet headers  │                 │                   │
    │               │               ├─ CORS check      │                 │                   │
    │               │               ├─ Rate limit chk ─┤                 │                   │
    │               │               ├─ Morgan log      │                 │                   │
    │               │               │── route ────────►│                 │                   │
    │               │               │                  ├─ verify JWT     │                   │
    │               │               │                  ├─ RBAC check     │                   │
    │               │               │                  │── call ────────►│                   │
    │               │               │                  │                 │                   │
    │               │               │                  │                 ├── GET cache ──────►│
    │               │               │                  │    [HIT]        │◄── cached JSON ───│
    │               │               │                  │                 │                   │
    │               │               │                  │    [MISS]       ├── query DB ───────►│
    │               │               │                  │                 │◄── rows ──────────│
    │               │               │                  │                 ├── SET cache ──────►│
    │               │               │                  │                 │                   │
    │◄── JSON ◄─────┴───────────────┴──────────────────┴─────────────────┘                   │
    │  (< 300ms)                                                                              │
```

### 3.2 WebSocket Connection Flow

```
  Client           Socket.io         JWT Auth        Redis Presence      Socket Room       Other Clients
    │                  │                 │                  │                 │                  │
    │── connect ──────►│                 │                  │                 │                  │
    │   + JWT token    │── verify ──────►│                  │                 │                  │
    │                  │◄── user payload─┤                  │                 │                  │
    │                  │── SET online ──────────────────────►│                 │                  │
    │                  │── join room ─────────────────────────────────────────►│                  │
    │                  │── user:online ────────────────────────────────────────────────────────►│
    │                  │                 │                  │                 │                  │
    │── task:update ──►│                 │                  │                 │                  │
    │                  │── broadcast ─────────────────────────────────────────►│                  │
    │                  │                 │                  │                 │── task:updated ──►│
    │                  │                 │                  │                 │                  │
    │── disconnect ───►│                 │                  │                 │                  │
    │                  │── DEL online ──────────────────────►│                 │                  │
    │                  │── user:offline ───────────────────────────────────────────────────────►│
```

---

## 4. Database Schema & Relationships

### 4.1 Entity Relationship Diagram

```
  ┌─────────────────────┐          ┌──────────────────────┐
  │        USERS        │          │        TEAMS         │
  ├─────────────────────┤          ├──────────────────────┤
  │ id          UUID PK │◄─────────│ owner_id    UUID  FK │
  │ clerk_id    STRING  │ UNIQUE   │ id          UUID  PK │
  │ name        STRING  │          │ name        STRING   │
  │ email       STRING  │ UNIQUE   │ invite_code STRING   │
  │ avatar_url  STRING  │          │ created_at  TIMESTAMP│
  │ created_at  TIMESTAMP          └──────────┬───────────┘
  │ updated_at  TIMESTAMP                     │
  └──────┬──────────────┘                     │ has many
         │                                    │
         │ belongs to many          ┌──────────▼───────────┐
         │                          │     TEAM_MEMBERS     │
         └─────────────────────────►├──────────────────────┤
                                    │ id       UUID    PK  │
                                    │ team_id  UUID    FK  │
                                    │ user_id  UUID    FK  │
                                    │ role     ENUM        │
                                    │          owner/admin │
                                    │          /member     │
                                    │ joined_at TIMESTAMP  │
                                    └──────────────────────┘

  ┌─────────────────────┐          ┌──────────────────────┐
  │        TASKS        │          │     ATTACHMENTS      │
  ├─────────────────────┤          ├──────────────────────┤
  │ id          UUID PK │◄─────────│ task_id     UUID  FK │
  │ title       STRING  │   has    │ id          UUID  PK │
  │ description TEXT    │   many   │ uploaded_by UUID  FK │
  │ status      ENUM    │          │ file_name   STRING   │
  │  todo/in_progress   │          │ file_url    STRING   │
  │  in_review/done     │          │ mime_type   STRING   │
  │ priority    ENUM    │          │ file_size   INTEGER  │
  │  low/med/high/urgent│          │ uploaded_at TIMESTAMP│
  │ due_date    DATE    │          └──────────────────────┘
  │ assigned_to UUID FK │
  │ created_by  UUID FK │          ┌──────────────────────┐
  │ team_id     UUID FK │          │    ACTIVITY_LOGS     │
  │ created_at  TIMESTAMP          ├──────────────────────┤
  │ updated_at  TIMESTAMP◄─────────│ task_id     UUID  FK │
  └─────────────────────┘   tracks │ id          UUID  PK │
                                    │ user_id     UUID  FK │
                                    │ action      STRING   │
                                    │ meta        JSONB    │
                                    │ created_at  TIMESTAMP│
                                    └──────────────────────┘

  NOTE: REFRESH_TOKENS table has been REMOVED.
  Authentication tokens are fully managed by Clerk.
```

### 4.2 Technology Decision: PostgreSQL

| Criteria                          | PostgreSQL | MongoDB       |
|-----------------------------------|------------|---------------|
| Relational data (users/teams)     | ✅ Native   | ❌ Expensive joins |
| ACID transactions                 | ✅ Full     | ⚠️ Limited    |
| Schema enforcement                | ✅ Strict   | ❌ Schema-less |
| UUID support                      | ✅ Built-in | ✅            |
| JSONB (activity meta)             | ✅ Supported| ✅ Native     |

---

## 5. Authentication Flow (Clerk API)

### 5.1 Registration & Login (Clerk-Managed)

```
  Registration and Login are handled ENTIRELY by Clerk's frontend SDK.
  The backend NEVER sees passwords or manages sessions directly.

  ┌──────────────────────────────────────────────────────────────┐
  │                    CLERK FRONTEND SDK                        │
  │                                                              │
  │   User signs up / logs in via Clerk's UI components          │
  │   (email+password, Google OAuth, GitHub, etc.)               │
  │                                                              │
  │   Clerk issues a session JWT → stored in cookies             │
  │   JWT is automatically attached to all API requests          │
  └──────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                    CLERK WEBHOOKS                            │
  │                                                              │
  │   On user.created / user.updated / user.deleted:             │
  │   Clerk sends POST to /webhooks/clerk                        │
  │                                                              │
  │   Backend verifies signature (svix) → upserts users table    │
  │   Fields synced: clerk_id, name, email, avatar_url           │
  └──────────────────────────────────────────────────────────────┘
```

### 5.2 Route Protection Middleware (Clerk)

```
  Incoming Request
         │
         ▼
  ┌──────────────────────┐
  │ clerkMiddleware()    │  ← @clerk/express global middleware
  │ Parses session JWT   │     Attaches auth object to request
  │ from cookie/header   │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ requireAuth()        │──── NO SESSION ─────────► 401 Unauthorized
  │ (on protected routes)│
  └──────────┬───────────┘
             │ AUTHENTICATED
             ▼
  ┌──────────────────────┐
  │ req.auth.userId      │  ← Clerk user ID (e.g. "user_2abc...")
  │ Lookup DB user by    │
  │ clerk_id → attach    │
  │ req.dbUser            │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │ Role check required? │──── NO ────────────────► next() → Controller
  └──────────┬───────────┘
             │ YES
             ▼
  ┌──────────────────────┐
  │ Check team_members   │──── NO ────────────────► 403 Forbidden
  │ for required role    │
  └──────────┬───────────┘
             │ YES
             ▼
           next()
        → Controller
```

---

## 6. Real-Time Architecture (WebSockets)

### 6.1 Socket.io Room Strategy

```
  /syncforge  (Namespace)
  │
  ├── Room: team:team-uuid-1
  │     ├── Socket — User A
  │     ├── Socket — User B
  │     └── Socket — User C
  │
  ├── Room: team:team-uuid-2
  │     ├── Socket — User D
  │     └── Socket — User E
  │
  └── Room: user:user-uuid-A  (private, notifications)
        └── Socket — User A


  task:updated event ──► broadcast to team:team-uuid-1
                               ├── User A receives
                               ├── User B receives
                               └── User C receives
```

### 6.2 Event Catalog

```
  CLIENT ──────────────────────────────────────► SERVER
  ─────────────────────────────────────────────────────
  task:create          { title, teamId, ... }
  task:update          { taskId, changes }
  task:delete          { taskId }
  user:typing          { taskId, teamId }
  user:stopTyping      { taskId, teamId }


  SERVER ──────────────────────────────────────► ROOM
  ─────────────────────────────────────────────────────
  task:created         { task object }
  task:updated         { taskId, changes }
  task:deleted         { taskId }
  user:online          { userId, name }
  user:offline         { userId }
  user:typing          { userId, taskId }
  notification:new     { message, type }
```

### 6.3 Presence System

```
  Client              Socket.io            Redis
    │                     │                  │
    │── connect ─────────►│                  │
    │                     │── SADD presence:team:{id} userId ──►│
    │                     │── SET user:{id}:status "online"     │
    │                     │   TTL 30s                           │
    │◄── room:members ────│◄─ online user list ─────────────────│
    │                     │                  │
    │   every 20 seconds  │                  │
    │── ping ────────────►│                  │
    │                     │── EXPIRE user:{id}:status 30s ─────►│
    │                     │                  │
    │── disconnect ───────►│                  │
    │                     │── SREM presence:team:{id} userId ──►│
    │                     │── DEL user:{id}:status ────────────►│
    │                     │── emit user:offline to room         │
```

---

## 7. Caching Strategy (Redis)

### 7.1 Cache Read Flow

```
  API Request
       │
       ▼
  ┌────────────────────────┐
  │  Build cache key       │
  │  e.g. tasks:team:123   │
  │       :page:1          │
  └────────────┬───────────┘
               │
               ▼
  ┌────────────────────────┐
  │  Redis GET key         │
  └────────────┬───────────┘
               │
       ┌───────┴────────┐
       │ HIT            │ MISS
       ▼                ▼
  ┌─────────┐    ┌──────────────────┐
  │ Return  │    │ Query PostgreSQL  │
  │ cached  │    └────────┬─────────┘
  │ JSON    │             │
  └─────────┘             ▼
                  ┌──────────────────┐
                  │ Redis SET key    │
                  │ value = JSON     │
                  │ TTL = 5 min      │
                  └────────┬─────────┘
                           │
                           ▼
                     Return result


  INVALIDATION TRIGGERS
  ──────────────────────────────────────────────────────
  POST   /tasks            →  DEL  tasks:team:{teamId}:*
  PUT    /tasks/:id        →  DEL  task:{taskId}
  DELETE /tasks/:id        →  DEL  task:{taskId}
  Team member change       →  DEL  team:{teamId}:*
```

### 7.2 Redis Key Schema

| Key Pattern                       | Type    | TTL    | Purpose                  |
|-----------------------------------|---------|--------|--------------------------|
| `tasks:team:{id}:page:{n}`        | String  | 5 min  | Paginated task list      |
| `task:{taskId}`                   | String  | 10 min | Single task              |
| `team:{teamId}:members`           | String  | 15 min | Team member list         |
| `user:{userId}`                   | String  | 30 min | User profile             |
| `ratelimit:{ip}`                  | Counter | 60 sec | Rate limit window        |
| `presence:team:{teamId}`          | Set     | —      | Online users in team     |
| `user:{userId}:status`            | String  | 30 sec | Heartbeat presence       |

### 7.3 Rate Limiting

```
  Request arrives from IP
         │
         ▼
  ┌────────────────────────────┐
  │ INCR ratelimit:{ip}        │
  │ (auto-expires after 60s)   │
  └─────────────┬──────────────┘
                │
        ┌───────┴────────────┐
        │ count > 100?        │
        └───────┬─────────────┘
                │
       NO ──────┴────── YES
        │                │
        ▼                ▼
  ┌──────────┐   ┌────────────────────────┐
  │ Allow    │   │ 429 Too Many Requests  │
  │ request  │   │ Retry-After: 60s       │
  └──────────┘   └────────────────────────┘
```

---

## 8. File Upload Pipeline

```
  Client: POST /tasks/:id/upload
  multipart/form-data
         │
         ▼
  ┌─────────────────────┐
  │   Multer Middleware  │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  File type allowed? │── NO (not jpg/png/pdf/docx) ──► 400 Bad Request
  └──────────┬──────────┘
             │ YES
             ▼
  ┌─────────────────────┐
  │  File size < 10MB?  │── NO ─────────────────────────► 413 Too Large
  └──────────┬──────────┘
             │ YES
             ▼
  ┌─────────────────────┐
  │  Sanitize filename  │
  │  rename → UUID.ext  │
  └──────────┬──────────┘
             │
      ┌──────┴──────┐
      │ Environment │
      └──────┬──────┘
             │
     DEV ────┴──── PROD
      │               │
      ▼               ▼
  ┌────────┐    ┌────────────┐
  │ Local  │    │  S3-compat │
  │ Disk   │    │  Storage   │
  └───┬────┘    └─────┬──────┘
      └────────┬───────┘
               ▼
  ┌─────────────────────────┐
  │ Save metadata to DB     │
  │ attachments table       │
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Write activity log      │
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Emit task:updated       │
  │ via Socket.io room      │
  └──────────┬──────────────┘
             │
             ▼
       200 OK — attachment object
```

---

## 9. API Design Map

### 9.1 Endpoint Overview

```
  /auth  (protected — Clerk session required)
  └── GET    /me               get current user from DB  [protected]

  /webhooks  (public — verified via svix signature)
  └── POST   /clerk            Clerk webhook receiver

  /tasks  (protected)
  ├── GET    /                 list tasks (search · filter · page · sort)
  ├── POST   /                 create task
  ├── GET    /:id              get single task
  ├── PUT    /:id              update task
  ├── DELETE /:id              delete task
  ├── POST   /:id/upload       attach file
  └── GET    /:id/attachments  list attachments

  /teams  (protected)
  ├── POST   /                 create team
  ├── GET    /:id              get team details
  ├── POST   /:id/invite       invite member by email
  ├── GET    /:id/tasks        get all tasks for team
  ├── PUT    /:id/members/:uid change member role
  └── DELETE /:id/members/:uid remove member

  /users  (protected)
  ├── GET    /:id              get user profile
  ├── PUT    /:id              update profile
  └── PUT    /:id/avatar       upload avatar

  /system  (public)
  ├── GET    /health           service health check
  └── GET    /docs             Swagger UI
```

### 9.2 Standard Response Envelope

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  },
  "error": null
}
```

Error shape:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "title is required",
    "details": []
  }
}
```

---

## 10. Folder Structure

```
syncforge/
│
├── src/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   └── auth.validator.js
│   │
│   ├── users/
│   │   ├── user.controller.js
│   │   ├── user.service.js
│   │   ├── user.routes.js
│   │   └── user.model.js
│   │
│   ├── tasks/
│   │   ├── task.controller.js
│   │   ├── task.service.js
│   │   ├── task.routes.js
│   │   ├── task.model.js
│   │   └── task.validator.js
│   │
│   ├── teams/
│   │   ├── team.controller.js
│   │   ├── team.service.js
│   │   ├── team.routes.js
│   │   └── team.model.js
│   │
│   ├── sockets/
│   │   ├── socket.init.js         ← Socket.io server setup
│   │   ├── socket.auth.js         ← JWT handshake middleware
│   │   ├── task.events.js         ← Task event handlers
│   │   └── presence.events.js     ← Online/offline/typing
│   │
│   ├── middleware/
│   │   ├── authenticate.js        ← JWT verify middleware
│   │   ├── authorize.js           ← RBAC role check
│   │   ├── rateLimiter.js         ← Redis rate limit
│   │   ├── errorHandler.js        ← Global error handler
│   │   └── validate.js            ← Joi/Zod validator wrapper
│   │
│   ├── uploads/
│   │   ├── multer.config.js       ← File filter + limits
│   │   └── upload.service.js      ← Storage abstraction
│   │
│   ├── redis/
│   │   ├── redis.client.js        ← IORedis singleton
│   │   ├── cache.service.js       ← get/set/invalidate helpers
│   │   └── presence.service.js    ← Online user tracking
│   │
│   ├── config/
│   │   ├── database.js            ← Sequelize/TypeORM config
│   │   ├── env.js                 ← Validated env vars (zod)
│   │   └── swagger.js             ← OpenAPI setup
│   │
│   ├── utils/
│   │   ├── logger.js              ← Winston logger
│   │   ├── jwt.js                 ← Sign/verify helpers
│   │   ├── paginate.js            ← Pagination helper
│   │   └── apiResponse.js         ← Standard response builder
│   │
│   └── app.js                     ← Express app setup
│
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.js
│   │   ├── task.service.test.js
│   │   └── jwt.util.test.js
│   └── integration/
│       ├── auth.api.test.js
│       ├── tasks.api.test.js
│       └── teams.api.test.js
│
├── migrations/                    ← DB migrations
├── seeders/                       ← Dev seed data
├── uploads/                       ← Local file storage (dev)
├── logs/                          ← Winston log files
│
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── package.json
└── README.md
```

---

## 11. Docker & Infrastructure

### 11.1 Container Architecture

```
  ┌─────────────────────────────────────────────────────────┐
  │                   docker-compose.yml                    │
  │                                                         │
  │  ┌───────────────────┐     ┌───────────────────────┐   │
  │  │  nginx container  │     │    api container       │   │
  │  │  nginx:alpine     │────►│    Node.js 20 Alpine   │   │
  │  │  Port: 80/443     │     │    Express + Socket.io │   │
  │  └───────────────────┘     │    Port: 3000          │   │
  │                            └──────────┬────────────┘   │
  │                                       │                 │
  │                  ┌────────────────────┴──────────┐      │
  │                  │                               │      │
  │  ┌───────────────▼────────┐   ┌─────────────────▼───┐  │
  │  │   postgres container   │   │   redis container   │  │
  │  │   postgres:15-alpine   │   │   redis:7-alpine    │  │
  │  │   Port: 5432           │   │   Port: 6379        │  │
  │  │   Volume: pgdata       │   │   Volume: redisdata │  │
  │  └────────────────────────┘   └─────────────────────┘  │
  │                                                         │
  │  Network: syncforge_network (bridge)                    │
  └─────────────────────────────────────────────────────────┘
```

### 11.2 docker-compose.yml Outline

```yaml
# Services: api, postgres, redis, nginx
# Networks: syncforge_network (bridge)
# Volumes: pgdata, redisdata, uploads_data

api:
  build: .
  depends_on: [postgres, redis]
  environment: [NODE_ENV, DB_URL, REDIS_URL, JWT_SECRET]
  volumes: [./uploads:/app/uploads]

postgres:
  image: postgres:15-alpine
  volumes: [pgdata:/var/lib/postgresql/data]

redis:
  image: redis:7-alpine
  volumes: [redisdata:/data]

nginx:
  image: nginx:alpine
  ports: ["80:80"]
  depends_on: [api]
```

---

## 12. CI/CD Pipeline

```
  TRIGGER
  ────────────────────────────────────────────────────────
  Pull Request → main               Push → main branch
         │                                   │
         └──────────────┬────────────────────┘
                        │
                        ▼
  ┌─────────────────────────────────────────────────────┐
  │             CONTINUOUS INTEGRATION                  │
  │                  GitHub Actions                     │
  │                                                     │
  │  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
  │  │ Checkout │─►│ npm ci    │─►│  ESLint Check    │  │
  │  │ Code     │  │ install   │  │                  │  │
  │  └──────────┘  └───────────┘  └────────┬─────────┘  │
  │                                         │            │
  │  ┌──────────────┐  ┌──────────────────┐ │            │
  │  │ Build Docker │◄─│ Integration Tests│◄┘            │
  │  │ Image        │  │ Supertest        │              │
  │  └──────┬───────┘  └──────────────────┘              │
  └─────────┼───────────────────────────────────────────┘
            │  (on main branch only)
            ▼
  ┌─────────────────────────────────────────────────────┐
  │             CONTINUOUS DEPLOYMENT                   │
  │                  GitHub Actions                     │
  │                                                     │
  │  ┌─────────────┐  ┌────────────────┐  ┌──────────┐  │
  │  │ Tag image   │─►│ Push to        │─►│ Deploy   │  │
  │  │ commit SHA  │  │ Container Reg  │  │ to Host  │  │
  │  └─────────────┘  └────────────────┘  └────┬─────┘  │
  │                                             │        │
  │                                    ┌────────▼──────┐ │
  │                                    │ GET /health   │ │
  │                                    │ expect 200 ✓  │ │
  │                                    └───────────────┘ │
  └─────────────────────────────────────────────────────┘
```

---

## 13. Security Layers

```
  Incoming Request
         │
         ▼
  ╔═════════════════════════════════╗
  ║  LAYER 1 — NETWORK              ║
  ║  NGINX                          ║
  ║  · TLS termination (HTTPS)      ║
  ║  · IP-level blocking            ║
  ╚══════════════════╤══════════════╝
                     │
                     ▼
  ╔═════════════════════════════════╗
  ║  LAYER 2 — HTTP MIDDLEWARE      ║
  ║  · Helmet.js                    ║
  ║    CSP · HSTS · X-Frame-Options ║
  ║  · CORS — whitelist origins     ║
  ║  · Rate Limiter (Redis)         ║
  ║    100 req / min / IP           ║
  ╚══════════════════╤══════════════╝
                     │
                     ▼
  ╔═════════════════════════════════╗
  ║  LAYER 3 — AUTHENTICATION       ║
  ║  · Clerk JWT verify (RS256)     ║
  ║  · @clerk/express middleware    ║
  ║  · RBAC role check (team-scoped)║
  ╚══════════════════╤══════════════╝
                     │
                     ▼
  ╔═════════════════════════════════╗
  ║  LAYER 4 — INPUT VALIDATION     ║
  ║  · Joi / Zod schema validation  ║
  ║  · Sanitize all inputs          ║
  ║  · Prevent XSS injection        ║
  ╚══════════════════╤══════════════╝
                     │
                     ▼
  ╔═════════════════════════════════╗
  ║  LAYER 5 — DATA LAYER           ║
  ║  · Sequelize parameterized SQL  ║
  ║  · Passwords managed by Clerk   ║
  ║  · Secrets in .env only         ║
  ╚═════════════════════════════════╝


  SECURITY CHECKLIST
  ──────────────────────────────────────────────────────────
  SQL Injection        Sequelize parameterized queries
  XSS                  Helmet CSP + input sanitization
  Brute Force          Redis rate limiting + lockout
  Token Theft          15m access token + HttpOnly refresh
  File Upload Abuse    Mime check + 10MB cap + UUID rename
  Data Exposure        No passwords in response bodies
  CORS Abuse           Whitelist allowed origins only
  Header Injection     Helmet.js full config
```

---

## 14. Non-Functional Requirements — Finalized

### 14.1 Performance SLOs

```
  ┌─────────────────────────────────────────────────┐
  │               PERFORMANCE TARGETS               │
  ├─────────────────────────────┬───────────────────┤
  │  REST API response (p95)    │   < 300 ms        │
  │  WebSocket event latency    │   < 100 ms        │
  │  PostgreSQL query           │   < 50 ms         │
  │  Redis read                 │   < 5 ms          │
  │  File upload (10 MB)        │   < 2 s           │
  └─────────────────────────────┴───────────────────┘
```

### 14.2 Indexes to Define

| Table          | Index Column(s)      | Reason                   |
|----------------|----------------------|--------------------------|
| tasks          | `team_id`            | Filter tasks by team     |
| tasks          | `assigned_to`        | Filter by assignee       |
| tasks          | `status, priority`   | Composite filter         |
| tasks          | `due_date`           | Sort by deadline         |
| team_members   | `user_id, team_id`   | Membership lookup        |
| activity_logs  | `task_id, created_at`| Timeline queries         |

---

## 15. Milestone Plan

```
  WEEK 1  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ├── Project setup & config
  ├── PostgreSQL + Redis in Docker Compose
  └── Auth system: register / login / JWT

  WEEK 2  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ├── Task CRUD APIs
  ├── Validation + centralized error handling
  └── Unit tests — auth & task services

  WEEK 3  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ├── Socket.io server setup + JWT handshake
  ├── Real-time task events (create/update/delete)
  └── Presence system — online/offline/typing

  WEEK 4  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ├── File uploads with Multer
  ├── Redis caching layer + invalidation
  └── Search, filter, sort, pagination

  WEEK 5  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ├── Dockerize full stack (api + db + redis + nginx)
  ├── GitHub Actions CI pipeline
  └── Integration tests with Supertest

  WEEK 6  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ├── Security hardening (Helmet, CORS, rate limit)
  ├── Swagger / OpenAPI documentation
  └── Deploy + health check endpoint live
```

---

## Summary

SyncForge is designed as a **production-grade modular monolith** that demonstrates the full spectrum of backend engineering:

| Layer             | Technology                              |
|-------------------|-----------------------------------------|
| Runtime           | Node.js 20 + Express.js                 |
| Database          | PostgreSQL 15 + Sequelize ORM           |
| Cache             | Redis 7 (cache + rate limit + presence) |
| Real-Time         | Socket.io (namespaced rooms)            |
| Auth              | Clerk API (@clerk/express + webhooks)   |
| File Uploads      | Multer (local dev / S3 prod)            |
| Containerization  | Docker + Docker Compose                 |
| CI/CD             | GitHub Actions                          |
| Docs              | Swagger / OpenAPI                       |
| Logging           | Morgan (HTTP) + Winston (app)           |

> The architecture is intentionally scoped to avoid over-engineering while still demonstrating every concept a backend engineer is expected to know at a junior-to-mid level.
