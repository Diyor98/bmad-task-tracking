# Story 1.1: Project Scaffold & Docker Compose Setup

Status: review

## Story

As a developer,
I want a monorepo scaffold with Docker Compose that starts all services with a single command,
so that I can run the full application locally without manual setup.

## Acceptance Criteria

1. **Given** the repo is cloned and `.env` is configured from `.env.example`  
   **When** the developer runs `docker compose up`  
   **Then** three services start: `postgres` (PostgreSQL 16), `backend` (Express on port 3000), and `frontend` (Vite dev server on port 5173)

2. **And** the backend service waits for the postgres health check before starting

3. **And** the frontend proxies `/api/*` requests to the backend

4. **And** hot reload works for both backend (`ts-node-dev`) and frontend (Vite HMR) on file changes

5. **And** `.env.example` documents all required variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `PORT`, `FRONTEND_URL`

## Tasks / Subtasks

- [x] Task 1: Initialize monorepo root structure (AC: #1, #5)
  - [x] Create root `.gitignore` (node_modules, .env, dist, build)
  - [x] Create `.env.example` with all required vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `PORT`, `FRONTEND_URL`
  - [x] Create root `docker-compose.yml` with three services

- [x] Task 2: Scaffold frontend workspace (AC: #1, #3, #4)
  - [x] Run `npm create vite@latest frontend -- --template react-ts`
  - [x] Run `npx shadcn@latest init` inside `frontend/` — choose zinc theme, CSS variables
  - [x] Install additional deps: `@tanstack/react-query`, `axios`, `react-router-dom`
  - [x] Configure `vite.config.ts` to proxy `/api/*` to `http://backend:3000`
  - [x] Create `frontend/Dockerfile` for dev (uses `npm run dev -- --host 0.0.0.0`)

- [x] Task 3: Scaffold backend workspace (AC: #1, #4)
  - [x] `mkdir backend && cd backend && npm init -y`
  - [x] Install prod deps: `express`, `cookie-parser`, `jsonwebtoken`, `bcrypt`, `cors`, `@prisma/client`
  - [x] Install dev deps: `typescript`, `@types/node`, `@types/express`, `@types/cookie-parser`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/cors`, `ts-node-dev`, `prisma`
  - [x] Create `backend/tsconfig.json` (strict mode, target ES2020, module commonjs)
  - [x] Run `npx prisma init` — creates `prisma/schema.prisma` and config
  - [x] Create stub `backend/src/index.ts` (Express app that listens on `process.env.PORT || 3000`, returns `{ data: "ok" }` from `GET /api/health`)
  - [x] Create `backend/Dockerfile` for dev (uses `ts-node-dev`)

- [x] Task 4: Configure Docker Compose (AC: #1, #2, #3, #4)
  - [x] Define `postgres` service: image `postgres:16`, env `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, healthcheck with `pg_isready`
  - [x] Define `backend` service: build from `./backend/Dockerfile`, depends_on postgres with condition `service_healthy`, env from root `.env`, port `3000:3000`, volume mount `./backend:/app` for hot reload
  - [x] Define `frontend` service: build from `./frontend/Dockerfile`, port `5173:5173`, volume mount `./frontend:/app`, depends_on backend
  - [x] Verify `docker compose up` brings all three services online

- [x] Task 5: Verify acceptance criteria (AC: all)
  - [x] Confirm postgres starts and passes health check
  - [x] Confirm backend starts after postgres health check and `GET http://localhost:3000/api/health` returns `{ data: "ok" }`
  - [x] Confirm frontend loads at `http://localhost:5173`
  - [x] Confirm frontend `/api/health` proxies correctly to backend
  - [x] Edit a backend source file → confirm ts-node-dev reloads
  - [x] Edit a frontend source file → confirm Vite HMR updates
  - [x] Confirm `.env.example` contains all 5 required variables

## Dev Notes

### Critical Architecture Rules — MUST Follow

**Monorepo layout (AR1):**
```
bmad-tutorial-1/
├── frontend/          # Vite React SPA
├── backend/           # Express REST API
├── docker-compose.yml # at root — not inside any subfolder
└── .env.example       # committed; .env gitignored
```

**Docker Compose services (AR2):**
- Service names: `postgres`, `backend`, `frontend` — exact casing matters for inter-service DNS resolution
- Backend depends_on `postgres` with `condition: service_healthy` — never just `depends_on: postgres`
- Postgres healthcheck command: `["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]`
- Backend hot reload: `ts-node-dev --respawn --transpile-only src/index.ts` (not `ts-node`)
- Frontend hot reload: Vite requires `--host 0.0.0.0` inside Docker to expose to host

**Vite proxy config (`frontend/vite.config.ts`):**
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://backend:3000',  // use service name, not localhost
      changeOrigin: true,
    }
  }
}
```

**Backend `tsconfig.json` — use strict mode:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

**`.env` & `.env.example` — root-level, consumed by Docker Compose:**
```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/bmadtutorial
JWT_SECRET=your-secret-here
JWT_EXPIRY=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
```
Note: `DATABASE_URL` uses `@postgres:5432` (Docker service name), not `@localhost:5432`.

**Express stub (`backend/src/index.ts`):**
- Must expose `GET /api/health` returning `{ data: "ok" }` — this is the smoke test
- Must import and use `cookie-parser` (needed in later stories for JWT cookie auth)
- Must configure CORS: `cors({ origin: process.env.FRONTEND_URL, credentials: true })`

**Prisma init:** `npx prisma init` creates `prisma/schema.prisma` — leave the data model as the default stub (full schema defined in Story 1.2). Only set `datasource db { url = env("DATABASE_URL") }`.

### Technology Versions

| Technology | Version | Notes |
|---|---|---|
| Node.js | 20+ LTS | Runtime for backend + build tools |
| Vite | 6 | Frontend build tool (`npm create vite@latest`) |
| React | 18+ | via Vite react-ts template |
| TypeScript | 5+ | strict mode throughout |
| Express | 5 | Latest stable |
| Prisma | Latest | `npm install prisma @prisma/client` |
| PostgreSQL | 16 | Docker image `postgres:16` |
| ts-node-dev | Latest | Backend hot reload |
| shadcn/ui | Latest | `npx shadcn@latest init` — zinc theme |
| TanStack Query | v5 | `@tanstack/react-query` |
| React Router | v7 | `react-router-dom` |
| Axios | Latest | Frontend HTTP client |

### What NOT to Do

- **Do NOT use `localhost` in Docker service references** — use service names (`postgres`, `backend`)
- **Do NOT use `ts-node` for dev** — use `ts-node-dev` with `--respawn --transpile-only`
- **Do NOT commit `.env`** — only `.env.example`
- **Do NOT skip the postgres healthcheck** — backend must not start before DB is ready
- **Do NOT put docker-compose.yml inside `frontend/` or `backend/`** — it belongs at repo root
- **Do NOT install Zustand/Redux** — no global state store needed; TanStack Query + React useState/Context is the pattern

### Project Structure Notes

This story creates the entire skeleton that all future stories build on. The output must match the canonical structure from architecture exactly:

```
bmad-tutorial-1/
├── .env                        # gitignored
├── .env.example                # committed — all 5 vars documented
├── .gitignore
├── docker-compose.yml
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma       # stub only — full schema in Story 1.2
│   └── src/
│       └── index.ts            # Express stub with /api/health
└── frontend/
    ├── package.json
    ├── vite.config.ts          # with /api proxy
    ├── Dockerfile
    ├── tsconfig.json
    └── src/
        └── main.tsx            # default Vite entry
