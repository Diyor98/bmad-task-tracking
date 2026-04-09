# Deferred Work

## Deferred from: code review (2026-04-06)

- TOCTOU race in all service methods (findUnique then mutate) — between existence check and mutation, another request could delete the record causing unhandled Prisma error. Low-risk at current scale.
- Race condition in status order calculation — concurrent status creates for same project get duplicate order values. No unique constraint on order.
- Assignee selector uses native `<select>` instead of DropdownMenu component per UX spec — cosmetic, works correctly.
- Assignee filter chips don't show avatar initials per UX-DR10 — cosmetic enhancement.
- No CORS origin restriction (`cors()` with no options) — acceptable for local dev, must configure origin before production.
- Validate middleware only validates `req.body` — route params and query params unvalidated. Defense-in-depth gap, Prisma parameterizes queries.
- No UUID format validation on route params — malformed IDs cause Prisma errors instead of clean 404s.

## Deferred from: code review of 7-1-drag-and-drop-task-reordering (2026-04-09)

- Race condition in concurrent reorders — read-then-write without row locking; two simultaneous reorders can corrupt positions. Low-risk at MVP scale (10 users).
- Race condition in concurrent creates — duplicate positions possible when two tasks created simultaneously in same column. No unique constraint on (statusId, position).
- Missing composite index on (projectId, statusId, position) — performance optimization for queries that filter/sort by position. Not needed at current scale.
- No project-membership authorization on reorder endpoint — follows pre-existing pattern where any authenticated user can mutate any task by ID. Intentional per PRD (flat team workspace).

## Deferred from: code review of 7-2-task-search-and-multi-filter (2026-04-09)

- Stale status IDs in filter Set after status deletion — if user deletes a status while statusFilter contains it, the phantom filter persists invisibly. Only clearFilters removes it. Rare at MVP scale.
- projectId! non-null assertion passes undefined to mutation hooks if route param missing — pre-existing pattern, guarded by early returns and query `enabled` flags.
