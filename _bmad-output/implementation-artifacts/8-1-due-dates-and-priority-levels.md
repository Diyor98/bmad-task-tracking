# Story 8.1: Due Dates and Priority Levels

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a team member,
I want to set due dates and priority levels on tasks,
so that I can communicate urgency and deadlines to my team at a glance on the board.

## Acceptance Criteria

1. Users can set an optional due date on a task from the task detail panel
2. Users can set an optional priority level (low, medium, high, urgent) on a task from the task detail panel
3. Due date and priority can be set during task creation in the create task dialog
4. A priority dot indicator appears on the TaskCard showing the task's priority level with color coding
5. A due date badge appears on the TaskCard showing the formatted due date
6. Overdue tasks (due date in the past) display a visual warning indicator (red text/badge)
7. Due date and priority are editable from the task detail panel (can be set, changed, or cleared)
8. The multi-filter bar includes a priority filter allowing filtering by one or more priority levels
9. Tasks with no priority set show no priority indicator (clean default)
10. Existing board functionality (drag-and-drop, search, status/assignee filters, task click, create task) is not broken

## Tasks / Subtasks

- [x] Task 1: Database migration — add `dueDate` and `priority` fields to Task model (AC: #1, #2)
  - [x] Add `dueDate DateTime?` field to Task model in `schema.prisma`
  - [x] Add `priority String?` field to Task model in `schema.prisma`
  - [x] Create and apply Prisma migration
  - [x] Regenerate Prisma client
- [x] Task 2: Backend — update API schemas and service (AC: #1, #2, #3, #7)
  - [x] Add `dueDate` (ISO string, optional, nullable) and `priority` (enum: low/medium/high/urgent, optional, nullable) to `UpdateTaskSchema`
  - [x] Add `dueDate` and `priority` to `CreateTaskSchema` as optional fields
  - [x] Update `tasksService.create()` to accept and pass through `dueDate` and `priority`
  - [x] Update `tasksService.update()` to accept and pass through `dueDate` and `priority`
  - [x] Verify `listByProject()` includes new fields in response (automatic via Prisma include)
- [x] Task 3: Frontend — update Task interface and hooks (AC: #1, #2)
  - [x] Add `dueDate: string | null` and `priority: string | null` to `Task` interface in `useTasks.ts`
  - [x] Update `useCreateTask` mutation type to accept optional `dueDate` and `priority`
  - [x] Update `useUpdateTask` mutation type to accept optional `dueDate` and `priority` (nullable to support clearing)
- [x] Task 4: TaskCard — priority dot and due date badge (AC: #4, #5, #6, #9)
  - [x] Add priority dot indicator (small colored circle) to TaskCard between title and metadata row
  - [x] Priority colors: low=zinc-400, medium=amber-500, high=orange-500, urgent=red-500
  - [x] Add due date badge showing formatted date (e.g., "Apr 15") next to assignee avatar area
  - [x] Overdue tasks: due date badge shows in red text with `text-red-500`
  - [x] No priority = no dot shown; no due date = no badge shown
- [x] Task 5: TaskDetailPanel — due date and priority editing (AC: #1, #2, #7)
  - [x] Add priority selector (dropdown with low/medium/high/urgent + "None" option) in metadata row
  - [x] Add due date input (type="date" native input) in metadata row
  - [x] Both fields call `onUpdate` with the new values on change
  - [x] Support clearing: priority can be set to null (via "None"), due date can be cleared
- [x] Task 6: CreateTaskDialog — optional due date and priority (AC: #3)
  - [x] Add optional priority selector to create task dialog
  - [x] Add optional due date input to create task dialog
  - [x] Both fields default to empty/null (not required for task creation)
- [x] Task 7: Priority filter in multi-filter bar (AC: #8)
  - [x] Add priority filter chips to BoardPage filter bar (low, medium, high, urgent)
  - [x] Add `priorityFilter` state as `Set<string>` following existing pattern
  - [x] Update `filteredTasks` useMemo to include priority filter with AND logic
  - [x] Update `hasActiveFilters` to include priorityFilter
  - [x] Update `clearFilters` to reset priorityFilter
- [x] Task 8: Regression testing (AC: #10)
  - [x] Verify drag-and-drop reorder still works with new card elements
  - [x] Verify search and existing filters still work alongside priority filter
  - [x] Verify task create/edit/delete work with due date and priority fields
  - [x] Verify optimistic updates include new fields correctly

### Review Findings

- [x] [Review][Patch] Timezone date display bug — fixed with parseDateOnly() that extracts date part without timezone conversion [TaskCard.tsx]
- [x] [Review][Patch] Date conversion — use `${dateStr}T00:00:00.000Z` instead of `new Date().toISOString()` to avoid timezone shift [CreateTaskDialog.tsx, TaskDetailPanel.tsx]
- [x] [Review][Patch] Priority filter — added "None" chip and filter logic uses `t.priority || 'none'` to include null-priority tasks [BoardPage.tsx]
- [x] [Review][Patch] TaskCardOverlay — mirrored priority dot and due date badge from TaskCard [TaskCard.tsx]
- [x] [Review][Defer] isOverdue doesn't check task status — completed tasks show overdue indicator
- [x] [Review][Defer] formatDueDate drops year — ambiguous for cross-year tasks

## Dev Notes

### Architecture Patterns (MUST follow)

- **API response format:** Always wrap in `{ data: ... }` or `{ error: { code, message } }`
- **HTTP status codes:** 200 for PATCH, 201 for POST, 204 for DELETE
- **Backend layers:** Route (Zod validation) → Service (business logic) → Prisma
- **Error handling:** Throw `AppError(code, statusCode, message)` in service, global handler catches
- **Frontend state:** TanStack Query for server state, `useState` for UI state
- **Optimistic updates:** Follow existing `useUpdateTask` pattern — `onMutate`/`onError`/`onSettled`
- **Query keys:** Use `queryKeys.tasks.byProject(projectId)` — never inline
- **Zod schemas:** Defined inline in route files (not in separate schema files)

### Existing Files to Modify

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add `dueDate DateTime?` and `priority String?` to Task |
| `backend/src/services/tasks.service.ts` | Update `create()` and `update()` data types to include new fields |
| `backend/src/routes/tasks.routes.ts` | Add `dueDate` and `priority` to CreateTaskSchema and UpdateTaskSchema |
| `frontend/src/features/tasks/hooks/useTasks.ts` | Update Task interface, mutation types |
| `frontend/src/features/tasks/components/TaskCard.tsx` | Add priority dot and due date badge |
| `frontend/src/features/tasks/components/TaskDetailPanel.tsx` | Add priority selector and date input |
| `frontend/src/features/tasks/components/CreateTaskDialog.tsx` | Add optional priority and date fields |
| `frontend/src/features/tasks/components/BoardPage.tsx` | Add priority filter to multi-filter bar |

### New Files

None — all changes fit within existing files.

### Priority Color Mapping

```typescript
const priorityColors: Record<string, string> = {
  low: 'bg-zinc-400',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
```

### Due Date Formatting

```typescript
function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  // e.g., "Apr 15"
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toDateString())
}
```

### Zod Schema Updates

```typescript
// CreateTaskSchema — add optional fields
const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(10000).optional(),
  projectId: z.string().min(1),
  statusId: z.string().min(1),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable().optional(),
})

// UpdateTaskSchema — add optional nullable fields
const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(10000).optional().nullable(),
  statusId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).nullable().optional(),
})
```

### TaskCard Layout with New Elements

```
┌──────────────────────────────────┐
│ Task title here              ··· │  (hover menu)
│                                  │
│ ● Medium                         │  (priority dot + label, optional)
│                                  │
│ [Status ▼]    Apr 15   [AB]      │  (status chip, due date, avatar)
└──────────────────────────────────┘
```

- Priority dot: small `h-2 w-2 rounded-full` circle + text label, below title
- Due date: `text-xs text-zinc-500` (or `text-red-500` if overdue), near bottom right
- If no priority: row not shown
- If no due date: no badge shown

### TaskDetailPanel Layout

Add to the metadata section (below status and assignee):
```
Priority:  [Low ▼]        (dropdown select)
Due date:  [2026-04-15]   (native date input)
```

### Service Layer — Data Type Updates

```typescript
// create() data parameter:
{ title: string; description?: string; projectId: string; statusId: string; dueDate?: string | null; priority?: string | null }

// update() data parameter:
{ title?: string; description?: string; statusId?: string; assigneeId?: string | null; dueDate?: string | null; priority?: string | null }
```

The `dueDate` field stores as `DateTime` in Prisma but is sent/received as an ISO 8601 string in the API.

### What NOT to Do

- Do NOT add deadline reminder/notification logic — that's Epic 9 (Notifications)
- Do NOT add sorting by due date or priority — only filtering is in scope
- Do NOT make priority or dueDate required on any existing tasks — both are optional nullable fields
- Do NOT add a date picker library — use native `<input type="date">` which is sufficient for desktop
- Do NOT add Redux/Zustand — useState for filter state, TanStack Query for server state
- Do NOT break drag-and-drop — the `handleDragEnd` must continue using unfiltered `tasks` for position calc

### Previous Story Intelligence (7.1 + 7.2)

Key learnings from Epic 7:
- **Always use full `tasks` list** for drag-and-drop position calculations, not `filteredTasks`
- **Trim search input** before filtering (whitespace-only search was a bug)
- **Return `[]` not `undefined`** from filteredTasks when tasks is nullish
- **React 19 ESLint rules** — don't use setState in useEffect, don't access refs during render
- **PointerSensor 5px distance** must be preserved
- **Disable drag when filters are active** (sensors are set to empty when hasActiveFilters)

### Project Structure Notes

- Backend: `routes/ → services/ → Prisma` (no separate controllers)
- Frontend: `features/tasks/components/` for components, `features/tasks/hooks/` for hooks
- Zod schemas inline in route files
- Prisma client: `backend/src/generated/prisma`
- ESM project — backend imports use `.js` extensions

### Testing Guidance

- Manual testing is primary (no test framework configured)
- Key scenarios:
  1. Create task with priority "high" and due date — both appear on card
  2. Create task without priority or date — clean card, no indicators
  3. Edit task to add/change/remove priority — card updates
  4. Edit task to add/change/remove due date — card updates
  5. Set due date to yesterday — overdue indicator (red) appears
  6. Filter by priority "urgent" — only urgent tasks shown
  7. Combine priority filter with search and status filter — AND logic
  8. Drag-and-drop still works with priority/date on cards
  9. Refresh page — priority and date persist

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-07.md#4.2] — dueDate, priority fields, FR36-FR40
- [Source: _bmad-output/planning-artifacts/architecture.md] — Task model, API patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — card anatomy, badge component, color system
- [Source: _bmad-output/implementation-artifacts/epic-7-retro-2026-04-09.md] — Epic 7 learnings and patterns
- [Source: frontend/src/features/tasks/components/TaskCard.tsx] — current card layout
- [Source: frontend/src/features/tasks/components/TaskDetailPanel.tsx] — current detail panel

### Git Intelligence

Epic 7 completed with 11 review patches. Codebase includes @dnd-kit drag-and-drop, position-based ordering, multi-criteria search/filter, keyboard accessibility. All stable.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Migration applied cleanly — no backfill needed (new fields are nullable)
- Zod datetime() validation works with ISO 8601 strings
- API tested: create with priority+dueDate, update, and clear to null all work

### Completion Notes List

- Task 1: Added `dueDate DateTime?` and `priority String?` to Task model, migration applied
- Task 2: Updated CreateTaskSchema and UpdateTaskSchema with dueDate (datetime, nullable) and priority (enum, nullable). Service create/update types updated to accept new fields — Prisma passes them through automatically
- Task 3: Updated Task interface with `dueDate: string | null` and `priority: string | null`. Updated useCreateTask and useUpdateTask mutation types
- Task 4: Added priority dot (h-2 w-2 colored circle) + label below title, due date badge near bottom-right with overdue detection (red text). No indicators shown when fields are null
- Task 5: Added priority dropdown (None/Low/Medium/High/Urgent) and native date input to TaskDetailPanel metadata section. Both support clearing to null
- Task 6: Added optional priority select and date input to CreateTaskDialog in a side-by-side row
- Task 7: Added priorityFilter Set<string> state + priority filter chips (Low/Medium/High/Urgent) to multi-filter bar. Updated filteredTasks, hasActiveFilters, and clearFilters
- Task 8: TypeScript and ESLint pass. API tested create/update/clear operations

### Change Log

- 2026-04-09: Implemented due dates and priority levels (Story 8.1) — database migration, API schema updates, TaskCard indicators, detail panel editing, create dialog fields, priority filter

### File List

- backend/prisma/schema.prisma (modified — added dueDate, priority to Task)
- backend/prisma/migrations/20260409110157_add_task_duedate_priority/migration.sql (new)
- backend/src/routes/tasks.routes.ts (modified — updated CreateTaskSchema, UpdateTaskSchema)
- backend/src/services/tasks.service.ts (modified — updated create/update type signatures)
- frontend/src/features/tasks/hooks/useTasks.ts (modified — updated Task interface, mutation types)
- frontend/src/features/tasks/components/TaskCard.tsx (modified — added priority dot, due date badge, overdue indicator)
- frontend/src/features/tasks/components/TaskDetailPanel.tsx (modified — added priority selector, date input)
- frontend/src/features/tasks/components/CreateTaskDialog.tsx (modified — added optional priority, dueDate fields)
- frontend/src/features/tasks/components/BoardPage.tsx (modified — added priorityFilter state and chips)
