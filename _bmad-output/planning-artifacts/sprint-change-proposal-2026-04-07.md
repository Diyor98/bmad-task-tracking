---
type: sprint-change-proposal
date: 2026-04-07
status: approved
scope: moderate
trigger: Phase 2 feature expansion
---

# Sprint Change Proposal — Phase 2 Features

## 1. Issue Summary

**Trigger:** MVP (Phase 1) is complete — all 6 epics implemented, 2 code reviews passed, production Docker verified. The team is ready to proceed with Phase 2 features to improve daily usability and collaboration.

**Features requested:**
1. Drag-and-drop task reordering on the board
2. Task search and multi-criteria filtering
3. Due dates and priority levels
4. File attachments on tasks
5. In-app notifications
6. Real-time board updates via SSE

**Context:** 5 of 6 features were already scoped in the PRD under "Growth — Phase 2". Drag-and-drop and real-time updates are new additions beyond original scope.

## 2. Impact Analysis

### Epic Impact
- **Existing epics (1–6):** No changes needed. All complete and stable.
- **New epics:** 4 new epics with 6 stories added.

### Story Impact
- No existing stories modified.
- 6 new stories created across 4 epics.

### Artifact Changes Required

| Artifact | Change Type | Details |
|----------|------------|---------|
| PRD | Extend | Add FR32–FR46 (15 new functional requirements) |
| PRD | Extend | Add NFR9–NFR13 (5 new non-functional requirements) |
| Architecture | Extend | 3 new models (Attachment, Notification, Activity), 3 new Task fields, SSE endpoint, file storage |
| UX Spec | Extend | Drag-and-drop, search bar, priority/due date indicators, notifications UI, activity log |
| Epics | Extend | Add Epics 7–10 with Stories 7.1–10.1 |
| Docker | Modify | Add uploads volume, STORAGE_BACKEND env var |
| CI Pipeline | Modify | Add file storage setup for E2E tests |
| Project Context | Refresh | Update after implementation |

### Technical Impact
- **New dependencies:** @dnd-kit/core, @dnd-kit/sortable, multer
- **New infrastructure:** File storage (local disk / S3), SSE event bus
- **Schema changes:** 3 new models + 3 fields on Task (4 migrations)
- **No breaking changes** to existing code or APIs

## 3. Recommended Approach

**Selected: Direct Adjustment** — Add 4 new epics to the existing plan.

**Rationale:**
- MVP is complete and stable — no rework or rollback needed
- All new features are additive — they extend existing models and UI
- Original architecture patterns (API response wrapping, error handling, TanStack Query) apply directly
- Risk is low — each epic is independently shippable

**Effort estimate:** Medium (4 epics, 6 stories)
**Risk level:** Low
**Timeline impact:** None on MVP — this is Phase 2

## 4. Detailed Change Proposals

### 4.1 PRD Changes

**Add after FR31:**
- FR32–FR35: Board enhancements (drag-and-drop, search, multi-filter)
- FR36–FR40: Task enrichment (due dates, priority, file attachments)
- FR41–FR44: Notifications (in-app, real-time via SSE)
- FR45–FR46: Activity log (auto-generated change tracking)

**Add after existing NFRs:**
- NFR9–NFR11: File storage constraints (10MB limit, supported types, storage backend)
- NFR12–NFR13: Real-time constraints (2s propagation, auto-reconnect)

### 4.2 Architecture Changes

**New Prisma models:**
- `Attachment` — file metadata (filename, fileKey, fileSize, mimeType, taskId, uploaderId)
- `Notification` — in-app notifications (userId, type, message, taskId, read)
- `Activity` — change log entries (taskId, userId, action, oldValue, newValue)

**Task model additions:**
- `dueDate` (DateTime, optional)
- `priority` (String, optional — low/medium/high/urgent)
- `position` (Int — sort order within column)

**New infrastructure:**
- multer middleware for file uploads
- SSE endpoint at GET /api/events?projectId=
- File storage: local disk (uploads/) for dev, S3-compatible via STORAGE_BACKEND env

### 4.3 UX Changes

- @dnd-kit drag-and-drop on board with ghost card overlay
- Search bar + multi-filter bar (keyword + status + assignee)
- Priority dot and due date badge on TaskCard
- Attachments section and activity log in TaskDetailPanel
- Bell icon with notification dropdown in sidebar

### 4.4 Epic & Story Breakdown

| Epic | Stories | Focus |
|------|---------|-------|
| Epic 7: Board Enhancements | 7.1 Drag-and-drop, 7.2 Search & filter | UX improvements |
| Epic 8: Task Enrichment | 8.1 Due dates & priority, 8.2 File attachments | Data model expansion |
| Epic 9: Notifications & Real-Time | 9.1 In-app notifications, 9.2 SSE board updates | Event infrastructure |
| Epic 10: Activity Log | 10.1 Task activity tracking | Audit trail |

**Recommended order:** 7 → 8 → 9 → 10

## 5. Implementation Handoff

### Scope Classification: Moderate

Requires backlog reorganization — new epics, stories, and sprint planning before development begins.

### Handoff Plan

| Step | Agent/Role | Action |
|------|-----------|--------|
| 1 | **John** (PM) | Update PRD with FR32–FR46 and NFR9–NFR13 |
| 2 | **Sally** (UX) | Update UX spec with new components and interactions |
| 3 | **Winston** (Architect) | Update architecture doc with new models and infrastructure |
| 4 | **Bob** (SM) | Update epics.md with Epics 7–10, run sprint planning |
| 5 | **Amelia** (Dev) | Implement stories sequentially via dev-story workflow |
| 6 | **Review agents** | Code review after each epic |
| 7 | **Quinn** (QA) | Generate E2E tests for new features |

### Success Criteria
- All 6 stories pass code review
- E2E tests cover all new features
- No regressions in existing MVP functionality
- Production Docker build succeeds with new infrastructure
