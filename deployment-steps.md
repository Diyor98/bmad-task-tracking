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

Railway does **not** support docker-compose. You deploy each service separately.

### Step 1: Create a new project

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project** → **Empty Project**

### Step 2: Add PostgreSQL

1. Inside the project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway provisions a managed Postgres instance automatically
3. Click the Postgres service → **Variables** tab → note the `DATABASE_URL` (you'll reference it later)
4. The Postgres service name matters — if Railway names it something other than "Postgres", adjust the variable reference in Step 3 accordingly (e.g. `${{PostgreSQL.DATABASE_URL}}`)

### Step 3: Deploy the Backend

1. Click **+ New** → **GitHub Repo** → select `Diyor98/bmad-task-tracking`
2. Go to the new service's **Settings** tab:
   - **Source** → **Root Directory**: `backend`
   - **Build** → **Builder**: `Dockerfile`
   - **Build** → **Dockerfile Path**: `Dockerfile.prod`
3. Go to the **Variables** tab and add:
   ```
   DATABASE_URL    = ${{Postgres.DATABASE_URL}}    (click "Add Reference" to link)
   JWT_SECRET      = <paste output of: openssl rand -base64 32>
   JWT_EXPIRY      = 7d
   NODE_ENV        = production
   FRONTEND_URL    = https://your-frontend.up.railway.app  (update after Step 4)
   ```
4. Go to **Settings** → **Networking** → **Generate Domain** → enter port **3000** → click Generate
   - This is optional (only needed for debugging the backend directly), but useful for initial testing
5. Under **Networking** → **Private Networking**, note the hostname (e.g. `backend.railway.internal`). The frontend will use this to proxy API requests.
   - **Important:** Private networking requires both services to be in the same Railway project. The hostname format is typically `<service-name>.railway.internal`.
6. Railway auto-deploys on each push to main. The backend Dockerfile runs `prisma migrate deploy` on startup, so the database schema is created automatically.
7. **Wait for the backend to deploy successfully** before proceeding to Step 4. Check the deploy logs — you should see "Backend running on port 3000".

### Step 4: Deploy the Frontend

1. Click **+ New** → **GitHub Repo** → select `Diyor98/bmad-task-tracking` again
2. Go to **Settings** tab:
   - **Source** → **Root Directory**: `frontend`
   - **Build** → **Builder**: `Dockerfile`
   - **Build** → **Dockerfile Path**: `Dockerfile.prod`
3. Go to the **Variables** tab and add:
   ```
   BACKEND_URL = http://backend.railway.internal:3000
   ```
   Replace `backend.railway.internal` with the actual private hostname from Step 3.5.

   **Do NOT set `PORT`** — Railway injects it automatically. The nginx config reads `${PORT}` at startup via envsubst.
4. Go to **Settings** → **Networking** → **Generate Domain** → enter port **80** → click Generate
   - This gives you a public URL like `https://bmad-frontend-production.up.railway.app`
   - Port **80** is what nginx listens on by default in the Dockerfile

### Step 5: Update FRONTEND_URL on Backend

1. Go back to the backend service → **Variables**
2. Update `FRONTEND_URL` to the frontend's public domain from Step 4.4:
   ```
   FRONTEND_URL = https://bmad-frontend-production.up.railway.app
   ```
3. The backend will redeploy automatically with the correct CORS origin

### Step 6: Verify

1. Open the frontend URL in your browser
2. Register a new user
3. Create a project — verify 4 default statuses appear
4. Create a task and change its status
5. Check the backend health: `https://your-frontend.up.railway.app/api/health` should return `{"data":"ok"}`

### Troubleshooting Railway

| Issue | Fix |
|-------|-----|
| "Error creating build plan with Railpack" | You forgot to set Builder to **Dockerfile** in Settings → Build. Railway defaults to Railpack auto-detection. |
| 502 on frontend `/api/*` routes | Check `BACKEND_URL` on the frontend service. It must use the **private** Railway hostname (`.railway.internal`), not the public URL. |
| Backend crashes on startup | Check logs — likely `DATABASE_URL` is wrong. Use Railway's variable reference `${{Postgres.DATABASE_URL}}` to auto-link. |
| CORS errors in browser | `FRONTEND_URL` on the backend must exactly match the browser URL (including `https://`). |
| "Relation does not exist" errors | Migration didn't run. Check backend deploy logs for `prisma migrate deploy` output. SSH into the service and run it manually if needed. |
| Frontend shows blank white page | Check that `Dockerfile.prod` is used (not the dev `Dockerfile`). The prod Dockerfile runs `npm run build` + nginx. |
| Backend logs show nginx starting | Wrong Dockerfile — Railway is building the frontend for the backend service. Verify **Root Directory** is `backend` and **Dockerfile Path** is `Dockerfile.prod` in the backend service settings. |
| "exports is not defined in ES module scope" | Old Docker cache. Trigger a rebuild — the current Dockerfile injects `{"type":"commonjs"}` in `dist/generated/` to fix Node 22 CJS/ESM resolution. |
| Domain generation asks for port | Enter **80** for frontend (nginx), **3000** for backend (Express). |
| Private networking not working | Both services must be in the **same Railway project**. Check the backend service's Networking tab for the exact private hostname. |

**Estimated time:** 15–20 minutes
**Cost:** Free trial with $5 credit, then ~$5/mo

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
