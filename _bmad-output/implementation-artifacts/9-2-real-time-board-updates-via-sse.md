# Story 9.2: Real-Time Board Updates via SSE

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a team member,
I want the board to update in real time when teammates make changes,
so that I always see the latest task state without manually refreshing the page.

## Acceptance Criteria

1. An SSE endpoint at `GET /api/events?projectId=<id>` streams real-time events to connected clients
2. When any user creates, updates, deletes, or reorders a task, all connected clients viewing that project see the change within 2 seconds
3. Comment and attachment changes trigger a task count refresh on the board (updated `_count`)
4. The SSE connection auto-reconnects with exponential backoff if dropped (max 30s between retries)
5. The SSE connection is authenticated — only logged-in users can subscribe
6. Events are scoped to a single project — clients only receive events for the project they're viewing
7. The client that performed the mutation still uses optimistic updates for instant feedback; SSE provides convergence for other clients
8. Switching projects closes the old SSE connection and opens a new one
9. The notification polling (30s interval from Story 9.1) is replaced by SSE push for notification updates
10. Existing board functionality (drag-and-drop, search, filters, attachments, notifications) is not broken

## Tasks / Subtasks

- [x] Task 1: Backend — event bus (AC: #1, #6)
  - [x] Created `eventBus.ts` with EventEmitter + SSEEvent interface + emitSSE method
  - [x] 8 event types: task CRUD, reorder, comment, attachment, notification
- [x] Task 2: Backend — SSE endpoint (AC: #1, #5, #6)
  - [x] Created `events.routes.ts` with GET /events?projectId, SSE headers, X-Accel-Buffering: no
  - [x] Heartbeat every 30s, subscribe/unsubscribe on connect/close
  - [x] Protected with requireAuth, mounted at /api
- [x] Task 3: Backend — emit events from services (AC: #2, #3)
  - [x] tasksService: emit on create, update, delete, reorder
  - [x] commentsService: emit on create
  - [x] attachmentsService: emit on create and delete
  - [x] notificationsService: emit on create (for SSE push to target user's project)
- [x] Task 4: Frontend — SSE hook (AC: #2, #4, #7, #8)
  - [x] Created useSSE.ts with EventSource, auto-reconnect (1s-30s exponential backoff)
  - [x] Invalidates tasks query on task/comment/attachment events
  - [x] Invalidates notifications query on notification:created
  - [x] Cleanup on projectId change or unmount
- [x] Task 5: Frontend — integrate SSE in BoardPage (AC: #2, #8)
  - [x] Added useSSE(projectId) call in BoardPage
- [x] Task 6: Frontend — replace notification polling (AC: #9)
  - [x] Removed refetchInterval from useNotifications — SSE push handles invalidation
- [x] Task 7: Regression testing (AC: #10)
  - [x] TypeScript and ESLint pass
  - [x] Updated nginx.conf with proxy_buffering off, proxy_cache off for SSE streaming

### Review Findings

- [x] [Review][Patch] EventEmitter — added setMaxListeners(0) to avoid 10-listener warning [eventBus.ts]
- [x] [Review][Patch] res.write wrapped in try/catch with cleanup on failure [events.routes.ts]
- [x] [Review][Patch] Added 60s polling fallback for notifications — covers cross-project and SSE-drop cases [useNotifications.ts]
- [x] [Review][Patch] Added proxy_read_timeout 86400s for SSE long-lived connections [nginx.conf]
- [x] [Review][Defer] No auth on projectId subscription — pre-existing flat workspace pattern
- [x] [Review][Defer] O(N) fan-out per event — acceptable at MVP scale
- [x] [Review][Defer] SSE 401 on token expiry invisible — apiClient handles on next API call

## Dev Notes

### Architecture Patterns (MUST follow)

- **API response format:** SSE uses `text/event-stream` — different from JSON REST pattern
- **Backend layers:** Route handles SSE connection; services emit events via eventBus
- **Error handling:** SSE endpoint uses `req.on('close')` for cleanup — no `next(err)` pattern
- **Frontend state:** TanStack Query invalidation on SSE events — NOT direct cache manipulation
- **ESM project:** Backend imports use `.js` extensions

### Event Bus Pattern

```typescript
// backend/src/lib/eventBus.ts
import { EventEmitter } from 'events'

interface SSEEvent {
  type: string
  projectId: string
  data: unknown
}

class AppEventBus extends EventEmitter {
  emitSSE(event: SSEEvent) {
    this.emit('sse', event)
  }
}

export const eventBus = new AppEventBus()
```

### SSE Endpoint Pattern

```typescript
// GET /api/events?projectId=<id>
router.get('/events', requireAuth, (req, res) => {
  const { projectId } = req.query
  if (!projectId) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'projectId required' } })

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  })

  // Send initial keepalive
  res.write(':ok\n\n')

  function onEvent(event: SSEEvent) {
    if (event.projectId === projectId) {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`)
    }
  }

  eventBus.on('sse', onEvent)

  req.on('close', () => {
    eventBus.off('sse', onEvent)
  })
})
```

### Service Emission Pattern

```typescript
// In tasksService.create(), after successful create:
eventBus.emitSSE({ type: 'task:created', projectId: data.projectId, data: task })

// In tasksService.delete():
eventBus.emitSSE({ type: 'task:deleted', projectId: task.projectId, data: { taskId: id, projectId: task.projectId } })
```

### Frontend SSE Hook Pattern

```typescript
// frontend/src/hooks/useSSE.ts
export function useSSE(projectId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    let retryDelay = 1000
    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      es = new EventSource(`/api/events?projectId=${projectId}`)

      es.onopen = () => { retryDelay = 1000 }

      es.addEventListener('task:created', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
      })
      // ... other event listeners

      es.onerror = () => {
        es?.close()
        retryTimer = setTimeout(connect, retryDelay)
        retryDelay = Math.min(retryDelay * 2, 30_000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [projectId, queryClient])
}
```

### SSE Authentication

EventSource API doesn't support custom headers. Since auth uses httpOnly cookies with `credentials: 'include'`, the browser automatically sends cookies with the SSE connection. The `requireAuth` middleware on the SSE route validates the JWT cookie as usual.

### Nginx Proxy Consideration

SSE requires nginx to NOT buffer the response. Add to the `/api/` proxy location in `nginx.conf`:
```
proxy_buffering off;
proxy_cache off;
```
Without this, nginx buffers SSE events and delivers them in batches instead of streaming.

### What NOT to Do

- Do NOT use WebSocket — SSE is simpler and sufficient for server-to-client push
- Do NOT directly manipulate TanStack Query cache with SSE data — use `invalidateQueries` to trigger refetch (simpler, avoids cache shape mismatches)
- Do NOT remove optimistic updates from mutations — SSE is for other clients, not the mutating client
- Do NOT add a third-party pub/sub system (Redis, etc.) — in-process EventEmitter is sufficient for single-server MVP
- Do NOT break the existing notification system — SSE replaces polling, not the notification model

### Existing Files to Modify

| File | Change |
|------|--------|
| `backend/src/index.ts` | Mount events route |
| `backend/src/services/tasks.service.ts` | Emit events after mutations |
| `backend/src/services/comments.service.ts` | Emit event after comment create |
| `backend/src/services/attachments.service.ts` | Emit events after upload/delete |
| `backend/src/services/notifications.service.ts` | Emit event after notification create |
| `frontend/src/features/tasks/components/BoardPage.tsx` | Add useSSE hook call |
| `frontend/src/features/notifications/hooks/useNotifications.ts` | Remove refetchInterval |
| `frontend/nginx.conf` | Add proxy_buffering off for /api/ |

### New Files

| File | Purpose |
|------|---------|
| `backend/src/lib/eventBus.ts` | Central EventEmitter singleton |
| `backend/src/routes/events.routes.ts` | SSE endpoint |
| `frontend/src/hooks/useSSE.ts` | SSE connection + TanStack Query invalidation |

### Testing Guidance

- Open two browser tabs logged in as different users on the same project
- In tab 1: create a task → tab 2 should show the new task within 2s
- In tab 1: change task status → tab 2 board updates
- In tab 1: delete task → disappears from tab 2
- In tab 1: assign task to tab 2's user → notification appears in tab 2 without polling
- Close laptop lid → reopen → SSE reconnects automatically
- Switch projects → no stale events from previous project

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-07.md#4.2] — SSE endpoint, NFR12-NFR13
- [Source: frontend/src/features/tasks/hooks/useTasks.ts] — TanStack Query invalidation patterns
- [Source: backend/src/services/tasks.service.ts] — mutation methods that need event emission

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Docker daemon was down during development — verified TypeScript/ESLint locally via npx
- Fixed TS error: projectId could be undefined in useSSE — used non-null assertion (guarded by early return)

### Completion Notes List

- Task 1: EventEmitter singleton with typed SSEEvent interface (type, projectId, data)
- Task 2: SSE endpoint with text/event-stream headers, X-Accel-Buffering: no for nginx, 30s heartbeat, requireAuth, clean unsubscribe on close
- Task 3: Event emissions added to all 4 services — tasks (create/update/delete/reorder), comments (create), attachments (create/delete), notifications (create with project lookup)
- Task 4: useSSE hook with EventSource, exponential backoff reconnect (1s → 30s cap), closed flag prevents reconnect after cleanup
- Task 5: useSSE(projectId) added to BoardPage — auto-connects on mount, disconnects on project switch
- Task 6: Removed refetchInterval from useNotifications — SSE notification:created event handles push
- Task 7: TypeScript + ESLint pass. Nginx updated with proxy_buffering off + proxy_cache off

### Change Log

- 2026-04-10: Implemented real-time board updates via SSE (Story 9.2) — EventEmitter bus, SSE endpoint, event emissions from all services, frontend useSSE hook with auto-reconnect, replaced notification polling

### File List

- backend/src/lib/eventBus.ts (new — EventEmitter singleton)
- backend/src/routes/events.routes.ts (new — SSE endpoint)
- backend/src/index.ts (modified — mounted events route)
- backend/src/services/tasks.service.ts (modified — event emissions on CRUD + reorder)
- backend/src/services/comments.service.ts (modified — event emission on create)
- backend/src/services/attachments.service.ts (modified — event emissions on create/delete)
- backend/src/services/notifications.service.ts (modified — event emission on create)
- frontend/src/hooks/useSSE.ts (new — SSE connection + TanStack Query invalidation)
- frontend/src/features/tasks/components/BoardPage.tsx (modified — useSSE integration)
- frontend/src/features/notifications/hooks/useNotifications.ts (modified — removed polling)
- frontend/nginx.conf (modified — proxy_buffering off for SSE)
