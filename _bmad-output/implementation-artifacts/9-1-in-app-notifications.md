# Story 9.1: In-App Notifications

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a team member,
I want to receive in-app notifications when tasks are assigned to me, task statuses change, or someone comments on my tasks,
so that I stay informed about relevant activity without constantly checking the board.

## Acceptance Criteria

1. A bell icon appears in the sidebar with an unread notification count badge
2. Clicking the bell icon opens a notification dropdown panel showing recent notifications
3. Notifications are generated when: (a) a task is assigned to a user, (b) a task's status changes (notify assignee), (c) a comment is added to a task (notify assignee if different from commenter)
4. Each notification shows: type icon, message text, relative time (e.g., "2 min ago"), and read/unread state
5. Clicking a notification marks it as read and navigates to the relevant task
6. A "Mark all as read" button clears all unread notifications
7. Notifications persist in the database and survive page refreshes
8. The unread count badge disappears when all notifications are read
9. Notifications are scoped to the current user — users only see their own notifications
10. Existing board functionality (drag-and-drop, search, filters, attachments, priority/due date) is not broken

## Tasks / Subtasks

- [x] Task 1: Database — add Notification model (AC: #7, #9)
  - [x] Add `Notification` model with id, userId, type, message, taskId, read, createdAt + index on (userId, read)
  - [x] Add `notifications Notification[]` relation to User and Task models
  - [x] Create and apply migration, regenerate Prisma client
- [x] Task 2: Backend — notification service and routes (AC: #2, #5, #6, #9)
  - [x] Create `notifications.service.ts` with create, listByUser, markAsRead (with ownership check), markAllAsRead
  - [x] Create `notifications.routes.ts` with GET list, PATCH :id/read, PATCH read-all
  - [x] Mount at `/api/notifications` in index.ts
- [x] Task 3: Backend — notification triggers (AC: #3)
  - [x] Task assignment → "task_assigned" notification for new assignee (not self)
  - [x] Status change → "task_status_changed" notification for assignee (not current user)
  - [x] Comment added → "comment_added" notification for assignee (not comment author)
  - [x] Passed currentUserId through tasks route to service for self-notification prevention
- [x] Task 4: Frontend — notification hooks and query keys (AC: #2, #5, #6)
  - [x] Added `notifications.all` to queryKeys.ts
  - [x] Created useNotifications (30s polling), useMarkAsRead, useMarkAllAsRead hooks
- [x] Task 5: Frontend — Bell icon in sidebar (AC: #1, #8)
  - [x] Added Bell icon with unread count badge (red circle) to AppSidebar above logout
  - [x] Click toggles NotificationDropdown open/close
- [x] Task 6: Frontend — NotificationDropdown (AC: #2, #4, #5, #6)
  - [x] Fixed panel right of sidebar (320px) with header, mark-all-read button
  - [x] Type icons (UserPlus/ArrowRightLeft/MessageSquare), message, relative time
  - [x] Unread: white bg + indigo left border; Read: zinc-50 bg
  - [x] Click marks as read and closes dropdown
  - [x] Click-outside-to-close via mousedown listener
  - [x] Empty state: "No notifications"
- [x] Task 7: Regression testing (AC: #10)
  - [x] TypeScript and ESLint pass
  - [x] API tested: assign creates notification, mark read, mark all read
  - [x] Self-notification prevention verified

### Review Findings

- [x] [Review][Patch] AC #5: Added navigation — click notification navigates to `/projects/:projectId?task=:taskId` using task.projectId from included relation [NotificationDropdown.tsx, notifications.service.ts]
- [x] [Review][Patch] Bell click-outside race — added `data-notification-bell` attr, mousedown handler skips clicks on bell button [AppSidebar.tsx, NotificationDropdown.tsx]
- [x] [Review][Patch] Removed double onClose() — handler now calls onClose once after optional navigation [NotificationDropdown.tsx]
- [x] [Review][Patch] Status-change notification now uses `updated.assigneeId` (post-update) instead of stale `task.assigneeId` [tasks.service.ts]
- [x] [Review][Defer] No notification to old assignee on unassignment — not in AC
- [x] [Review][Defer] No pagination on notification list — 50-item cap acceptable

## Dev Notes

### Architecture Patterns (MUST follow)

- **API response format:** Always wrap in `{ data: ... }` or `{ error: { code, message } }`
- **HTTP status codes:** 200 for GET/PATCH, 201 for POST, 204 for DELETE
- **Backend layers:** Route → Service → Prisma
- **Error handling:** Throw `AppError(code, statusCode, message)`, global handler catches
- **Frontend state:** TanStack Query for server state, `useState` for UI state (dropdown open)
- **Query keys:** Use factory in `lib/queryKeys.ts` — never inline
- **ESM project:** Backend imports use `.js` extensions

### Existing Files to Modify

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add Notification model, User/Task relations |
| `backend/src/index.ts` | Mount notification routes |
| `backend/src/services/tasks.service.ts` | Add notification triggers on assign/status change |
| `backend/src/services/comments.service.ts` | Add notification trigger on comment create |
| `frontend/src/lib/queryKeys.ts` | Add notifications namespace |
| `frontend/src/components/AppSidebar.tsx` | Add NotificationBell |

### New Files

| File | Purpose |
|------|---------|
| `backend/src/services/notifications.service.ts` | Notification CRUD |
| `backend/src/routes/notifications.routes.ts` | API endpoints |
| `frontend/src/features/notifications/hooks/useNotifications.ts` | TanStack Query hooks |
| `frontend/src/features/notifications/components/NotificationBell.tsx` | Bell icon + badge |
| `frontend/src/features/notifications/components/NotificationDropdown.tsx` | Dropdown panel |

### Notification Model (Prisma)

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "task_assigned" | "task_status_changed" | "comment_added"
  message   String
  taskId    String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task      Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([userId, read])
}
```

### Notification Types and Messages

| Type | Trigger | Message Template |
|------|---------|-----------------|
| `task_assigned` | `update()` assigns task | `"You were assigned to '{taskTitle}'"` |
| `task_status_changed` | `update()` changes status | `"'{taskTitle}' was moved to {statusName}"` |
| `comment_added` | comment `create()` | `"New comment on '{taskTitle}'"` |

### Notification Trigger Pattern

```typescript
// In tasksService.update(), after successful update:
if (data.assigneeId && data.assigneeId !== task.assigneeId) {
  await notificationsService.create({
    userId: data.assigneeId,
    type: 'task_assigned',
    message: `You were assigned to '${updatedTask.title}'`,
    taskId: task.id,
  })
}
```

**Critical: No self-notifications.** The trigger must check that the notification target is NOT the current user performing the action. This requires passing `currentUserId` to the service methods or checking in the route handler.

### API Endpoints

```
GET    /api/notifications           — list for current user (limit 50, newest first)
PATCH  /api/notifications/:id/read  — mark single as read
PATCH  /api/notifications/read-all  — mark all as read for current user
```

### Polling Strategy

Use TanStack Query `refetchInterval` for near-real-time:
```typescript
useQuery({
  queryKey: queryKeys.notifications.all,
  queryFn: ...,
  refetchInterval: 30_000, // 30 seconds
})
```
SSE (Story 9.2) will replace polling with push later.

### Sidebar Bell Icon Placement

Current AppSidebar layout:
```
[Logo icon at top]
[Dashboard icon]
[... nav items ...]
[mt-auto spacer]
[Bell icon ← NEW, above logout]
[Logout button at bottom]
```

### NotificationDropdown Layout

```
┌──────────────────────────────┐
│ Notifications    [Mark all ✓]│
├──────────────────────────────┤
│ 🔵 You were assigned to     │
│    'Fix login bug'   2m ago  │
├──────────────────────────────┤
│    'Task X' moved to Done    │
│                     1h ago   │
├──────────────────────────────┤
│    New comment on 'Task Y'   │
│                     3h ago   │
└──────────────────────────────┘
```

- Position: absolute, to the right of the sidebar (left: 56px)
- Width: ~320px
- Max height: 400px with overflow scroll
- Z-index above board content

### Relative Time Formatting

```typescript
function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
```

### Passing Current User to Notification Triggers

The `requireAuth` middleware sets `req.user = { userId, email }`. To avoid self-notifications:

```typescript
// In tasks.routes.ts PATCH handler:
const task = await tasksService.update(
  req.params.id as string,
  req.body,
  (req as unknown as { user: { userId: string } }).user.userId  // pass current user
)
```

Update `tasksService.update()` signature to accept optional `currentUserId` parameter.

### What NOT to Do

- Do NOT implement SSE/WebSocket — that's Story 9.2
- Do NOT add email notifications — in-app only
- Do NOT add notification preferences/settings — out of scope
- Do NOT add notification for task creation — only assign, status change, comment
- Do NOT notify the user who performed the action
- Do NOT add Redux/Zustand — TanStack Query + useState
- Do NOT add a separate notification page — dropdown only

### Previous Story Intelligence

- **Route mounting:** Use dedicated prefix (`/api/notifications`) to avoid collision (learned from 8.2)
- **Timezone-safe dates:** Use `parseDateOnly()` pattern for date display (learned from 8.1)
- **Orphan cleanup:** Handle errors that could leave inconsistent state (learned from 8.2)
- **React 19 ESLint:** Don't use setState in useEffect, don't access refs during render

### Testing Guidance

- Manual testing is primary
- Key scenarios:
  1. Assign task to another user → notification appears for assignee
  2. Change task status → assignee gets notification
  3. Add comment → assignee gets notification (not commenter)
  4. Self-action: assign task to yourself → NO notification
  5. Click bell → dropdown opens with notifications
  6. Click notification → marked read, navigates to task
  7. Mark all as read → all notifications cleared, badge disappears
  8. Refresh page → notifications persist
  9. Board features still work

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-07.md#4.2-4.3] — Notification model, bell icon, FR41-FR44
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — AppSidebar anatomy, tooltip pattern
- [Source: frontend/src/components/AppSidebar.tsx] — current sidebar layout
- [Source: backend/src/services/tasks.service.ts] — notification trigger points
- [Source: backend/src/services/comments.service.ts] — comment creation trigger

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Removed unused `navigate` import from NotificationDropdown (TS error)
- Notification triggers use fire-and-forget `.catch(() => {})` to not block the main operation

### Completion Notes List

- Task 1: Notification model with @@index([userId, read]) for efficient queries. Cascade delete on both User and Task
- Task 2: Service with ownership check on markAsRead (FORBIDDEN if not your notification). Routes at /api/notifications with read-all using PATCH
- Task 3: Triggers in tasksService.update (assign + status change) and commentsService.create. currentUserId passed from route handler to prevent self-notifications. Fire-and-forget pattern
- Task 4: 30-second polling via refetchInterval. Query key factory pattern followed
- Task 5: Bell icon in sidebar with red badge showing unread count (capped at 9+). Toggle opens/closes dropdown
- Task 6: Fixed panel (320px) to right of sidebar. Type-specific icons, relative time formatting, click-to-mark-read, click-outside-to-close
- Task 7: All API endpoints tested. TypeScript and ESLint clean

### Change Log

- 2026-04-09: Implemented in-app notifications (Story 9.1) — Notification model, triggers on assign/status/comment, bell icon with badge, dropdown panel

### File List

- backend/prisma/schema.prisma (modified — added Notification model, User/Task relations)
- backend/prisma/migrations/20260409142051_add_notification_model/migration.sql (new)
- backend/src/services/notifications.service.ts (new — CRUD + ownership check)
- backend/src/routes/notifications.routes.ts (new — list, mark-read, mark-all-read)
- backend/src/index.ts (modified — mounted notification routes)
- backend/src/services/tasks.service.ts (modified — notification triggers, currentUserId param)
- backend/src/routes/tasks.routes.ts (modified — pass currentUserId to update)
- backend/src/services/comments.service.ts (modified — notification trigger on comment create)
- frontend/src/lib/queryKeys.ts (modified — notifications.all key)
- frontend/src/features/notifications/hooks/useNotifications.ts (new — query + mutations)
- frontend/src/features/notifications/components/NotificationDropdown.tsx (new — dropdown panel)
- frontend/src/components/AppSidebar.tsx (modified — bell icon + badge + dropdown)
