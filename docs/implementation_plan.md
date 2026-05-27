# SyncForge Implementation Plan

## Goal Description
Build SyncForge, a real-time collaborative task management backend platform, using Node.js, Express, PostgreSQL, Redis, Socket.io, and Docker. **Authentication is handled by Clerk API** — eliminating custom password hashing, JWT generation, and refresh token management. The project is a portfolio-grade backend system demonstrating modern engineering concepts such as REST APIs, delegated authentication, real-time communication, caching, file uploads, and a multi-cloud distributed deployment with load balancing.

## User Review Required
> [!IMPORTANT]
> **Deployment Architecture:** Deploying the API across three different platforms requires a central, managed Database and Redis instance so that all API servers share the same state. Local Docker databases won't work for distributed production. 
> **Manual Steps:** Please review the manual steps required to set up the free tier infrastructure (Neon/Supabase for PostgreSQL, Upstash for Redis, and the hosting accounts).

## Open Questions
> [!WARNING]
> 1. **Hosting Platforms:** Hugging Face Spaces is primarily used for ML models and Streamlit/Gradio apps. For a Node.js/Docker backend, **Koyeb** or **Fly.io** are much better free alternatives. I've suggested Koyeb in the plan instead of Hugging Face Spaces. Are you okay with this?
> 2. **Load Balancing:** True multi-origin load balancers (like Cloudflare Load Balancing or AWS Route53) often require a paid tier. As a free alternative, we can use **DNS Round Robin** (adding multiple A/CNAME records to your domain) or a free Cloudflare proxy. Do you have a domain name ready to configure this?
> 3. **Centralized Data:** Since the app will be load-balanced across 3 servers, we need a centralized managed database (e.g., Neon.tech for PostgreSQL) and Redis (e.g., Upstash). Is it acceptable to use these free third-party managed services instead of deploying databases on the free web servers?

---

## Proposed Changes

### Phase 1: Project Setup & Core Infrastructure ✅ COMPLETE
**Concept:** Establish the foundation of the modular monolith and local development environment.
#### Automated Tasks (AI) — Done
- Initialized Node.js project with ES modules and `package.json`.
- Set up core dependencies (Express, Sequelize/pg, cors, helmet, dotenv, winston, morgan, zod, @clerk/express, svix).
- Created folder structure (`src/config`, `src/middleware`, `src/utils`).
- Implemented `docker-compose.yml`, `docker-compose.dev.yml`, and `Dockerfile` for local development.
- Created `nginx/nginx.conf` with WebSocket upgrade support.
- Configured Winston for application logging and Morgan for HTTP requests.
- Implemented Zod-based environment variable validation (`src/config/env.js`).
- Created standard API response envelope (`src/utils/apiResponse.js`).
- Built Express app with full middleware stack including Clerk middleware (`src/app.js`).
- Built server entry point with graceful shutdown (`src/server.js`).

#### Manual Tasks (User)
- Install Docker Desktop.
- Create a `.env` file with local database/Redis credentials (template provided).
- Set up Clerk project at https://dashboard.clerk.com and add keys to `.env`.
- Run `docker-compose up` to start the local stack.

---

### Phase 2: Clerk Authentication & User Sync
**Concept:** Integrate Clerk for delegated authentication. Sync users to PostgreSQL via webhooks. Protect routes with Clerk middleware + RBAC.
#### Automated Tasks (AI)
- Create PostgreSQL `Users` model with `clerk_id` column (no password_hash).
- Build Clerk webhook handler (`POST /webhooks/clerk`) with svix signature verification.
- Implement `authenticate.js` middleware (requireAuth + DB user lookup).
- Implement `authorize.js` RBAC middleware (team-scoped roles).
- Develop `GET /auth/me` endpoint returning current user profile.

---

### Phase 3: Task Management & Teams
**Concept:** Build the core CRUD functionality and team collaboration logic.
#### Automated Tasks (AI)
- Create models for `Tasks`, `Teams`, and `Team_Members`.
- Develop CRUD REST endpoints for `/tasks` with input validation (Zod).
- Develop endpoints for `/teams` (create, invite, list tasks).
- Implement RBAC middleware to enforce `Owner`, `Admin`, and `Member` privileges.
- Add pagination, search, and filtering to task queries.

