# Deployment Guide — bmad-task-tracking

## Prerequisites

- GitHub repo: `Diyor98/bmad-task-tracking`
- Production Docker files already in repo: `docker-compose.prod.yml`, `backend/Dockerfile.prod`, `frontend/Dockerfile.prod`, `frontend/nginx.conf`

## Environment Variables Required

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=bmadtutorial
JWT_SECRET=<random-secret>          # generate: openssl rand -base64 32
JWT_EXPIRY=7d
FRONTEND_URL=https://<your-domain>  # must match actual URL for CORS
APP_PORT=80
```

---

## Option 1: Railway (Recommended — Easiest)

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select `Diyor98/bmad-task-tracking`
4. Railway detects the Docker setup. Create three services:
   - **Postgres**: Add a PostgreSQL plugin (Railway provides managed Postgres)
   - **Backend**: Point to `backend/Dockerfile.prod`
   - **Frontend**: Point to `frontend/Dockerfile.prod`
5. Set environment variables on the backend service:
   - `DATABASE_URL` — use the Railway-provided Postgres connection string
   - `JWT_SECRET` — generate a random secret
   - `JWT_EXPIRY` — `7d`
   - `NODE_ENV` — `production`
   - `FRONTEND_URL` — the Railway-generated frontend URL
6. Set the frontend nginx config to proxy `/api` to the backend service's internal URL
7. Deploy — Railway builds and runs automatically
8. Run the database migration: in the backend service shell, run `npx prisma migrate deploy`

**Estimated time:** 10–15 minutes
**Cost:** Free tier covers small usage, ~$5/mo after

---

## Option 2: Render

1. Go to https://render.com and sign in with GitHub
2. Create a **PostgreSQL** database (free tier available)
   - Note the **Internal Database URL**
3. Create a **Web Service** for the backend:
   - Connect GitHub repo
   - Root directory: `backend`
   - Runtime: Docker
   - Dockerfile path: `Dockerfile.prod`
   - Set environment variables:
     - `DATABASE_URL` — Render Postgres internal URL
     - `JWT_SECRET` — random secret
     - `JWT_EXPIRY` — `7d`
     - `NODE_ENV` — `production`
     - `FRONTEND_URL` — the frontend service URL (set after creating it)
4. Create a **Static Site** for the frontend:
   - Connect GitHub repo
   - Root directory: `frontend`
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
   - Add rewrite rule: `/*` → `/index.html` (SPA fallback)
   - Set environment variable or update `vite.config.ts` to proxy `/api` to the backend URL
5. Update `FRONTEND_URL` on the backend to match the static site URL

**Estimated time:** 15–20 minutes
**Cost:** Free tier for static site + web service, Postgres free for 90 days

---

## Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Authenticate: `fly auth login`
3. Create Postgres cluster:
   ```bash
   fly postgres create --name bmad-db --region sjc
   ```
4. Deploy backend:
   ```bash
   cd backend
   fly launch --name bmad-backend --dockerfile Dockerfile.prod --region sjc
   fly secrets set \
     JWT_SECRET=$(openssl rand -base64 32) \
     JWT_EXPIRY=7d \
     NODE_ENV=production \
     FRONTEND_URL=https://bmad-frontend.fly.dev
   fly postgres attach bmad-db
   fly deploy
   fly ssh console -C "npx prisma migrate deploy"
   ```
5. Deploy frontend:
   ```bash
   cd frontend
   fly launch --name bmad-frontend --dockerfile Dockerfile.prod --region sjc
   fly deploy
   ```
6. Update `frontend/nginx.conf` proxy target to `bmad-backend.internal:3000`

**Estimated time:** 15–20 minutes
**Cost:** Free tier covers small apps, pay-as-go after

---

## Option 4: VPS (DigitalOcean, Hetzner, AWS Lightsail)

### Setup

1. Provision a VPS (Ubuntu 22.04+, 1GB RAM minimum)
2. SSH in and install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
3. Clone the repo:
   ```bash
   git clone https://github.com/Diyor98/bmad-task-tracking.git
   cd bmad-task-tracking
   ```
4. Create `.env.prod`:
   ```bash
   cp .env.prod.example .env.prod
   nano .env.prod
   # Fill in real values:
   #   POSTGRES_PASSWORD=<strong-password>
   #   JWT_SECRET=<random-secret>
   #   FRONTEND_URL=http://<your-server-ip>
   ```
5. Build and start:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```
6. Verify:
   ```bash
   curl http://localhost/api/health
   # Should return: {"data":"ok"}
   ```

### Add HTTPS (recommended)

7. Point a domain to your server IP (A record in DNS)
8. Install Caddy as a reverse proxy:
   ```bash
   sudo apt install -y caddy
   ```
9. Edit `/etc/caddy/Caddyfile`:
   ```
   your-domain.com {
       reverse_proxy localhost:80
   }
   ```
10. Restart Caddy — it auto-provisions a Let's Encrypt certificate:
    ```bash
    sudo systemctl restart caddy
    ```
11. Update `.env.prod`:
    ```
    FRONTEND_URL=https://your-domain.com
    ```
12. Restart the app:
    ```bash
    docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
    ```

**Estimated time:** 20–30 minutes
**Cost:** $3.50–6/mo depending on provider

---

## Post-Deployment Checklist

- [ ] App loads at public URL
- [ ] Registration and login work
- [ ] Create a project — 4 default statuses appear
- [ ] Create and assign a task
- [ ] Add a comment
- [ ] Change task status
- [ ] Logout redirects to login
- [ ] Unauthenticated access redirected to login
- [ ] HTTPS is active (non-local deployments)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Backend not ready — check `docker logs` for migration errors |
| Auth fails after deploy | Verify `JWT_SECRET` is set and consistent across restarts |
| CORS errors | Ensure `FRONTEND_URL` matches the exact URL in the browser (including https://) |
| Database connection refused | Check `DATABASE_URL` matches the Postgres host/port/credentials |
| Frontend shows blank page | Check nginx config — SPA fallback must serve `index.html` for all routes |
