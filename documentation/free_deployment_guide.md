# 🆓 SyncForge 100% Free Production Deployment Guide

This guide walks you through deploying **SyncForge** completely for free using best-in-class cloud platforms with high availability and no inactive "cold starts" or sleep cycles.

```mermaid
graph LR
    User((💻 End User)) -->|React SPA| Vercel[🎨 Vercel - Free SPA Host]
    User -->|WebSockets / REST| Koyeb[⚡ Koyeb - Free Docker App Host]
    
    Koyeb -->|Data Storage| Supabase[(🐘 Supabase - Free Postgres)]
    Koyeb -->|Cache & PubSub| Upstash[(⚡ Upstash - Free Serverless Redis)]
```

---

## 🔑 Phase 1: Provisioning the Free Databases

### 1. PostgreSQL on Supabase (100% Free)
Supabase provides a dedicated PostgreSQL database that stays online 24/7.

1. Go to [supabase.com](https://supabase.com) and sign up for a free account.
2. Create a new project named `SyncForge`. Set a strong database password and keep it safe.
3. Select your nearest region (e.g., AWS us-east-1 or eu-central-1).
4. Once the project is ready, navigate to **Project Settings** (gear icon) -> **Database**.
5. Scroll down to **Connection string**, select **URI**, and copy the string:
   ```bash
   # It will look like this (replace [YOUR-PASSWORD] with your actual database password):
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
6. **Save this string** as `DATABASE_URL` for your backend.

---

### 2. Serverless Redis on Upstash (100% Free)
Upstash is serverless Redis designed for high throughput, offering up to 10,000 requests per day for free.

1. Go to [upstash.com](https://upstash.com) and sign up.
2. Under the Redis tab, click **Create Database**.
3. Name it `syncforge-redis`, choose a region near your Supabase database, and click **Create**.
4. In the database dashboard under **Details**, find the **Redis Connect URL** section.
5. Copy the URL:
   ```bash
   # It will look like this:
   redis://default:xxxxxx@xxxxxx.upstash.io:6379
   ```
6. **Save this string** as `REDIS_URL` for your backend.

---

## 🔒 Phase 2: Gathering Clerk Auth Credentials

1. Open your [Clerk Dashboard](https://dashboard.clerk.com).
2. Go to **API Keys** in the sidebar.
3. Copy the public key and secret key:
   * `CLERK_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)
   * `CLERK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
4. To configure JWT validation locally without hitting Clerk APIs every time (optimizes speed):
   * Go to **JWT Templates** in Clerk, or retrieve Clerk's asymmetric public key (PEM format). Paste the public key as a single-line string into your `CLERK_JWT_KEY` environment variable.

---

## ⚡ Phase 3: Deploying the Backend on Koyeb (100% Free)

Koyeb is a powerful container-hosting platform. Unlike Render's free tier, **Koyeb does not spin down (sleep)**, so your API and WebSockets will respond instantly 24/7.

1. Go to [koyeb.com](https://koyeb.com) and create a free account.
2. Click **Create Service**.
3. Choose **GitHub** as the deployment method and authorize your repository.
4. Select your **SyncForge** repository.
5. Configure the deployment settings exactly as follows:
   * **Application Directory:** Set to `backend` (this ensures Koyeb looks inside the backend folder).
   * **Builder:** Select **Docker** (it will automatically read your highly optimized `backend/Dockerfile`).
   * **Port:** Set the port to `3000` (matches the Dockerfile's exposed port).
   * **Instance Type:** Select **Nano** (free tier).
6. Under **Environment Variables**, add:
   * `DATABASE_URL` = *(Your Supabase connection string)*
   * `REDIS_URL` = *(Your Upstash connection string)*
   * `CLERK_PUBLISHABLE_KEY` = *(Your Clerk public key)*
   * `CLERK_SECRET_KEY` = *(Your Clerk secret key)*
   * `PORT` = `3000`
   * `NODE_ENV` = `production`
   * `CORS_ORIGIN` = `https://<your-vercel-app-name>.vercel.app` (You can update this after Vercel is deployed)
7. Click **Deploy**. Within 2-3 minutes, Koyeb will build your container, run the health check, and give you a public URL (e.g., `https://syncforge-api-xxxx.koyeb.app`).
8. **Copy your Koyeb API URL** (we'll need it for the frontend).

---

## 🎨 Phase 4: Deploying the Frontend on Vercel (100% Free)

Vercel is the premier host for React. It automatically handles builds and handles static asset caching globally.

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your **SyncForge** repository.
4. In the configuration window:
   * **Root Directory:** Edit this and select the `frontend` folder.
   * **Framework Preset:** Select **Vite** (Vercel will auto-detect Vite).
5. Click **Environment Variables** and add:
   * `VITE_API_URL` = *(Your Koyeb API URL, e.g., `https://syncforge-api-xxxx.koyeb.app`)*
   * `VITE_CLERK_PUBLISHABLE_KEY` = *(Your Clerk public key)*
6. Click **Deploy**. Vercel will build the frontend, and provide you with a production URL (e.g., `https://syncforge-three.vercel.app`).
7. **Important:** Copy this Vercel URL, go back to your Koyeb Environment Variables, update `CORS_ORIGIN` to match this URL, and redeploy the Koyeb service to securely allow requests.

---

## 🔄 Phase 5: CI/CD Status (GitHub Actions)

Your repository contains a pre-configured GitHub Actions pipeline (`.github/workflows/ci.yml`). Every time you push code to `main`/`master` or open a Pull Request:
1. GitHub Actions automatically boots an automated **PostgreSQL** and **Redis** instance inside its runner.
2. It runs `npm run lint` and `npm run test:integration` inside `/backend` to make sure all endpoints function correctly.
3. It installs and builds the `/frontend` assets to catch any compile-time errors.
4. Once this workflow passes green, you can be 100% confident that your deploy to Vercel and Koyeb will build and operate cleanly!
