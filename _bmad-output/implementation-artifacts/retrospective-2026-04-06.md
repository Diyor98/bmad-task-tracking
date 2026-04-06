---
type: retrospective
scope: all-epics
date: 2026-04-06
epics_covered: [1, 2, 3, 4, 5, 6]
status: complete
---

# Retrospective — All Epics (1–6)

## Summary

All 6 epics (19 stories) were implemented in a single sprint cycle from 2026-04-03 to 2026-04-06. Two rounds of adversarial code review were conducted, producing 17 + 24 fixes respectively. The application is a React + Express + PostgreSQL task tracker with full CRUD, auth, board view, status management, and collaboration features.

## What Went Well

### Planning Quality
- PRD, architecture, UX spec, and epics were thorough — very few ambiguities surfaced during implementation
- Architecture decisions (API response wrapping, error handling via next(err), query key factory) translated directly into clean, consistent code
- UX design directions provided specific enough guidance (color tokens, component choices, interaction patterns) to avoid bikeshedding

### Implementation Velocity
- All 6 epics implemented in rapid succession with clean commits per epic group
- Feature-based frontend organization and domain-based backend organization kept files discoverable
- Prisma 7 + Express 5 + React 19 stack worked well together once initial adapter issues were resolved

### Code Review Effectiveness
- Three-layer parallel review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) caught substantive issues that single-pass review would miss
- Deduplication across layers confirmed high-signal findings (issues flagged by 2+ agents were consistently real)
- Structured triage (decision-needed / patch / defer / dismiss) prevented review fatigue

## What Didn't Go Well

### Prisma 7 Driver Adapter Surprise
- Prisma 7 requires explicit `@prisma/adapter-pg` with pg.Pool — not documented in the architecture spec
- Caused startup failure that required dependency installation and `prisma.ts` rewrite
- **Lesson:** When specifying exact library versions in architecture, verify breaking changes in major versions

### Sprint Status Tracking Drift
- Sprint status yaml was created at planning time but never updated during implementation
- All 6 epics were done but status file still showed Epic 1 in-progress, Epics 2–6 in backlog
- **Lesson:** Automate status updates as part of the dev-story workflow, or update at each commit

### Status Deletion Design Gap
- Original design used name-matching ("To Do") to protect default statuses from deletion
- This broke after rename, and only protected 1 of 4 defaults
- Required schema migration (`isDefault` flag) in code review to fix properly
- **Lesson:** When protecting "special" records, use a persistent flag rather than matching on mutable display text

### Missing Test Infrastructure
- No test framework was scaffolded as part of any epic
- All validation was manual (Docker Compose + curl/browser)
- **Lesson:** Include test framework setup in Epic 1 (Foundation) or as a separate prerequisite epic

## Metrics

| Metric | Value |
|--------|-------|
| Epics completed | 6/6 |
| Stories completed | 19/19 |
| Total commits | 7 |
| Code review rounds | 2 |
| Findings fixed | 41 (17 + 24) |
| Items deferred | 7 |
| Lines of code (approx) | ~3,400 |
| Backend files | 15 |
| Frontend files | 22 |

## Deferred Items (Carried Forward)

1. TOCTOU race conditions in service methods (low risk at current scale)
2. Status order race on concurrent creates
3. Assignee selector should use DropdownMenu per UX spec
4. Assignee filter chips missing avatar initials
5. CORS origin must be configured before production
6. Route param validation (defense-in-depth)
7. UUID format validation on route params

## Recommendations for Next Cycle

1. **Add test infrastructure immediately** — Playwright for E2E, Vitest for unit tests
2. **Configure CORS properly** before any non-local deployment
3. **Address TOCTOU races** if scaling beyond single-user testing
4. **Consider WebSocket/SSE** for real-time updates if collaboration usage grows
5. **Add rate limiting** on auth endpoints before production
