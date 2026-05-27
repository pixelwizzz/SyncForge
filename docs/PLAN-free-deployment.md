# SyncForge Student AWS EC2 Docker Deployment Plan

This plan details the architecture, configuration, and operation procedures for hosting your multi-container Docker Compose stack on an **AWS EC2 Instance (Ubuntu 22.04 LTS)** using a student sandbox (AWS Academy/Educate — 100% free with no credit card required).

---

## 🏗️ Student AWS EC2 Architecture

The deployment leverages a single AWS EC2 virtual machine running your Docker containerized network. To maximize efficiency and prevent credit consumption, the instance is turned OFF when not in use.

```
                  [ AWS EC2 Instance (Ubuntu LTS) ]
         ┌──────────────────────────────────────────────────┐
         │  [ Host Nginx ] (Reverse Proxy & SSL Gateway)     │
         │         │                                        │
         │         ▼ (Exposed via Internal Docker bridge)   │
         │  [ syncforge-nginx (Container Gateway) ]         │
         │         │                                        │
         │         ▼                                        │
         │  [ syncforge-api (Express / WebSockets) ]        │
         │         │                                        │
         │         ├─► [ syncforge-postgres ] (pgdata vol)  │
         │         └─► [ syncforge-redis ] (redisdata vol)  │
         └──────────────────────────────────────────────────┘
```

---

## ⚡ Active Management & Smart Boot Strategy

*   **Credit Conservation**: When the college project is not actively being evaluated, the EC2 instance is set to **Stopped** status in the AWS Console, consuming **0 credits**.
*   **Automatic Container Bootstrap**: Every container service inside our `docker-compose.yml` has the `restart: unless-stopped` directive. When you click **Start Instance** in the AWS console:
    1.  The EC2 VM boots up.
    2.  The Docker Daemon launches automatically.
    3.  Docker immediately boots Nginx, Express, Postgres, and Redis into active states.
    *   **Result**: The product goes fully live in under 30 seconds **without** requiring you to open a terminal or run SSH commands!

---

## Proposed Changes

We will construct the comprehensive AWS EC2 operations guide and deployment workflow.

### 1. Update [free_deployment_guide.md](file:///d:/Projects/SyncForge/documentation/free_deployment_guide.md)
We will rewrite the guide to focus strictly on:
*   Accessing the AWS Academy/Educate dashboard (no credit card required).
*   Spinning up a `t2.micro` or `t3.micro` EC2 Instance.
*   Configuring AWS **Security Groups** (Ingress Rules) for Ports 80 (HTTP), 443 (HTTPS), and 22 (SSH).
*   Installing Docker and Compose on the EC2 Ubuntu host.
*   Setting up **DuckDNS** (a free Dynamic DNS provider that requires no credit card) to bind a secure public domain to your dynamic EC2 Public IP for Let's Encrypt SSL activation.
*   Automating Postgres daily backups on the EC2 instance.
*   A step-by-step "Start/Stop" operations list for project submission day.

---

## Verification Plan

### Stage 1: AWS Sandbox Boot
*   Verify the EC2 instance boots successfully and Docker mounts volumes correctly.

### Stage 2: Host SSL & Real-Time Handshake
1.  Verify that your DuckDNS public URL (e.g. `https://syncforge.duckdns.org/api/v1/system/health`) loads with a secure Let's Encrypt SSL padlock.
2.  Stop the instance from the AWS console, verify it is down, then start it and confirm the stack automatically boots back up and responds within 30 seconds.
