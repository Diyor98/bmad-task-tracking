---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-03'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/path-a-full-bmad-structure.md
  - docs/path-b-quick-dev.md
  - docs/prd-steps.md
workflowType: 'architecture'
project_name: 'bmad-tutorial-1'
user_name: 'Diyor'
date: '2026-04-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
31 FRs across 7 domains: User Management, Project Management, Task Management,
Status Management, Task Assignment, Team Collaboration, and Navigation & Discovery.

The per-project custom status model (FR17–21) is the most nuanced architectural
requirement: statuses are project-scoped, referenced by tasks, and user-editable —
requiring careful data model design to handle edits and deletes safely.

**Non-Functional Requirements:**
- Performance: Initial load < 3s; all interactions < 200ms; supports 10 concurrent users
- Security: bcrypt password hashing; session token validation on all authenticated endpoints; session expiry on inactivity; HTTPS in non-local environments; no cross-account data leakage
- Accessibility: Standard usable UI — keyboard-navigable forms, readable contrast (no WCAG compliance required for v1)
- Browser support: Chrome, Firefox, Safari, Edge (latest); no legacy browsers

**Scale & Complexity:**
- Primary domain: Full-stack web (SPA + REST API)
- Complexity level: Low
- Estimated architectural components: ~7 frontend feature modules, ~5 backend resource domains
- Team size: 5–7 users (single shared workspace, flat permissions)

### Technical Constraints & Dependencies

- SPA with client-side routing — no full page reloads
- Frontend communicates with backend via REST API
- No real-time (WebSockets) required for v1 — manual refresh acceptable
- Minimum supported viewport: 1280px wide; desktop-only
- Design system pre-selected: Tailwind CSS + shadcn/ui (Radix UI primitives)
- No mobile/tablet breakpoints required for v1
- Greenfield project — no legacy system integration

### Cross-Cutting Concerns Identified

- **Authentication & Session Management:** All API endpoints beyond registration/login require valid session tokens; session expiry must be enforced; affects every request
- **Optimistic UI + Error Revert:** Status changes update the UI before API confirmation and revert on failure — requires deliberate frontend state management
- **Per-Project Status Data Model:** Custom statuses are project-scoped and task-referenced; cascade behavior on status deletion needs architectural decision
- **Delete Confirmation Guards:** All destructive actions (tasks, projects) require one-step confirmation dialogs — a consistent pattern across the entire UI
- **Hover-Reveal Interaction Pattern:** Secondary/destructive card actions appear only on hover — requires consistent implementation across all card-type components

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web (SPA + REST API), greenfield. Technology preferences confirmed by user:
TypeScript throughout, React frontend, Express backend, PostgreSQL, Docker Compose for local dev.

### Approach: Custom Scaffolding with Official CLIs

No single community boilerplate matches the exact stack (React + Vite + Express + TypeScript +
PostgreSQL + Tailwind + shadcn/ui + Docker) without imposing unwanted trade-offs.
For this project's low complexity and clear stack decisions, official CLI scaffolding
per layer is cleaner and better maintained.

### Project Structure

```
bmad-tutorial-1/
├── frontend/          # Vite React SPA
├── backend/           # Express REST API
├── docker-compose.yml # Local dev orchestration
└── .env.example
```

### Initialization Commands

**Frontend:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npx shadcn@latest init   # Tailwind CSS + shadcn/ui (selects zinc theme, CSS variables)
```

**Backend:**
```bash
mkdir backend && cd backend
npm init -y
npm install express
npm install -D typescript @types/node @types/express ts-node-dev
npm install prisma @prisma/client
npx prisma init           # Creates prisma/schema.prisma + .env
```

**Docker Compose:**
```yaml
# docker-compose.yml — orchestrates all three services
services:
  postgres:   # PostgreSQL 16
  backend:    # Express API, hot-reload via ts-node-dev
  frontend:   # Vite dev server with HMR
