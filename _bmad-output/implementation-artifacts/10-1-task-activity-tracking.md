# Story 10.1: Task Activity Tracking

Status: done

## Story

As a team member,
I want to see an auto-generated activity log on each task showing all changes (field updates, assignments, status changes),
so that I can understand the full history of a task without asking teammates what happened.

## Acceptance Criteria

1. An Activity model stores change history: who changed what, old value, new value, and when
2. Activity entries are auto-generated when a task field changes (title, description, status, assignee, priority, due date)
3. An "Activity" section in the TaskDetailPanel displays the change log in chronological order (newest first)
4. Each activity entry shows: user name, action description, old → new values (when applicable), and relative timestamp
5. Task creation generates an initial "created this task" activity entry
6. Activity entries persist in the database and survive page refreshes
7. Activity updates appear in real time via SSE (activity:created event)
8. The activity log is read-only — users cannot edit or delete activity entries
9. Existing board functionality (drag-and-drop, search, filters, attachments, notifications, SSE) is not broken

## Tasks / Subtasks

- [x] Task 1: Activity model with cascade delete, Task/User relations, migration applied
- [x] Task 2: activities.service.ts (create with SSE emit, listByTask), activities.routes.ts (GET /tasks/:taskId/activities), mounted in index.ts
- [x] Task 3: Auto-generation in tasksService — create() logs "created", update() compares 6 fields (title, description, status, assignee, priority, dueDate) with human-readable old/new values
- [x] Task 4: activities.byTask query key, useActivities hook, useSSE handles activity:created with taskId-specific invalidation
- [x] Task 5: ActivitySection component with avatar initials, formatted action text, relative time. Added to TaskDetailPanel after attachments, before comments
- [x] Task 6: TypeScript + ESLint pass. API tested: create generates "created", update generates per-field entries with correct old/new values

### Review Findings

- [x] [Review][Patch] Description activity recorded null/null — now stores actual old/new description values [tasks.service.ts, ActivitySection.tsx]
- [x] [Review][Defer] N+1 queries for status/assignee name resolution in activity tracking — acceptable at MVP
- [x] [Review][Defer] No authorization on activity list endpoint — pre-existing flat workspace pattern
- [x] [Review][Defer] Activity list capped at 50 with no pagination — acceptable at MVP scale

## Dev Notes

### Activity Model (Prisma)

```prisma
model Activity {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  action    String   // "created", "title", "description", "status", "assignee", "priority", "dueDate"
  oldValue  String?
  newValue  String?
  createdAt DateTime @default(now())
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
}
```

### Activity Generation Pattern

```typescript
// In tasksService.update(), after fetching old task:
const changes: { action: string; oldValue: string | null; newValue: string | null }[] = []

if (data.title && data.title !== task.title) {
  changes.push({ action: 'title', oldValue: task.title, newValue: data.title })
}
if (data.statusId && data.statusId !== task.statusId) {
  const oldStatus = await prisma.status.findUnique({ where: { id: task.statusId } })
  const newStatus = await prisma.status.findUnique({ where: { id: data.statusId } })
  changes.push({ action: 'status', oldValue: oldStatus?.name ?? null, newValue: newStatus?.name ?? null })
}
// ... similar for assignee, priority, dueDate, description

for (const change of changes) {
  await activitiesService.create({
    taskId: id, userId: currentUserId!, ...change
  })
}
```

### Action Display Text

| action | Display |
|--------|---------|
| `created` | "created this task" |
| `title` | "changed title from '{old}' to '{new}'" |
| `description` | "updated the description" |
| `status` | "changed status from {old} to {new}" |
| `assignee` | "assigned to {new}" / "unassigned {old}" |
| `priority` | "set priority to {new}" / "removed priority" |
| `dueDate` | "set due date to {new}" / "removed due date" |

### ActivitySection Layout

```
┌──────────────────────────────────────┐
│ Activity                             │
│                                      │
│ AB  changed status from To Do        │
│     to In Progress          2m ago   │
│                                      │
│ AB  assigned to Alice       1h ago   │
│                                      │
│ AB  created this task       1h ago   │
└──────────────────────────────────────┘
```

### Existing Files to Modify

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add Activity model, Task/User relations |
| `backend/src/index.ts` | Mount activity routes |
| `backend/src/services/tasks.service.ts` | Auto-generate activity entries on create/update |
| `frontend/src/lib/queryKeys.ts` | Add activities.byTask |
| `frontend/src/hooks/useSSE.ts` | Handle activity:created event |
| `frontend/src/features/tasks/components/TaskDetailPanel.tsx` | Add ActivitySection |

### New Files

| File | Purpose |
|------|---------|
| `backend/src/services/activities.service.ts` | Activity CRUD |
| `backend/src/routes/activities.routes.ts` | GET /tasks/:taskId/activities |
| `frontend/src/features/tasks/hooks/useActivities.ts` | TanStack Query hook |
| `frontend/src/features/tasks/components/ActivitySection.tsx` | Activity log UI |

### What NOT to Do

- Do NOT track position/reorder changes — too noisy
- Do NOT allow editing or deleting activity entries — read-only audit trail
- Do NOT add pagination — limit to last 50 entries per task
- Do NOT track attachment or comment changes in activity — those are visible in their own sections

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Task 1: Activity model with taskId, userId, action, oldValue, newValue. Cascade delete on Task. Relations on User and Task
- Task 2: Service emits activity:created SSE events with projectId. Route returns activities ordered newest first, limit 50, includes user name
- Task 3: create() passes currentUserId for "created" entry. update() detects changes across 6 fields — resolves status names and user names from DB, formats dates as YYYY-MM-DD
- Task 4: useSSE parses activity:created event data to extract taskId for targeted query invalidation
- Task 5: ActivitySection with formatAction switch for 7 action types, getInitials for avatar, formatRelativeTime
- Task 6: All endpoints verified — activity log correctly shows chronological changes

### File List

- backend/prisma/schema.prisma (modified — Activity model, Task/User relations)
- backend/prisma/migrations/20260410064128_add_activity_model/migration.sql (new)
- backend/src/services/activities.service.ts (new — create with SSE, listByTask)
- backend/src/routes/activities.routes.ts (new — GET /tasks/:taskId/activities)
- backend/src/index.ts (modified — mounted activity routes)
- backend/src/services/tasks.service.ts (modified — activity generation on create/update)
- backend/src/routes/tasks.routes.ts (modified — pass currentUserId to create)
- frontend/src/lib/queryKeys.ts (modified — activities.byTask)
- frontend/src/features/tasks/hooks/useActivities.ts (new — query hook)
- frontend/src/features/tasks/components/ActivitySection.tsx (new — activity log UI)
- frontend/src/features/tasks/components/TaskDetailPanel.tsx (modified — added ActivitySection)
- frontend/src/hooks/useSSE.ts (modified — handle activity:created events)