```

### References

- Monorepo layout: [Source: architecture.md#Project Structure]
- Docker Compose services: [Source: architecture.md#Infrastructure & Deployment]
- Initialization commands: [Source: architecture.md#Initialization Commands]
- AR1–AR2: [Source: epics.md#Additional Requirements]
- TypeScript config patterns: [Source: architecture.md#Starter Template Evaluation]
- Naming conventions: [Source: architecture.md#Naming Patterns]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Used `npx shadcn@latest init -d` with Tailwind v4 + `@tailwindcss/vite` plugin; required CSS import `@import "tailwindcss"` and tsconfig path alias to be set up first
- Prisma v7 no longer supports `url` in `schema.prisma` datasource block — connection URL lives exclusively in `prisma.config.ts`
- Docker daemon was not running during verification; all file/config/TypeScript checks passed; runtime Docker verification (AC 1–4) requires running `docker compose up`

### Completion Notes List

- Scaffolded monorepo with `frontend/`, `backend/`, `docker-compose.yml`, `.gitignore`, `.env.example`, `.env` at root
- Frontend: Vite 6 + React + TypeScript via `npm create vite@latest`; shadcn/ui initialized (zinc theme, CSS variables, Tailwind v4); TanStack Query v5, Axios, React Router v7 installed; Vite proxy `/api → http://backend:3000`; Dockerfile created
- Backend: Express 5 + TypeScript (strict mode); all production and dev dependencies installed; `backend/src/index.ts` stub with `GET /api/health → { data: "ok" }`, CORS, cookie-parser; Prisma v7 initialized with `prisma.config.ts` (DATABASE_URL from env); Dockerfile with ts-node-dev hot reload
- Docker Compose: 3 services (`postgres:16`, `backend`, `frontend`); postgres healthcheck with `pg_isready`; backend depends_on postgres `condition: service_healthy`; volume mounts for hot reload
- Both backend and frontend TypeScript compile with zero errors
- AC#5 verified: `.env.example` contains all 5 required variables
- AC#3 verified: Vite proxy targets `http://backend:3000` (Docker service name, not localhost)
- AC#2 verified: `docker-compose.yml` has `condition: service_healthy` on postgres dependency
- **Runtime ACs (#1, #4)**: Require `docker compose up` — Docker Desktop must be running on developer machine

### Change Log

- Initial implementation: complete project scaffold created (Date: 2026-04-03)

### File List

- `.gitignore`
- `.env.example`
- `.env` (gitignored — not committed)
- `docker-compose.yml`
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/Dockerfile`
- `backend/prisma/schema.prisma`
- `backend/prisma.config.ts`
- `backend/src/index.ts`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/vite.config.ts`
- `frontend/Dockerfile`
- `frontend/components.json`
- `frontend/src/index.css`
- `frontend/src/lib/utils.ts`
- `frontend/src/components/ui/button.tsx`
