---
project_name: bmad-tutorial-1
user_name: Diyor
date: '2026-04-04'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: complete
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Frontend
- React 19.2 + ReactDOM 19.2
- Vite 8.0 (build + dev server + HMR)
- TypeScript ~5.9 (strict mode)
- Tailwind CSS 4.2 (utility-first, v4 new CSS-based config)
- shadcn/ui 4.1 (zinc theme, CSS variables, Radix primitives via @base-ui/react)
- React Router 7.14 (BrowserRouter, client-side routing)
- TanStack Query 5.96 (server state management)
- Axios 1.14 (HTTP client with credentials + 401 interceptor)
- Zod 4.3 (form validation, shared schemas with backend)
- lucide-react (icons)

### Backend
- Express 5.2 (note: v5, not v4 — `req.params` values are `string | string[]`)
- TypeScript ^6.0 (strict mode, commonjs module)
- Prisma 7.6 with @prisma/adapter-pg (driver adapter required — no direct connection)
- PostgreSQL 16 (via pg pool)
- Zod 4.3 (request body validation middleware)
- jsonwebtoken 9.0 + bcrypt 6.0 (JWT auth, cost factor 12)
- cookie-parser 1.4

### Infrastructure
- Docker Compose: postgres + backend (ts-node-dev) + frontend (Vite)
- All services start with `docker compose up`
- Frontend on port 5174 (mapped from 5173), backend on port 3000
- Vite proxies `/api/*` to backend

---

## Critical Implementation Rules

### API Response Format (NEVER deviate)

```typescript
// Success
{ data: { ... } }        // single resource
{ data: [ ... ] }        // collection

// Error
{ error: { code: "NOT_FOUND", message: "Task not found" } }
{ error: { code: "VALIDATION_ERROR", message: "Invalid input", details: { ... } } }
```

- **NEVER** return bare objects from API endpoints
- HTTP status codes: 200 (GET/PATCH), 201 (POST), 204 (DELETE), 400, 401, 404, 500

### Error Handling Pattern

```typescript
// CORRECT — delegate to global error handler
} catch (err) { next(err) }

// WRONG — never catch-and-respond in route handlers
} catch (err) { res.status(500).json({ message: err.message }) }
```

- All service-layer errors thrown as `AppError(code, statusCode, message)`
- Validation errors thrown as `ValidationError(details)` via validate middleware
- One global error handler in `index.ts` catches everything

### Zod Validation

- All write endpoints (POST/PATCH/PUT) use `validate(Schema)` middleware
- All string fields: `.trim().min(1).max(N)` — always trim, always cap length
- Schemas defined inline in route files (not shared between frontend/backend)

### Express v5 Gotcha

```typescript
// req.params values are string | string[] in Express 5
// Always cast: req.params.id as string
```

### Prisma 7 — Driver Adapter Required

```typescript
// Prisma 7 requires explicit adapter — cannot just pass DATABASE_URL
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
```

- Generated client imports from `../generated/prisma/client` (not `@prisma/client`)
- After schema changes: run `npx prisma generate` to regenerate

### Authentication Pattern

- JWT stored in httpOnly, SameSite=Strict cookie (not localStorage)
- `requireAuth` middleware validates token, sets `req.user = { userId, email }`
- All routes except `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/health` are protected
- Password hashing: bcrypt with cost factor 12
- Email normalized to lowercase before store/lookup
- Env vars `JWT_SECRET` and `DATABASE_URL` validated at startup — server exits if missing

### Frontend State Management

**Server state — TanStack Query:**
- Query key factory in `lib/queryKeys.ts` — **NEVER** inline query key arrays
- One namespace per resource: `queryKeys.projects.all`, `queryKeys.tasks.byProject(id)`, etc.
- Optimistic updates: `onMutate` (optimistic) → `onError` (revert) → `onSettled` (refetch)
- When optimistically updating nested objects (e.g., task.status), update the nested object too — don't just spread flat fields