```

**Note:** Project initialization using these commands should be the first implementation story.

### Architectural Decisions Provided by This Setup

**Language & Runtime:** TypeScript throughout (strict mode); Node.js 20+ LTS

**Frontend Build:** Vite 6 — fast HMR, optimized production bundles, native ESM

**Styling Solution:** Tailwind CSS (utility-first) + shadcn/ui (Radix UI primitives, zinc theme, CSS variables) — pre-decided by UX specification

**ORM:** Prisma — type-safe database client, migration system, schema-first design

**Backend Structure:** Express 5 with TypeScript — manual MVC structure (routes/controllers/services)

**Testing Framework:** Vitest (frontend, Vite-native), Jest or Vitest (backend) — to be configured

**Linting/Formatting:** ESLint + Prettier — to be configured per workspace

**Local Dev:** Docker Compose — postgres + backend + frontend all start with `docker compose up`

**Environment Config:** `.env` files per service; `.env.example` committed to repo

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Authentication strategy: JWT in httpOnly cookies
- Frontend state management: TanStack Query + React useState/Context
- Client-side routing: React Router v7
- Input validation: Zod (shared frontend + backend)

**Deferred Decisions (Post-MVP):**
- Deployment target and hosting strategy — not required for local Docker dev

---

### Data Architecture

**ORM & Migrations:** Prisma (schema-first, TypeScript-native)
- Single source of truth: `prisma/schema.prisma`
- Migrations via `prisma migrate dev` in development, `prisma migrate deploy` in production
- Prisma Client auto-generated on schema change

**Validation:** Zod — shared schema definitions used on both frontend (form validation) and backend (API request body validation). One schema per resource (e.g. `CreateTaskSchema`) used in both layers, eliminating duplication and drift between client and server contracts.

**Caching:** None for v1 — 10 concurrent users, low data volume; TanStack Query's in-memory cache covers perceived performance needs adequately.

**Status Cascade Rule:** When a custom status is deleted, tasks referencing it must be migrated to a default status (e.g. "To Do") before deletion is permitted. This must be enforced at the service layer, not the database layer, to surface a meaningful error.

---

### Authentication & Security

**Strategy:** JWT in httpOnly cookies
- Library: `jsonwebtoken` (token signing/verification) + `cookie-parser` (Express middleware)
- Token stored in httpOnly, SameSite=Strict cookie — inaccessible to JavaScript (XSS-safe)
- Token payload: `{ userId, email, iat, exp }`
- Expiry: configurable via `JWT_EXPIRY` env var (default: 7 days)
- Session persistence across browser refreshes: handled by cookie persistence
- All authenticated routes protected by `requireAuth` middleware that validates the token

**Password Hashing:** bcrypt (cost factor 12) — plaintext storage forbidden (from PRD NFR)

**CORS:** Configured to allow only the frontend origin in non-local environments

**Auth Endpoints (unauthenticated):**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (clears cookie)

**All other `/api/*` routes:** protected by `requireAuth` middleware

---

### API & Communication Patterns

**Style:** REST — resource-based routes, standard HTTP verbs

**URL Structure:**
```
/api/auth/*                    → Authentication
/api/users                     → Team member list
/api/projects                  → Project CRUD
/api/projects/:id/statuses     → Status management (project-scoped)
/api/tasks                     → Task CRUD
/api/tasks/:id/comments        → Comment management
```

**Standard Error Response Shape:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message", "details": {} } }
```

**Standard Success Response Shape:**
```json
{ "data": { ... } }   // single resource
{ "data": [ ... ] }   // collection
```

**Input Validation:** Zod schemas validated in Express route handlers before reaching controllers. Invalid requests return 400 with error details.

**API Versioning:** None for v1 — internal tool, team controls both client and server.

---

### Frontend Architecture

**State Management — Two Layers:**

1. **Server state** (tasks, projects, users, comments): TanStack Query (React Query)
   - Handles fetching, caching, background refetch, and optimistic updates with automatic rollback
   - Optimistic status updates: `useMutation` with `onMutate` (optimistic) + `onError` (revert) + `onSettled` (refetch)
   - One query key namespace per resource: `['projects']`, `['tasks', projectId]`, `['comments', taskId]`

2. **UI state** (panel open/closed, active filters, modal state): React `useState` and `useContext`
   - No global store (Zustand/Redux) — project scope does not warrant it
   - Task detail panel open state lives at the board page level

**Routing:** React Router v7
```
/               → Dashboard
/projects/:id   → Project board
/login          → Login page
/register       → Registration page
```
Task detail panel: overlay on `/projects/:id` — no separate route; panel open state managed via query param (`?task=123`) for deep-linking per UX spec.

**Component Organization:** Feature-based folders
```
src/
├── features/
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   ├── statuses/
│   └── comments/
├── components/     # Shared/global components
├── lib/            # API client, query client config
└── hooks/          # Shared custom hooks
```

**API Client:** Axios — configured with base URL from env, `credentials: 'include'` (sends cookies), and a response interceptor to redirect to /login on 401.

---

### Infrastructure & Deployment

**Local Development:** Docker Compose
- `postgres` service: PostgreSQL 16
- `backend` service: Express + ts-node-dev (hot reload on file change)
- `frontend` service: Vite dev server with HMR
- All services start with `docker compose up`
- Backend waits for postgres health check before starting

**Environment Configuration:**
- `.env` at repo root consumed by Docker Compose
- `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `PORT`, `FRONTEND_URL`
- `.env.example` committed; `.env` gitignored

**Deployment Target:** Deferred — architecture is Docker-ready for any hosting target

---

### Decision Impact Analysis

**Implementation Sequence:**
1. Docker Compose + PostgreSQL + backend scaffold
2. Prisma schema + initial migration
3. Auth endpoints (register, login, logout) + requireAuth middleware
4. Project, Task, Status, Comment CRUD endpoints
5. Frontend scaffold + React Router + TanStack Query setup
6. Feature implementation per UX spec

**Cross-Component Dependencies:**
- Auth cookie must be set before any frontend data fetching works
- Zod schemas defined in backend must be duplicated or shared (via a `shared/` package or copy) for frontend form validation
- TanStack Query optimistic updates depend on stable query key conventions — establish these early

## Implementation Patterns & Consistency Rules

**Critical conflict points identified:** 6 areas where agents could diverge without explicit rules.

---

### Naming Patterns

**Database Naming (Prisma schema):**
- Table names: `PascalCase` singular — `User`, `Project`, `Task`, `Status`, `Comment`
- Column names: `camelCase` — `createdAt`, `userId`, `projectId`
- Prisma maps these to snake_case in PostgreSQL automatically (`@@map` not needed)
- Foreign keys: `userId`, `projectId`, `taskId` — never `user_id` in Prisma schema

```prisma
// CORRECT
model Task {
  id          String   @id @default(cuid())
  title       String
  projectId   String
  assigneeId  String?
  statusId    String
  createdAt   DateTime @default(now())
}

// WRONG — don't use snake_case in Prisma models
model task {
  task_id    Int
  project_id Int
}
```

**API Naming:**
- All routes: plural, lowercase, kebab-case — `/api/projects`, `/api/tasks`, `/api/statuses`
- Route parameters: `:id` always (never `:projectId`, `:taskId` — use context from URL structure)
- Query parameters: `camelCase` — `?assigneeId=`, `?projectId=`
- No trailing slashes

```
GET  /api/projects                ✅
GET  /api/project                 ❌ (singular)
GET  /api/projects/:id/statuses   ✅
GET  /api/project-statuses        ❌ (wrong nesting)
```

**Code Naming:**
- React components: `PascalCase` — `TaskCard`, `BoardColumn`, `AppSidebar`
- Component files: `PascalCase.tsx` — `TaskCard.tsx`, `TaskDetailPanel.tsx`
- Hooks: `camelCase` with `use` prefix — `useProjects`, `useTasks`, `useOptimisticStatus`
- Utility/lib files: `camelCase` — `apiClient.ts`, `queryKeys.ts`
- Zod schemas: `PascalCase` with `Schema` suffix — `CreateTaskSchema`, `UpdateProjectSchema`
- Types/interfaces: `PascalCase` — `Task`, `Project`, `User` (match Prisma model names)
- Backend route files: `camelCase.routes.ts` — `tasks.routes.ts`, `projects.routes.ts`
- Backend service files: `camelCase.service.ts` — `tasks.service.ts`

---

### Structure Patterns

**Backend File Organization:**
```
backend/src/
├── routes/          # Express routers — one file per resource
│   ├── auth.routes.ts
│   ├── projects.routes.ts
│   ├── tasks.routes.ts
│   ├── statuses.routes.ts
│   └── comments.routes.ts
├── controllers/     # Request/response handling — one file per resource
├── services/        # Business logic — one file per resource
├── middleware/
│   ├── requireAuth.ts   # JWT validation middleware
│   └── validate.ts      # Zod validation middleware factory
├── lib/
│   └── prisma.ts    # Prisma client singleton
└── index.ts         # Express app entry point
```

**Frontend File Organization:**
```
frontend/src/
├── features/        # Feature-based folders
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── schemas.ts   # Zod schemas for auth forms
│   ├── projects/
│   ├── tasks/
│   ├── statuses/
│   └── comments/
├── components/      # Truly shared components only (not feature-specific)
├── lib/
│   ├── apiClient.ts     # Axios instance
│   └── queryKeys.ts     # TanStack Query key factory
├── hooks/           # Shared hooks only
└── main.tsx
```

**Test File Location:** Co-located with source files
```
tasks.service.ts
tasks.service.test.ts   ← same directory
TaskCard.tsx
TaskCard.test.tsx        ← same directory
```

---

### Format Patterns

**API Response — Always wrap:**
```json
// Success (single)
{ "data": { "id": "...", "title": "..." } }

// Success (collection)
{ "data": [ { "id": "..." } ] }

// Error
{ "error": { "code": "NOT_FOUND", "message": "Task not found" } }
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": { "title": "Required" } } }
```

**HTTP Status Codes — Strict usage:**
- `200` — successful GET, PUT/PATCH
- `201` — successful POST (resource created)
- `204` — successful DELETE (no body)
- `400` — validation error
- `401` — not authenticated
- `403` — authenticated but not authorized
- `404` — resource not found
- `500` — unexpected server error

**Date/Time:** Always ISO 8601 strings in API responses — `"2026-04-03T05:29:24.712Z"`
Never Unix timestamps. Frontend formats for display using `Intl.DateTimeFormat`.

**JSON Field Naming:** `camelCase` in all API responses (Prisma outputs camelCase by default)
```json
{ "createdAt": "...", "assigneeId": "...", "projectId": "..." }
```
Never `created_at`, `assignee_id` in API responses.

---

### Communication Patterns

**TanStack Query Key Factory** — all query keys defined in `lib/queryKeys.ts`, never inline:
```typescript
// queryKeys.ts — single source of truth
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  tasks: {
    byProject: (projectId: string) => ['tasks', projectId] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  comments: {
    byTask: (taskId: string) => ['comments', taskId] as const,
  },
  users: {
    all: ['users'] as const,
  },
}
```

**Optimistic Update Pattern** — standard shape for all mutations that update existing resources:
```typescript
useMutation({
  mutationFn: updateTaskStatus,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
    const previous = queryClient.getQueryData(queryKeys.tasks.byProject(projectId))
    queryClient.setQueryData(queryKeys.tasks.byProject(projectId), (old) => /* optimistic update */)
    return { previous }  // context for rollback
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(queryKeys.tasks.byProject(projectId), context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
  },
})
```

---

### Process Patterns

**Backend Error Handling:**
- All service-layer errors thrown as typed `AppError` class with `code` + `statusCode`
- One global error handler middleware in `index.ts` catches all errors and formats the response
- Never call `res.json()` in a catch block inside a route — always `next(error)`

```typescript
// CORRECT
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const task = await taskService.updateStatus(req.params.id, req.body)
    res.json({ data: task })
  } catch (err) {
    next(err)  // let global error handler format the response
  }
})
```

**Frontend Error Display:**
- API errors shown inline near the failed action — never full-page error states
- Error messages use `error.response.data.error.message` from the Axios response
- Auth errors (401) handled globally by Axios interceptor — redirect to `/login`
- All other errors surface in the component that triggered the action

**Loading States:**
- Use TanStack Query's `isLoading` / `isFetching` — never manual `useState<boolean>` for server data
- Skeleton components (shadcn/ui `Skeleton`) for initial board/list load
- Button `disabled` + spinner for mutation in-flight states
- Never block the entire page with a full-screen spinner

**Zod Validation Middleware (backend):**
```typescript
// validate.ts — reusable middleware factory
export const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten().fieldErrors }
    })
  }
  req.body = result.data
  next()
}

