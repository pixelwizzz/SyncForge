# 🎓 Student AWS EC2 Production Docker Compose Guide

This guide is customized for college projects. It walks you through deploying your **SyncForge Docker Compose infrastructure** on a free **AWS EC2 Instance** (Ubuntu 22.04 LTS) using a student sandbox (AWS Academy / AWS Educate / GitHub Student Pack) with **no credit card required**.

---

## ⚡ The Smart "Stop & Start" Credit Conservation Strategy

AWS sandbox accounts provide limited credits. To ensure you do not run out of credits before your project submission:
1.  **When not in use (Staging)**: Go to the AWS EC2 Console, select your instance, and select **Instance State** -> **Stop Instance**. The virtual machine shuts down, consuming **0 credits**. Your database volume (`pgdata`) and uploads remain fully persisted on disk.
2.  **During Project Submission/Evaluation**: Go to the AWS Console, and select **Start Instance**.
3.  **The Auto-Boot Magic**: Because we configured `restart: unless-stopped` in your [backend/docker-compose.yml](file:///d:/Projects/SyncForge/backend/docker-compose.yml), **Docker, Nginx, PostgreSQL, Redis, and your API will automatically boot back up and go live in under 30 seconds** without you needing to SSH into the server or run any commands!

---

## 🔑 Phase 1: Provisioning the Free AWS EC2 Instance

### 1. Launch the EC2 Instance
1.  Log in to your student AWS Console (AWS Academy or AWS Educate).
2.  Navigate to the **EC2 Dashboard** and click **Launch Instance**.
3.  **Name**: `SyncForge-Production`
4.  **Application and OS Image (AMI)**: Select `Ubuntu` (select `Ubuntu Server 22.04 LTS`, free-tier eligible, x86_64 architecture).
5.  **Instance Type**: Select `t2.micro` or `t3.micro` (free-tier eligible).
6.  **Key Pair (Login)**: Click **Create new key pair**. Set name to `syncforge-key`, select `.pem`, and download it to your local computer.
7.  **Network Settings (Firewall / Security Group)**:
    *   Create a new Security Group.
    *   Check **Allow SSH traffic from Anywhere** (Port 22).
    *   Check **Allow HTTP traffic from the internet** (Port 80).
    *   Check **Allow HTTPS traffic from the internet** (Port 443).
8.  Click **Launch Instance** and wait for it to transition to **Running** state.

---

## 🌐 Phase 2: Setting up a Free SSL Domain (DuckDNS)

Let's Encrypt does not allow provisioning SSL certificates directly for default AWS domains (`compute-1.amazonaws.com`). 
To get a secure `https://` and `wss://` domain for free without a credit card, we use **DuckDNS** (a free dynamic DNS provider hosted by AWS):

1.  Go to [duckdns.org](https://www.duckdns.org) and log in using your GitHub account.
2.  In the **Domains** section, type a unique subdomain (e.g. `syncforge-college`) and click **Add Domain**.
3.  Your domain is now active: `syncforge-college.duckdns.org`.
4.  Copy your **DuckDNS Token** (a UUID string displayed at the top of the DuckDNS dashboard).

---

## ⚙️ Phase 3: Provisioning the Host Environment

Connect to your EC2 instance from your computer (replace `/path/to/syncforge-key.pem` and `your-ec2-ip` with your credentials):
```bash
ssh -i /path/to/syncforge-key.pem ubuntu@your-ec2-ip
```

### 1. Install Docker, Docker Compose, Git, and Nginx
Run this shell script on your EC2 instance to install all required host packages:
```bash
# Update Ubuntu repositories
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release git nginx certbot python3-certbot-nginx

# Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## 🔄 Phase 4: Setting up Automated Dynamic IP Sync

Whenever you **Stop** and **Start** an EC2 instance, AWS assigns it a **new Public IP Address**. To prevent your domain from breaking or requiring manual updates on DuckDNS every time you reboot the server, we set up an automated startup script:

1.  On your EC2 instance, create an IP update script:
    ```bash
    mkdir -p ~/scripts
    nano ~/scripts/update_dns.sh
    ```
2.  Paste the following content (replace `YOUR_SUBDOMAIN` with your subdomain e.g. `syncforge-college` and `YOUR_TOKEN` with your DuckDNS Token):
    ```bash
    #!/bin/bash
    # Call the DuckDNS API leaving IP blank to auto-detect our new EC2 Public IP
    curl -s "https://www.duckdns.org/update?domains=YOUR_SUBDOMAIN&token=YOUR_TOKEN&ip="
    echo "DNS updated successfully at $(date)"
    ```
3.  Save the file (`Ctrl+O`, `Enter`, `Ctrl+X`) and make it executable:
    ```bash
    chmod +x ~/scripts/update_dns.sh
    ```
4.  Add a **Cron `@reboot` job** so that the script runs automatically every time the EC2 instance boots up:
    ```bash
    crontab -e
    # Select nano, scroll to the bottom, and add this line:
    @reboot /home/ubuntu/scripts/update_dns.sh >> /home/ubuntu/scripts/dns_update.log 2>&1
    ```
*   **Result**: Every time you start your EC2 instance from the AWS console, the server automatically updates DuckDNS with its new IP address! Your domain `syncforge-college.duckdns.org` remains 100% functional and pointing to your active instance.

---

## 🐳 Phase 5: Deploying your Docker Stack

### 1. Clone Code and Configure Environment Variables
```bash
sudo mkdir -p /var/www/syncforge
sudo chown -R $USER:$USER /var/www/syncforge
cd /var/www/syncforge

# Clone your GitHub Repository
git clone https://github.com/YOUR-USERNAME/SyncForge.git .

# Create the environment configuration file
nano backend/.env
```
Paste and populate your production secrets:
```bash
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Internal Database routing
DB_HOST=postgres
DB_PORT=5432
DB_NAME=syncforge
DB_USER=syncforge_user
DB_PASSWORD=YOUR_STRONG_POSTGRES_DB_PASSWORD
DATABASE_URL=postgresql://syncforge_user:YOUR_STRONG_POSTGRES_DB_PASSWORD@postgres:5432/syncforge

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# Clerk Authentication (Use Clerk Production or Dev keys)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxx

# CORS Configuration (Set to your Vercel frontend URL)
CORS_ORIGIN=https://syncforge.vercel.app
```

### 2. Launch the Containers
```bash
cd /var/www/syncforge/backend
docker compose up -d --build
```
This builds and boots your API, Postgres database, Redis cache, and Nginx gateway. Verify they are healthy:
```bash
docker compose ps
```

---

## 🔒 Phase 6: Let's Encrypt SSL Gateway Setup

We terminate SSL at the host level, securing both HTTP (`https://`) and WebSockets (`wss://`).

1.  Run the DuckDNS sync script manually to ensure your DNS points to the EC2 IP:
    ```bash
    ~/scripts/update_dns.sh
    ```
2.  Create the host Nginx proxy config:
    ```bash
    sudo nano /etc/nginx/sites-available/syncforge
    ```
3.  Paste the configuration (replace `syncforge-college.duckdns.org` with your domain):
    ```nginx
    server {
        listen 80;
        server_name syncforge-college.duckdns.org;

        location /.well-known/acme-challenge/ {
            root /var/www/html;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }
    ```
4.  Activate the site and reload Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/syncforge /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo systemctl restart nginx
    ```
5.  Generate the Let's Encrypt SSL Certificates using Certbot:
    ```bash
    sudo certbot --nginx -d syncforge-college.duckdns.org
    ```
    Select `Yes` to redirect all traffic.
6.  Modify the Nginx file to proxy secure traffic to your Docker container gateway:
    ```bash
    sudo nano /etc/nginx/sites-available/syncforge
    ```
    Update the secure configuration block (listening on port `443`) to look exactly like this:
    ```nginx
    server {
        listen 443 ssl;
        server_name syncforge-college.duckdns.org;

        ssl_certificate /etc/letsencrypt/live/syncforge-college.duckdns.org/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/syncforge-college.duckdns.org/privkey.pem;

        location / {
            proxy_pass http://localhost:8080; # Directs to docker-compose nginx gateway
            proxy_http_version 1.1;

            # WebSocket Header Upgrades
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
7.  Verify and reload Nginx:
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

Your AWS EC2 secure backend gateway is now live at `https://syncforge-college.duckdns.org`!

---

## 💾 Phase 7: Daily Database Backups (Cron Job)

Ensure you never lose database records during instance shut-downs. Create a host-level cron job to capture nightly backups:

1.  Create the backups folder:
    ```bash
    sudo mkdir -p /var/backups/syncforge
    sudo chown $USER:$USER /var/backups/syncforge
    ```
2.  Open your crontab config:
    ```bash
    crontab -e
    ```
3.  Add the backup schedule line to execute every night at 2:00 AM:
    ```bash
    0 2 * * * docker exec -t syncforge-postgres pg_dumpall -c -U syncforge_user | gzip > /var/backups/syncforge/db_backup_$(date +\%F).sql.gz
    ```