**UI state — React useState/useContext:**
- No global store (no Redux/Zustand) — project scope doesn't warrant it
- Panel open state, active filters, modal state managed locally

### API Client Setup

```typescript
// lib/apiClient.ts
const apiClient = axios.create({ baseURL: '/api', withCredentials: true })
// 401 interceptor redirects to /login (except /auth/ routes)
```

### Routing

```
/               → Dashboard
/projects/:id   → Project board (with ?task=<id> for detail panel)
/login          → Login page
/register       → Registration page
```

- `ProtectedRoute` wraps all authenticated routes
- Task detail panel uses URL query param `?task=<id>` for deep-linking (not a separate route)

---

## Code Organization

### Backend Structure

```
backend/src/
├── index.ts              # Express app, route mounting, global error handler
├── lib/                  # prisma.ts, AppError.ts
├── middleware/            # requireAuth.ts, validate.ts
├── routes/               # [domain].routes.ts — one per resource
├── services/             # [domain].service.ts — business logic
└── generated/prisma/     # Auto-generated Prisma client
```

### Frontend Structure

```
frontend/src/
├── features/             # Feature-based folders
│   ├── auth/             # components/, hooks/, schemas.ts
│   ├── projects/         # components/, hooks/
│   └── tasks/            # components/, hooks/
├── components/           # Shared: AppSidebar, ErrorBoundary, ui/
├── lib/                  # apiClient, queryClient, queryKeys, utils
└── main.tsx              # QueryClientProvider + App
```

### Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| React components | PascalCase.tsx | `TaskCard.tsx`, `BoardColumn.tsx` |
| Hooks | camelCase with `use` prefix | `useTasks.ts`, `useAuth.ts` |
| Backend routes | `[domain].routes.ts` | `tasks.routes.ts` |
| Backend services | `[domain].service.ts` | `tasks.service.ts` |
| Zod schemas | PascalCase + Schema suffix | `CreateTaskSchema` |
| API routes | plural, lowercase | `/api/projects`, `/api/tasks` |
| Prisma models | PascalCase singular | `User`, `Project`, `Task` |
| UI components | kebab-case in ui/ folder | `dropdown-menu.tsx` |

---

## Anti-Patterns (NEVER do these)

```typescript
// ❌ Inline query key
useQuery({ queryKey: ['tasks', projectId], ... })
// ✅ Use factory
useQuery({ queryKey: queryKeys.tasks.byProject(projectId), ... })

// ❌ Bare API response
res.json(task)
// ✅ Wrapped response
res.json({ data: task })

// ❌ Catch and respond in route
} catch (err) { res.status(500).json({ message: err.message }) }
// ✅ Delegate to global handler
} catch (err) { next(err) }

// ❌ Manual loading state for server data
const [loading, setLoading] = useState(true)
// ✅ Use TanStack Query's isLoading
const { data, isLoading } = useQuery(...)

// ❌ Full-page spinner
// ✅ Skeleton loading states (shadcn Skeleton, zinc-200 shimmer)
```

---

## Security Rules

- Validate `JWT_SECRET` and `DATABASE_URL` exist at startup
- All text inputs: trim + min(1) + max(N) via Zod
- Passwords: bcrypt cost 12, never returned in API responses
- JWT in httpOnly SameSite=Strict cookie — never in localStorage
- CORS configured with explicit `FRONTEND_URL` origin
- Cross-project statusId validated on task create/update
- Status deletion wrapped in transaction (reassign tasks → delete)

---

## Known Deferred Items

- No authorization/ownership model — flat team workspace (intentional per PRD)
- No pagination on list endpoints (acceptable for 10-user MVP)
- JWT not invalidated server-side on logout (standard JWT trade-off)
- TOCTOU race on find-then-update/delete (catch Prisma P2025 in future)
- Default status protection uses name-matching ("To Do") instead of isDefault flag
- No test framework configured yet

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-04-04
