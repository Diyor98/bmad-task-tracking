# Deferred Work

## Deferred from: code review (2026-04-06)

- TOCTOU race in all service methods (findUnique then mutate) — between existence check and mutation, another request could delete the record causing unhandled Prisma error. Low-risk at current scale.
- Race condition in status order calculation — concurrent status creates for same project get duplicate order values. No unique constraint on order.
- Assignee selector uses native `<select>` instead of DropdownMenu component per UX spec — cosmetic, works correctly.
- Assignee filter chips don't show avatar initials per UX-DR10 — cosmetic enhancement.
- No CORS origin restriction (`cors()` with no options) — acceptable for local dev, must configure origin before production.
- Validate middleware only validates `req.body` — route params and query params unvalidated. Defense-in-depth gap, Prisma parameterizes queries.
- No UUID format validation on route params — malformed IDs cause Prisma errors instead of clean 404s.