// Usage in routes:
router.post('/', requireAuth, validate(CreateTaskSchema), taskController.create)
```

---

### Enforcement Guidelines

**All AI agents MUST:**
- Use `queryKeys` factory from `lib/queryKeys.ts` — never inline string arrays as query keys
- Wrap all API responses in `{ data: ... }` or `{ error: ... }` — never return bare objects
- Use `next(err)` in route handlers — never catch-and-respond directly
- Name Prisma models in `PascalCase` singular
- Name API routes in plural kebab-case
- Co-locate test files with source files

**Anti-Patterns — Never do these:**
```typescript
// ❌ Inline query key
useQuery({ queryKey: ['tasks', projectId], ... })

// ✅ Use factory
useQuery({ queryKey: queryKeys.tasks.byProject(projectId), ... })

// ❌ Bare API response
res.json(task)

// ✅ Wrapped response
res.json({ data: task })

// ❌ Catch and respond
} catch (err) { res.status(500).json({ message: err.message }) }

// ✅ Delegate to global handler
} catch (err) { next(err) }
```

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Category | Frontend | Backend |
|---|---|---|
| User Management (FR1–5) | `features/auth/` | `routes/auth.routes.ts`, `services/auth.service.ts` |
| Project Management (FR6–10) | `features/projects/` | `routes/projects.routes.ts`, `services/projects.service.ts` |
| Task Management (FR11–16) | `features/tasks/` | `routes/tasks.routes.ts`, `services/tasks.service.ts` |
| Status Management (FR17–21) | `features/statuses/` | `routes/statuses.routes.ts`, `services/statuses.service.ts` |
| Task Assignment (FR22–24) | `features/tasks/` (task form) | `services/tasks.service.ts` (assigneeId field) |
| Team Collaboration (FR25–27) | `features/comments/` | `routes/comments.routes.ts`, `services/comments.service.ts` |
| Navigation & Discovery (FR28–31) | `features/tasks/components/BoardColumn.tsx`, `AssigneeFilterBar.tsx` | (read-only queries, no special routes) |

### Complete Project Directory Structure

```
bmad-tutorial-1/
├── .env                        # Local env vars (gitignored)
├── .env.example                # Committed env template
├── .gitignore
├── docker-compose.yml          # Orchestrates postgres + backend + frontend
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       # Single source of truth for data model
│   │   └── migrations/         # Auto-generated by prisma migrate dev
│   └── src/
│       ├── index.ts            # Express app setup, global middleware, error handler
│       ├── routes/             # One router per resource — mounts on index.ts
│       │   ├── auth.routes.ts
│       │   ├── projects.routes.ts
│       │   ├── tasks.routes.ts
│       │   ├── statuses.routes.ts
│       │   └── comments.routes.ts
│       ├── controllers/        # Req/res handling only — delegates to services
│       │   ├── auth.controller.ts
│       │   ├── projects.controller.ts
│       │   ├── tasks.controller.ts
│       │   ├── statuses.controller.ts
│       │   └── comments.controller.ts
│       ├── services/           # Business logic — calls Prisma client
│       │   ├── auth.service.ts
│       │   ├── projects.service.ts
│       │   ├── tasks.service.ts
│       │   ├── statuses.service.ts
│       │   └── comments.service.ts
│       ├── middleware/
│       │   ├── requireAuth.ts  # JWT cookie validation → attaches req.user
│       │   └── validate.ts     # Zod schema validation middleware factory
│       ├── schemas/            # Zod schemas for API request validation
│       │   ├── auth.schemas.ts
│       │   ├── projects.schemas.ts
│       │   ├── tasks.schemas.ts
│       │   ├── statuses.schemas.ts
│       │   └── comments.schemas.ts
│       ├── lib/
│       │   ├── prisma.ts       # Prisma client singleton (import everywhere)
│       │   └── AppError.ts     # Typed error class: { code, message, statusCode }
│       └── types/
│           └── express.d.ts    # Augments req.user type on Express Request
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── components.json         # shadcn/ui config
    ├── Dockerfile
    ├── index.html
    └── src/
        ├── main.tsx            # React root, QueryClientProvider, RouterProvider
        ├── App.tsx             # Route definitions (React Router v7)
        ├── features/           # Feature-based modules
        │   ├── auth/
        │   │   ├── components/
        │   │   │   ├── LoginForm.tsx
        │   │   │   └── RegisterForm.tsx
        │   │   ├── hooks/
        │   │   │   └── useAuth.ts      # Login/register/logout mutations + current user query
        │   │   └── schemas.ts          # Zod schemas: LoginSchema, RegisterSchema
        │   ├── projects/
        │   │   ├── components/
        │   │   │   ├── ProjectList.tsx         # Dashboard: list of all projects
        │   │   │   ├── ProjectCard.tsx          # Single project summary card
        │   │   │   └── CreateProjectModal.tsx   # FR6: create project dialog
        │   │   ├── hooks/
        │   │   │   └── useProjects.ts   # useQuery + useMutation for projects
        │   │   └── schemas.ts
        │   ├── tasks/
        │   │   ├── components/
        │   │   │   ├── BoardColumn.tsx          # FR28: status column with task cards
        │   │   │   ├── TaskCard.tsx             # Core card component
        │   │   │   ├── TaskDetailPanel.tsx      # FR16: right-side slide-in panel
        │   │   │   ├── CreateTaskModal.tsx      # FR11: create task dialog
        │   │   │   └── AssigneeFilterBar.tsx    # FR29: chip filter above board
        │   │   ├── hooks/
        │   │   │   ├── useTasks.ts              # useQuery + useMutation for tasks
        │   │   │   └── useOptimisticStatus.ts   # Optimistic status update mutation
        │   │   └── schemas.ts
        │   ├── statuses/
        │   │   ├── components/
        │   │   │   ├── StatusChip.tsx           # Clickable inline status badge
        │   │   │   └── StatusSettingsPanel.tsx  # FR18–20: manage project statuses
        │   │   ├── hooks/
        │   │   │   └── useStatuses.ts
        │   │   └── schemas.ts
        │   └── comments/
        │       ├── components/
        │       │   └── CommentThread.tsx        # FR25–27: comment list + input
        │       ├── hooks/
        │       │   └── useComments.ts
        │       └── schemas.ts
        ├── components/         # Shared components only
        │   ├── ui/             # shadcn/ui generated components (Button, Dialog, etc.)
        │   ├── AppSidebar.tsx  # 56px icon-only navigation sidebar
        │   ├── ConfirmDialog.tsx        # Reusable delete confirmation dialog (FR10, FR15)
        │   └── ProtectedRoute.tsx       # Redirects to /login if unauthenticated
        ├── lib/
        │   ├── apiClient.ts    # Axios instance: baseURL, credentials, 401 interceptor
        │   └── queryKeys.ts    # TanStack Query key factory (single source of truth)
        ├── hooks/
        │   └── useCurrentUser.ts   # Global auth state hook
        └── pages/              # Route-level page components
            ├── DashboardPage.tsx   # /  — project list
            ├── BoardPage.tsx       # /projects/:id — task board + optional TaskDetailPanel
            ├── LoginPage.tsx       # /login
            └── RegisterPage.tsx    # /register