---

### Phase 4: Real-Time Communication & Caching
**Concept:** Enable live collaboration and optimize performance for high loads.
#### Automated Tasks (AI)
- Configure `Socket.io` server with Express.
- Implement Clerk JWT handshake for secure WebSocket connections.
- Develop socket event broadcasters (`task:created`, `task:updated`, `task:deleted`).
- Integrate Redis for caching hot reads on `GET /tasks` (5 min TTL) and handle cache invalidation.
- Implement Redis-backed presence tracking (`user:online`, `user:offline`, typing indicators).
- Set up Redis rate limiting middleware (100 req/min per IP).

---

### Phase 5: File Attachments & CI/CD Pipeline
**Concept:** Handle media robustly and automate code quality checks.
#### Automated Tasks (AI)
- Configure `Multer` for file uploads (max 10MB, secure filename sanitization).
- Create `Attachments` and `Activity_Logs` database tables.
- Implement `/tasks/:id/upload` endpoint.
- Write initial unit tests using `Jest` and `Supertest`.
- Create `.github/workflows/ci.yml` for automated testing and Docker builds.

#### Manual Tasks (User)
- Push the codebase to a GitHub repository.
- Monitor the GitHub Actions tab to ensure CI passes on push.

---

### Phase 6: Multi-Cloud Deployment & Load Balancing
**Concept:** Deploy to a highly available, distributed infrastructure using free tiers.

#### Infrastructure Preparation (Automated - AI)
- Extract environment variables to support external Database/Redis connections.
- Create a `/health` endpoint for load balancer health checks.
- Add dynamic CORS configuration to allow the load balancer domain.
- Create `swagger.js` for API documentation (OpenAPI).

#### Deployment Execution (Manual - User)

**Step 1: Centralized Data Setup**
- **PostgreSQL:** Create a free database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
- **Redis:** Create a free Redis instance on [Upstash](https://upstash.com).
- Copy the connection URLs (you will inject these into all 3 servers).

**Step 2: Server 1 - Render**
- Go to [Render.com](https://render.com), create a new **Web Service**, connect your GitHub repo.
- Select the `Docker` runtime. Add your DB, Redis, Clerk, and JWT Secret to the Environment Variables.
- Note the provided `.onrender.com` URL.

**Step 3: Server 2 - Northflank**
- Go to [Northflank.com](https://northflank.com), create a new **Service**, link your repo, and choose Docker build.
- Inject the exact same environment variables used in Render.
- Note the public URL.

**Step 4: Server 3 - Koyeb**
- Go to [Koyeb.com](https://koyeb.com) (excellent free tier for Docker containers).
- Create an App, connect GitHub, deploy via Dockerfile, and add the environment variables.
- Note the `.koyeb.app` URL.

**Step 5: Load Balancer Setup**
- Sign up for a free **Cloudflare** account and add your domain.
- **Free Method (DNS Round Robin):** In the DNS settings, create three `CNAME` records for `api.yourdomain.com`, each pointing to one of the three URLs (Render, Northflank, Koyeb). Cloudflare will distribute traffic randomly across the three servers.
- **Advanced Method (Cloudflare Load Balancer):** Navigate to Traffic > Load Balancing. Create a pool containing your 3 server URLs, and set the health check path to `/health`. *(Note: This specific feature in Cloudflare costs $5/mo, so DNS Round Robin is the best 100% free approach)*.

---

## Verification Plan

### Automated Tests
- Run `npm run test:unit` for unit tests.
- Run `npm run test:integration` for API tests using Supertest.
- Verify GitHub Actions CI pipeline passes automatically.

### Manual Verification
- **Local Dev:** Run `docker-compose up` and interact with the API using Postman or the provided Inkwell Studio frontend.
- **WebSockets:** Connect two different browser windows and edit a task to verify real-time updates and presence indicators.
- **Production Endpoints:** Hit the `/health` endpoint on Render, Northflank, and Koyeb individually to confirm they are running and connected to the shared database.
- **Load Balancing:** Ping the load balanced domain (`api.yourdomain.com`) multiple times. Check the server logs on Render, Northflank, and Koyeb to verify that requests are being distributed across all three instances.
