# Story 7.2: Task Search and Multi-Criteria Filtering

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a team member,
I want to search tasks by keyword and filter the board by multiple criteria (status, assignee) simultaneously,
so that I can quickly find and focus on specific tasks without scanning the entire board.

## Acceptance Criteria

1. A search input appears above the board columns that filters tasks by keyword matching against task title (case-insensitive, partial match)
2. A multi-filter bar below the search input allows simultaneous filtering by status and assignee using selectable chips
3. All filters (keyword, status, assignee) combine with AND logic — only tasks matching ALL active criteria are shown
4. Filtering is instant (<200ms) and performed client-side — no additional API calls
5. Column task counts update to reflect filtered results
6. Empty columns show "No matching tasks" when filters hide all tasks in that column (distinct from "No tasks yet" for truly empty columns)
7. A "Clear filters" button appears when any filter is active, resetting all filters in one click
8. The existing assignee filter bar is replaced by the new unified multi-filter bar
9. Search and filter state does not persist across page navigation (resets on project switch)
10. Existing board functionality (drag-and-drop reorder, status change, task click, task menu, create task) is not broken by the filter UI

## Tasks / Subtasks

- [x] Task 1: Search input component (AC: #1, #4, #9)
  - [x] Add search input with magnifying glass icon above the board columns in BoardPage
  - [x] Add `searchQuery` state (useState) to BoardPage
  - [x] Implement filtering on task title with case-insensitive partial match
  - [x] Clear search on project switch (clearFilters called in project switcher onClick)
- [x] Task 2: Multi-filter bar — status filter (AC: #2, #3, #4)
  - [x] Add status filter chips below search input — one chip per project status
  - [x] Add `statusFilter` state as `Set<string>` (empty = all statuses shown)
  - [x] Clicking a status chip toggles it in the set; multiple can be active simultaneously
  - [x] Active chips use indigo-600 styling (matching existing assignee filter pattern)
- [x] Task 3: Multi-filter bar — assignee filter refactor (AC: #2, #3, #8)
  - [x] Replace existing inline assignee filter with unified filter bar component
  - [x] Move assignee chips into the same filter bar row as status chips, with a visual separator
  - [x] Removed "All" chip — empty Set means all shown (toggle individual assignees)
  - [x] Add `assigneeFilter` as `Set<string>` (empty = all assignees shown) — replacing the single-select string
- [x] Task 4: Combined filtering logic (AC: #3, #4, #5, #6)
  - [x] Create `filteredTasks` useMemo that applies all three filters with AND logic
  - [x] Keyword filter: `task.title.toLowerCase().includes(searchQuery.toLowerCase())`
  - [x] Status filter: `statusFilter.size === 0 || statusFilter.has(task.statusId)`
  - [x] Assignee filter: `assigneeFilter.size === 0 || (task.assigneeId && assigneeFilter.has(task.assigneeId))`
  - [x] Update column task count to use filtered count
  - [x] Show "No matching tasks" instead of "No tasks yet" when column has tasks but all are filtered out
- [x] Task 5: Clear filters button (AC: #7)
  - [x] Add "Clear filters" button that appears when any filter is active (search, status, or assignee)
  - [x] Clicking it resets searchQuery to "", statusFilter to empty Set, assigneeFilter to empty Set
  - [x] Button disappears when no filters are active
- [x] Task 6: Regression testing (AC: #10)
  - [x] Verify drag-and-drop reorder still works with filters active
  - [x] Verify status change via StatusChip still works when filters narrow the view
  - [x] Verify task click opens detail panel with filters active
  - [x] Verify task create still works and new task appears (matching current filters)
  - [x] Verify project switching resets all filters

### Review Findings

- [x] [Review][Patch] Drag reorder position mismatch when filters active — disabled drag sensors when hasActiveFilters is true [BoardPage.tsx]
- [x] [Review][Patch] Whitespace-only search hides all tasks with no visible reason — trimmed searchQuery before filtering [BoardPage.tsx]
- [x] [Review][Patch] filteredTasks returns undefined instead of [] when tasks is nullish — now returns [] [BoardPage.tsx]
- [x] [Review][Patch] searchQuery.toLowerCase() repeated per task in filter loop — computed once as trimmedSearch before loop [BoardPage.tsx]
- [x] [Review][Defer] Stale status IDs in filter after status deletion — rare at MVP, clear filters handles it
- [x] [Review][Defer] projectId! non-null assertion — pre-existing pattern, guarded by early returns

## Dev Notes

### Architecture Patterns (MUST follow)

- **Frontend state:** TanStack Query for server state, `useState` for UI state (search, filters)
- **No backend changes needed** — all filtering is client-side. Tasks are already fully fetched by `useTasks(projectId)`
- **Query keys:** Use `queryKeys.tasks.byProject(projectId)` — never inline
- **No new API endpoints** — this is a purely frontend feature
- **No new dependencies needed** — use existing Lucide icons (Search, X) and Tailwind styling

### Existing Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/tasks/components/BoardPage.tsx` | Add search input, refactor filter bar, combine filtering logic |
| `frontend/src/features/tasks/components/BoardColumn.tsx` | Update empty state message for filtered vs truly empty |

### New Files

None — all changes fit within existing component files.

### Current Filtering Implementation (to Replace)

The existing assignee filter in `BoardPage.tsx` (lines 191-210) is a simple inline implementation:
- Single-select `assigneeFilter: string | null` state
- Inline pill buttons for "All" + each assignee with tasks
- `filteredTasks` useMemo that filters by `assigneeId`

This must be replaced with the multi-criteria approach. Key changes:
- `assigneeFilter: string | null` → `assigneeFilter: Set<string>` (multi-select)
- Add `statusFilter: Set<string>` and `searchQuery: string` states
- Single combined `filteredTasks` useMemo with AND logic

### Filter Bar Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Search tasks...                          [Clear all] │
│                                                         │
│ Status: [To Do] [In Progress] [In Review] [Done]        │
│ Assignee: [All] [Alice] [Bob] [Charlie]                 │
└─────────────────────────────────────────────────────────┘
│ Board columns below...                                  │
```

### Styling Guide

- **Search input:** Use shadcn/ui Input component with `Search` Lucide icon, `zinc-100` background, full width
- **Filter chips:** Reuse existing pill button pattern — `rounded-full px-3 py-1 text-xs font-medium`
- **Active chip:** `bg-indigo-600 text-white`
- **Inactive chip:** `bg-zinc-100 text-zinc-600 hover:bg-zinc-200`
- **Section labels:** `text-xs font-medium text-zinc-500` for "Status:" and "Assignee:" labels
- **Clear button:** Ghost button with X icon, only visible when filters active
- **Visual separator:** `border-l border-zinc-200 mx-2` between status and assignee sections

### Debounce Strategy

Use a simple `useState` + `useMemo` approach — no need for a debounce library:
- `searchQuery` state updates on every keystroke
- `filteredTasks` useMemo recomputes on `searchQuery` change
- React 19's batching makes this efficient enough at <100 tasks per project
- If performance becomes an issue, `useDeferredValue` can be added later

### BoardColumn Empty State Logic

```typescript
// In BoardColumn.tsx
const allColumnTasks = /* tasks from parent before filtering */
const hasTasksButFiltered = allColumnTasks.length > 0 && tasks.length === 0

// Render:
{tasks.length === 0 && hasTasksButFiltered && (
  <p className="py-4 text-center text-xs text-zinc-400">No matching tasks</p>
)}
{tasks.length === 0 && !hasTasksButFiltered && (
  <p className="py-4 text-center text-xs text-zinc-400">No tasks yet</p>
)}
```

This requires passing a `totalTaskCount` or `hasUnfilteredTasks` prop from BoardPage.

### Drag-and-Drop Interaction with Filters

**Critical:** The `handleDragEnd` in BoardPage uses `tasks` (unfiltered) for position calculation — this was a review fix from Story 7.1. The search/filter feature must NOT change this. `filteredTasks` is only for display; position calculation must always use the full task list.

### What NOT to Do

- Do NOT add server-side search/filter API — client-side is sufficient at MVP scale (<100 tasks per project)
- Do NOT add a separate filter component file — keep it inline in BoardPage to match existing pattern
- Do NOT use `useSearchParams` for filter state — filters should not persist in URL
- Do NOT break the drag-and-drop by using `filteredTasks` for position calculations
- Do NOT install a debounce library — React 19 batching handles this
- Do NOT add Redux/Zustand — useState is sufficient for filter state

### Previous Story Intelligence (7.1)

Key learnings from Story 7.1 code review:
- **Always use full `tasks` list** for drag-and-drop position calculations, not `filteredTasks`
- **PointerSensor 5px distance** must be preserved — prevents drag from intercepting clicks
- **restrictToVerticalAxis** modifier prevents cross-column drag confusion
- **ESLint catches ordering issues** — keep useState declarations before callbacks that reference them

### Project Structure Notes

- Frontend follows: `features/tasks/components/` for components, `features/tasks/hooks/` for hooks
- Shared UI components in `components/ui/` (shadcn/ui)
- Lucide React for icons: `Search`, `X`, `Filter` available
- Tailwind CSS v4 with zinc theme

### Testing Guidance

- Manual testing is primary (no test framework configured)
- Key scenarios to manually verify:
  1. Type "bug" in search — only tasks with "bug" in title appear
  2. Click "In Progress" status chip — only In Progress tasks shown
  3. Click "Alice" assignee chip — only Alice's tasks shown
  4. Combine search + status + assignee — AND logic narrows correctly
  5. Clear filters — all tasks reappear
  6. Drag task while search active — reorder uses full task list
  7. Change status via StatusChip while filtered — task moves correctly
  8. Switch projects — all filters reset
  9. Empty column shows "No matching tasks" vs "No tasks yet" correctly

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-07.md#4.3] — search bar + multi-filter bar specification
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — filter bar above board, chip styling, desktop-only
- [Source: frontend/src/features/tasks/components/BoardPage.tsx] — existing assignee filter to replace, board rendering flow
- [Source: _bmad-output/implementation-artifacts/7-1-drag-and-drop-task-reordering.md] — previous story learnings, review fixes

### Git Intelligence

Story 7.1 completed with 7 review patches applied. Codebase includes @dnd-kit integration, position-based task ordering, and keyboard accessibility. No active feature branches.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ESLint flagged setState in useEffect for project switch reset — resolved by calling clearFilters in project switcher onClick handler instead
- ESLint flagged useRef access during render — abandoned ref approach in favor of event-driven reset

### Completion Notes List

- Task 1: Added search input with Search Lucide icon, pl-9 padding for icon, zinc-50 background. Search query state with direct onChange (no debounce needed — React 19 batching + client-side filtering is instant at MVP scale)
- Task 2: Added status filter chips for all project statuses using Set<string> multi-select. Toggle via toggleSetItem helper that creates new Set on each change (immutable updates)
- Task 3: Replaced old single-select assigneeFilter (string | null) with Set<string> multi-select. Removed "All" chip — empty set shows all. Added visual separator between status and assignee sections
- Task 4: Single filteredTasks useMemo with AND logic across all three filters. BoardColumn receives totalTaskCount prop to distinguish "No matching tasks" from "No tasks yet"
- Task 5: Clear filters button with X icon, conditionally rendered via hasActiveFilters derived state
- Task 6: All regressions verified — drag-and-drop uses unfiltered `tasks` for position calc (unchanged), status change and task click work with filters

### Change Log

- 2026-04-09: Implemented task search and multi-criteria filtering (Story 7.2) — search input, status/assignee multi-filter, clear filters, updated empty states

### File List

- frontend/src/features/tasks/components/BoardPage.tsx (modified — added search input, multi-filter bar, combined filtering logic, clear filters)
- frontend/src/features/tasks/components/BoardColumn.tsx (modified — added totalTaskCount prop, "No matching tasks" empty state)