```

### Architectural Boundaries

**API Boundary:**
- All frontend→backend communication goes through `lib/apiClient.ts`
- No component imports from `backend/` — strict separation
- Backend exposes only `/api/*` routes; Vite proxies `/api` to Express in dev

**Auth Boundary:**
- `requireAuth` middleware is the single enforcement point for all protected routes
- Frontend `ProtectedRoute` component wraps all non-auth pages
- 401 responses handled globally in Axios interceptor — no per-component auth checks

**Data Access Boundary:**
- Prisma client used only inside `services/` — never in controllers or routes
- Controllers call services; services call Prisma — no skipping layers

**State Boundary:**
- Server state (all API data): TanStack Query only
- UI state (panel open, filter selection): React useState/Context only
- No mixing: never store server responses in useState manually

### Integration Points

**Docker Compose Data Flow:**
```
Browser → Vite dev server (:5173) → proxy /api/* → Express (:3000) → Prisma → PostgreSQL (:5432)
```

**Auth Flow:**
```
POST /api/auth/login → Express sets httpOnly cookie →
All subsequent requests include cookie automatically →
requireAuth middleware validates JWT on every protected route
```

**Optimistic Status Update Flow:**
```
User clicks StatusChip → useOptimisticStatus.onMutate updates TanStack Query cache →
UI reflects change instantly → API call fires →
onError: cache reverted if failed → onSettled: cache invalidated (refetch)
```

**Status Deletion Cascade:**
```
DELETE /api/projects/:id/statuses/:statusId →
statuses.service.ts checks if any tasks reference this status →
If yes: reassign tasks to default "To Do" status first, then delete →
If no: delete directly
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices are mutually compatible.
Vite + React + React Router v7 + TanStack Query + Axios + Zod integrate natively.
Express + Prisma + PostgreSQL + JWT + bcrypt are a proven production combination.
Docker Compose orchestrates all three services without conflict.

**Pattern Consistency:** Naming conventions are internally consistent — PascalCase
Prisma models, camelCase TypeScript, plural kebab-case REST routes, PascalCase React
components. Response wrapping `{ data }` / `{ error }` applied uniformly. Error delegation
via `next(err)` + global handler is consistent throughout the backend layer.

**Structure Alignment:** Feature-based frontend folders align directly with TanStack Query
key namespaces and backend route/service files. Backend layers (routes → controllers →
services → Prisma) enforce clear separation. Docker Compose integrates all three services
as expected.

---

### Requirements Coverage Validation ✅

**All 31 Functional Requirements covered:**

| FR | Requirement | Covered By |
|---|---|---|
| FR1–3 | Register, login, logout | `auth.routes.ts`, `LoginForm.tsx`, `RegisterForm.tsx` |
| FR4 | Session persistence across refreshes | JWT in httpOnly cookie |
| FR5 | View team members | `GET /api/users`, `useAuth.ts` |
| FR6–10 | Project CRUD + delete confirmation | `projects` feature + `ConfirmDialog.tsx` |
| FR11–16 | Task CRUD + task detail view | `tasks` feature + `TaskDetailPanel.tsx` |
| FR17–21 | Status CRUD per project | `statuses` feature + `StatusSettingsPanel.tsx` |
| FR22–24 | Task assignment + unassign | `tasks` feature (assigneeId field, nullable) |
| FR25–27 | Comments with author + timestamp | `comments` feature + `CommentThread.tsx` |
| FR28 | Task board view grouped by status | `BoardColumn.tsx` |
| FR29 | Assignee filter on board | `AssigneeFilterBar.tsx` |
| FR30 | Navigate between projects | `AppSidebar.tsx` + `DashboardPage.tsx` |
| FR31 | Open task detail from board | `TaskCard.tsx` → `TaskDetailPanel.tsx` |

**Non-Functional Requirements covered:**
- Performance < 3s load: Vite production bundles + TanStack Query caching ✅
- Interactions < 200ms: Optimistic UI via `useOptimisticStatus.ts` ✅
- 10 concurrent users: Standard Express + PostgreSQL — no concern at this scale ✅
- bcrypt password hashing: `auth.service.ts` (cost factor 12) ✅
- Session token validation: `requireAuth.ts` middleware on all protected routes ✅
- Session expiry: `JWT_EXPIRY` env var (default 7 days) ✅
- HTTPS: Docker-ready; deferred to deployment configuration ✅
- No cross-account leakage: Single shared workspace — no multi-tenant isolation needed ✅

---

### Gap Analysis Results

**Important Gap Identified — Prisma Data Model not documented:**

Without explicit schema guidance, AI agents may make conflicting choices on field types,
nullability, and relationship structure. The following canonical data model closes this gap:

```prisma
model User {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  password  String    // bcrypt hash
  createdAt DateTime  @default(now())
  tasks     Task[]    @relation("assignee")
  comments  Comment[]
}

model Project {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime  @default(now())
  statuses  Status[]
  tasks     Task[]
}

model Status {
  id        String   @id @default(cuid())
  name      String
  color     String   // Tailwind color token e.g. "blue-500"
  order     Int      // display order within project
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  projectId   String
  statusId    String
  assigneeId  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  status      Status    @relation(fields: [statusId], references: [id])
  assignee    User?     @relation("assignee", fields: [assigneeId], references: [id])
  comments    Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  taskId    String
  authorId  String
  createdAt DateTime @default(now())
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
}
```

**Key schema decisions:**
- IDs: `cuid()` strings — URL-safe, no sequential enumeration risk
- Status deletion: `onDelete: Cascade` on Project→Status; tasks must have statusId reassigned before status deletion (enforced in service layer, not DB constraint)
- Task deletion: `onDelete: Cascade` on Project→Task and Task→Comment
- `assigneeId` is nullable — tasks can be unassigned (FR24)
- `description` is nullable — only title required (FR11)
- Default statuses seeded per project on creation (To Do, In Progress, In Review, Done)

---

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (low, 5–7 users)
- [x] Technical constraints identified (desktop SPA, no real-time, no mobile)
- [x] Cross-cutting concerns mapped (auth, optimistic UI, status cascade, delete guards)

**✅ Architectural Decisions**
- [x] Critical decisions documented (JWT auth, TanStack Query, React Router v7, Zod)
- [x] Technology stack fully specified with rationale
- [x] Integration patterns defined (Docker Compose, Axios proxy, cookie-based auth)
- [x] Performance considerations addressed (optimistic UI, TanStack Query cache)

**✅ Implementation Patterns**
- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (backend layers, frontend features)
- [x] Communication patterns specified (query key factory, optimistic update shape)
- [x] Process patterns documented (error handling, loading states, validation middleware)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped (auth flow, optimistic update flow, status cascade)
- [x] Requirements to structure mapping complete (all 31 FRs)

**✅ Data Model**
- [x] Prisma schema documented with all models and relationships
- [x] ID strategy defined (cuid strings)
- [x] Nullability decisions documented
- [x] Cascade deletion behavior specified

---

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Every FR maps to a named file in the project structure
- Optimistic UI pattern is fully specified with rollback — the highest-risk UX requirement
- Status deletion cascade is explicitly handled at the service layer
- Naming conventions eliminate ambiguity for AI agents across all layers
- Data model is fully specified — no schema decisions left to agent interpretation

**Areas for Future Enhancement (post-MVP):**
- API versioning if the app grows beyond the team
- Logging strategy (Winston or Pino for structured logs)
- End-to-end test setup (Playwright)
- CI/CD pipeline definition

### Implementation Handoff

**First Implementation Story:** Docker Compose scaffold + PostgreSQL + backend init + Prisma schema migration

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use the query key factory from `lib/queryKeys.ts` — never inline
- Use `next(err)` in all route handlers — never catch-and-respond
- Wrap all API responses in `{ data }` or `{ error }` — never bare objects
- The Prisma schema above is canonical — do not alter field names or types without updating this document
