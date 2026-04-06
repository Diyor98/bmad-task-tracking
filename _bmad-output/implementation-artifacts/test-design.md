---
type: test-design
date: 2026-04-06
status: complete
framework: playwright
scope: full-application
---

# Test Design — bmad-tutorial-1

## Test Strategy

### Approach
- **E2E tests** via Playwright targeting the full stack (frontend + backend + database)
- Tests run against Docker Compose environment (postgres + backend + frontend)
- API-level tests for backend service validation
- Browser-level tests for critical user journeys

### Risk-Based Priority

| Priority | Area | Risk | Test Coverage |
|----------|------|------|--------------|
| P0 | Authentication | Data access without auth, session handling | Register, login, logout, protected routes, 401 redirect |
| P0 | Task CRUD | Core value prop — data loss or corruption | Create, read, update, delete tasks with confirmation |
| P0 | Project CRUD | Foundation for all task operations | Create, list, edit, delete projects with confirmation |
| P1 | Status management | Default status protection, task reassignment | Status change, custom status CRUD, default protection |
| P1 | Task board | Primary UI — visual correctness | Board columns, status grouping, assignee filtering |
| P2 | Comments | Collaboration feature | Create comment, chronological display |
| P2 | Assignment | Team collaboration | Assign, reassign, unassign, filter by assignee |
| P3 | Edge cases | Resilience | Empty states, long inputs, concurrent ops |

### Test Types

1. **API Tests** — Direct HTTP calls to backend endpoints, validating response format, status codes, error handling
2. **E2E Tests** — Browser automation covering critical user journeys end-to-end
3. **Smoke Tests** — Minimal subset for CI gate (health check, register, login, create project, create task)

## Test Suites

### Suite 1: Authentication (P0)
- `auth.register` — Register with valid credentials, duplicate email rejection, validation errors
- `auth.login` — Login with valid/invalid credentials, session persistence across refresh
- `auth.logout` — Logout clears session, subsequent API calls redirect to login
- `auth.protected` — Unauthenticated access redirected to login

### Suite 2: Projects (P0)
- `projects.create` — Create project, verify on dashboard, default statuses created
- `projects.list` — Dashboard shows all projects with task counts
- `projects.edit` — Rename project, verify updated
- `projects.delete` — Delete with confirmation dialog, verify removed

### Suite 3: Tasks (P0)
- `tasks.create` — Create task in specific status column, verify on board
- `tasks.detail` — Open task detail panel, verify all fields
- `tasks.edit` — Edit title/description from detail panel
- `tasks.delete` — Delete with confirmation, verify removed from board
- `tasks.status-change` — Change status via chip dropdown, verify column move

### Suite 4: Status Management (P1)
- `statuses.defaults` — Verify 4 default statuses exist on new project
- `statuses.create` — Add custom status, verify column appears
- `statuses.rename` — Rename status, verify board updates
- `statuses.delete` — Delete custom status, tasks reassigned to fallback
- `statuses.protect-defaults` — Default statuses cannot be deleted (no delete button)

### Suite 5: Collaboration (P2)
- `comments.create` — Add comment to task, verify display with author and timestamp
- `assignment.assign` — Assign task to user, verify avatar on card
- `assignment.filter` — Filter board by assignee, verify filtered results
- `assignment.unassign` — Clear assignment

### Suite 6: API Validation (P1)
- `api.response-format` — All endpoints return `{ data }` or `{ error }` wrapper
- `api.validation` — Invalid bodies return 400 with validation details
- `api.auth-required` — Protected endpoints return 401 without token
- `api.not-found` — Missing resources return 404

## Test Data Strategy

- Each test suite uses a fresh user registered at setup
- Projects created per-test to avoid cross-test contamination
- No shared mutable state between tests
- Database reset between full test runs (via Prisma migrate reset)

## CI Integration Plan

- Smoke tests run on every PR
- Full suite runs nightly or on merge to main
- Tests containerized alongside app via Docker Compose
