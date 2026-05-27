# 🎨 SyncForge Frontend Vercel Deployment Guide

This guide details the step-by-step procedure to deploy the SyncForge **TanStack Start (Vinxi SSR) Frontend** on **Vercel**. 

Vercel acts as a global CDN and Serverless platform, rendering your React application with extreme speed while securely proxying operations to your AWS EC2 backend.

---

## ⚡ Architecture Overview

```
                        [ End User Browser ]
                                 │
                 ┌───────────────┴───────────────┐
                 │  Global Anycast DNS / CDN     │
                 └──────┬─────────────────┬──────┘
                        │                 │
            (Static Assets & SSR)      (REST APIs & WebSockets)
                        ▼                 ▼
                [ Vercel Serverless ]  [ AWS EC2 Instance ]
                (SyncForge Frontend)   (SyncForge Core API)
```

---

## 🛠️ Resolving Vercel "404 NOT_FOUND" Errors
Unlike older static React sites, modern SyncForge projects run on **TanStack Start** (a full-stack SSR framework). 

If you attempt a default deployment on Vercel without configuring a Serverless preset, Vercel will treat the project as a static site and fail with a **404 NOT_FOUND** error because it cannot find or execute the backend SSR server.

### How We Fixed It
1.  **Installed `nitro`** as a devDependency in the frontend to handle compiler-preset conversions.
2.  **Updated [vite.config.ts](file:///d:/Projects/SyncForge/frontend/vite.config.ts)** to dynamically inject the Nitro Vercel-preset plugin during Vercel's build pipeline:
    ```typescript
    import { defineConfig } from "@lovable.dev/vite-tanstack-config";
    import { nitro } from "nitro/vite";

    export default defineConfig({
      cloudflare: process.env.VERCEL ? false : undefined,
      tanstackStart: {
        server: { entry: "server" },
      },
      vite: {
        plugins: process.env.VERCEL
          ? [
              nitro({
                preset: "vercel",
              }),
            ]
          : [],
      },
    });
    ```
This creates a seamless build that compiles into Vercel's native **Build Output API** directory (`.vercel/output`), deploying the serverless functions (`__server.func`) and static assets cleanly.

---

## 🔒 Prerequisites

Ensure you have the following ready before deploying:
1.  A **Vercel Account** linked to your GitHub account (free tier).
2.  Your **Clerk Publishable Key** (`VITE_CLERK_PUBLISHABLE_KEY`) from the Clerk Dashboard.
3.  Your secure **AWS EC2 Backend Domain** (e.g. `https://syncforge-college.duckdns.org` - see [free_deployment_guide.md](file:///d:/Projects/SyncForge/documentation/free_deployment_guide.md) to set this up).

---

## 📦 Phase 1: Deploying the Frontend on Vercel

### 1. Import your Repository
1.  Go to the [Vercel New Project Dashboard](https://vercel.com/new).
2.  Find your **`SyncForge`** repository in the list and click **Import**.

### 2. Configure Project Settings
In the **Configure Project** screen, apply the following critical settings:
*   **Project Name**: `syncforge-web` (or any preferred name).
*   **Framework Preset**: Leave as **Other** (Vercel will auto-detect Nitro/Vinxi/TanStack Start from our build output directory).
*   **Root Directory**: Click **Edit** and select the **`frontend`** folder *(essential so Vercel builds from the correct folder in the monorepo)*.
*   **Build and Output Settings**:
    *   **Build Command**: Leave as default (`npm run build` or `bun run build`).
    *   **Output Directory**: Leave empty/default. The Nitro plugin will automatically generate `.vercel/output`, which Vercel will capture.

### 3. Inject Environment Variables
Expand the **Environment Variables** section and add the following keys:

| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://syncforge-college.duckdns.org` | Your secure production EC2 public URL (no trailing slash). |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Your production or development Clerk publishable key. |
| `VITE_WS_URL` | `https://syncforge-college.duckdns.org` | *(Optional)* The secure WebSocket URL (defaults to `VITE_API_URL` if omitted). |

### 4. Deploy!
Click **Deploy**. Vercel will build and host your full-stack SSR application cleanly!

Copy your generated Vercel live domain (e.g. `https://syncforge-web.vercel.app`).

---

## 🛡️ Phase 2: Updating Backend CORS Configurations

For the frontend to securely interact with the backend API, the backend must authorize requests originating from your new Vercel domain.

1.  SSH into your secure AWS EC2 host:
    ```bash
    ssh -i /path/to/syncforge-key.pem ubuntu@your-ec2-ip
    ```
2.  Open the backend environment configuration:
    ```bash
    cd /var/www/syncforge/backend
    nano .env
    ```
3.  Modify the `CORS_ORIGIN` variable to match your new Vercel domain:
    ```bash
    CORS_ORIGIN=https://syncforge-web.vercel.app
    ```
4.  Reboot your Docker containers to apply the security update:
    ```bash
    docker compose down
    docker compose up -d
    ```

---

## 🔄 Phase 3: Setting Up Clerk Redirect Boundaries

Since authentication sessions are managed by Clerk, you must tell Clerk to redirect users back to your secure Vercel production domain after sign-in.

1.  Log in to the [Clerk Dashboard](https://dashboard.clerk.com).
2.  Select your application and navigate to **Paths** or **Redirect URIs**.
3.  Add the production redirects for your live Vercel domain:
    *   **After Sign-in URL**: `https://syncforge-web.vercel.app/`
    *   **After Sign-up URL**: `https://syncforge-web.vercel.app/`
    *   **Home/Callback URL**: `https://syncforge-web.vercel.app/`

---

## 🧪 Phase 4: Post-Deployment Verification Checklist

Verify your production system is perfectly operational by performing these checks:

- [ ] **Secure SSL Connection**: Load `https://syncforge-web.vercel.app` in your browser. Verify the padlock icon is green and secure.
- [ ] **Clerk Authentication Flow**: Click **Login**, authenticate via Clerk, and confirm you are successfully redirected back to the SyncForge dashboard.
- [ ] **REST API Communication**: Open Developer Tools (`F12` -> Network) and verify that requests to your backend (e.g. `/api/v1/users/me` or `/api/v1/teams`) resolve with a clean `200 OK`.
- [ ] **WebSocket Real-Time Gateway**: Open a task workspace. Open the dashboard in a separate incognito window. Verify that typing indicators, active presence bubbles, and drag-and-drop task movements sync **instantly** (under 100ms) across both screens!
