---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: '2026-04-03'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# bmad-tutorial-1 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-tutorial-1, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can register an account with email and password
FR2: Users can log in with email and password
FR3: Users can log out
FR4: The system maintains authenticated sessions across browser refreshes
FR5: Users can view a list of all registered team members
FR6: Users can create a new project with a name
FR7: Users can view all existing projects on the main dashboard
FR8: Users can edit a project's name
FR9: Users can delete a project
FR10: Users receive a confirmation prompt before a project is permanently deleted
FR11: Users can create a task within a project with a title and description
FR12: Users can view all tasks in a project
FR13: Users can edit a task's title and description
FR14: Users can delete a task
FR15: Users receive a confirmation prompt before a task is permanently deleted
FR16: Users can view a task's full detail (title, description, assignee, status, comments)
FR17: Each project has a default set of statuses (To Do, In Progress, In Review, Done)
FR18: Users can create custom statuses for a project
FR19: Users can edit the name of an existing status
FR20: Users can delete a custom status from a project
FR21: Users can change the status of any task
FR22: Users can assign a task to any registered team member
FR23: Users can reassign a task to a different team member
FR24: Users can leave a task unassigned
FR25: Users can add a comment to a task
FR26: Users can view all comments on a task in chronological order
FR27: Each comment displays the author's name and timestamp
FR28: Users can view a task board for a project with tasks grouped by status
FR29: Users can filter tasks on the board by assignee
FR30: Users can navigate between projects from the dashboard
FR31: Users can open a task to view its full detail from the board

### NonFunctional Requirements

NFR1: Initial app load completes in under 3 seconds on standard broadband
NFR2: All user-triggered interactions (status change, task open, comment submit) complete in under 200ms
NFR3: System supports up to 10 concurrent users without performance degradation
NFR4: User passwords stored hashed using bcrypt (cost factor 12) — plaintext storage forbidden
NFR5: All authenticated API endpoints reject requests without a valid session token
NFR6: User sessions expire after a configurable period of inactivity (JWT_EXPIRY env var, default 7 days)
NFR7: Application served over HTTPS in any non-local deployment
NFR8: Each user accesses only data within the shared team workspace — no cross-account data leakage

### Additional Requirements

- AR1: Project scaffolded as monorepo with frontend/ (Vite + React + TypeScript + Tailwind + shadcn/ui), backend/ (Express + TypeScript + Prisma), and docker-compose.yml at root
- AR2: Docker Compose orchestrates postgres (PostgreSQL 16), backend (ts-node-dev hot reload), and frontend (Vite HMR) — all start with `docker compose up`
- AR3: Prisma schema defines canonical data model: User, Project, Status, Task, Comment with cuid() string IDs
- AR4: JWT stored in httpOnly SameSite=Strict cookie; requireAuth middleware validates token on all non-auth routes; attaches req.user
- AR5: Global error handler middleware in Express; typed AppError class (code, message, statusCode); all route handlers use next(err)
- AR6: TanStack Query key factory defined in frontend/src/lib/queryKeys.ts — never inline query key arrays
- AR7: All API responses wrapped in { data } or { error } — never bare objects
- AR8: Zod validation middleware factory (validate.ts) applied to all write (POST/PATCH/PUT) endpoints
- AR9: Axios instance in lib/apiClient.ts with credentials: 'include' and 401 interceptor redirecting to /login
- AR10: Default statuses (To Do, In Progress, In Review, Done) created automatically when a new project is created
- AR11: Status deletion: service layer checks for tasks referencing the status and reassigns them to default "To Do" before deleting

### UX Design Requirements

UX-DR1: Implement zinc neutral color scale as Tailwind design tokens: zinc-50 (background), white (surfaces), zinc-200 (borders), zinc-900 (primary text), zinc-500 (secondary text), indigo-600 (interactive accent), indigo-700 (hover accent)
UX-DR2: Implement 5 default status color tokens: zinc-400 (To Do), blue-500 (In Progress), amber-500 (In Review), red-500 (Blocked), green-500 (Done)
UX-DR3: Implement Inter variable font with 4 typographic levels: 20px/600 (heading), 16px/500 (subheading), 14px/400 (body), 12px/500 (label); configured in Tailwind
UX-DR4: Implement Focus Wide layout: 56px dark zinc-900 icon-only AppSidebar + main content area with project name header + assignee filter toolbar above board
UX-DR5: Implement StatusChip component — clickable colored badge (dot + label) that opens status dropdown; optimistic UI update on select; brief opacity pulse during update; reverts on API failure with inline error
UX-DR6: Implement TaskCard component — title + status chip (bottom-left) + assignee avatar initials (bottom-right); hover reveals ··· DropdownMenu (Edit, Delete); click anywhere on card opens TaskDetailPanel
UX-DR7: Implement BoardColumn component — status name + task count header + scrollable TaskCard list + "Add task" ghost button at bottom; min-width 240px; board columns flex-grow equally
UX-DR8: Implement TaskDetailPanel — 400px right-side slide-in panel; board columns remain visible and scrollable; all fields click-to-edit inline (save on blur/Enter); close on X button or Escape key; URL query param ?task=123 for deep-linking
UX-DR9: Implement CommentThread component — chronological list of comments (avatar + author name + timestamp + body text) + always-visible text input at bottom; Enter submits, Shift+Enter inserts newline
UX-DR10: Implement AssigneeFilterBar — "All" chip + one chip per team member with initials avatar; indigo-600 highlight on active chip; click to filter board, click again or "All" to clear
UX-DR11: Implement ConfirmDialog — centered dialog max-width 400px; neutral language ("Delete this task? This cannot be undone."); Cancel button left, destructive Delete button right; Enter confirms, Escape cancels; used for FR10 and FR15
UX-DR12: Implement hover-reveal pattern for ··· menu on TaskCard — instant opacity 0→1 on mouseenter; menu items keyboard-accessible via Tab and Enter
UX-DR13: Implement skeleton loading states using shadcn/ui Skeleton (zinc-200 animated shimmer) for board initial load and task list; no full-page spinners anywhere
UX-DR14: Implement empty states: board with no tasks shows "No tasks yet — add your first task" with ghost CTA button; dashboard with no projects shows "Create your first project to get started" with primary button; new project board shows default status columns immediately (never blank)
UX-DR15: Implement inline API error display near the failed action ("Couldn't save — try again"); auto-dismiss after 4 seconds; 401 errors redirect to /login globally via Axios interceptor
UX-DR16: Implement project switching via project name dropdown in board header — click opens list of all projects, selecting one navigates instantly
UX-DR17: Implement accessibility baseline: all interactive elements minimum 32px height; focus-visible:ring-2 ring-indigo-500 on all focusable elements; status chips always show color + text label (never color alone); semantic HTML (button, nav, main, dialog)

### FR Coverage Map

FR1: Epic 2 — User Authentication (register with email and password)
FR2: Epic 2 — User Authentication (log in with email and password)
FR3: Epic 2 — User Authentication (log out)
FR4: Epic 2 — User Authentication (session persistence across browser refreshes)
FR5: Epic 2 — User Authentication (view list of all registered team members)
FR6: Epic 3 — Project Management (create a new project)
FR7: Epic 3 — Project Management (view all projects on dashboard)
FR8: Epic 3 — Project Management (edit a project's name)
FR9: Epic 3 — Project Management (delete a project)
FR10: Epic 3 — Project Management (delete confirmation prompt)
FR11: Epic 4 — Task Board (create a task with title and description)
FR12: Epic 4 — Task Board (view all tasks in a project)
FR13: Epic 4 — Task Board (edit a task's title and description)
FR14: Epic 4 — Task Board (delete a task)
FR15: Epic 4 — Task Board (task delete confirmation prompt)
FR16: Epic 4 — Task Board (view task full detail)
FR17: Epic 5 — Status Management (default statuses per project)
FR18: Epic 5 — Status Management (create custom statuses)
FR19: Epic 5 — Status Management (edit status name)
FR20: Epic 5 — Status Management (delete custom status)
FR21: Epic 5 — Status Management (change a task's status)
FR22: Epic 6 — Assignment & Collaboration (assign task to team member)
FR23: Epic 6 — Assignment & Collaboration (reassign task)
FR24: Epic 6 — Assignment & Collaboration (leave task unassigned)
FR25: Epic 6 — Assignment & Collaboration (add comment to task)
FR26: Epic 6 — Assignment & Collaboration (view comments in chronological order)
FR27: Epic 6 — Assignment & Collaboration (comment shows author name and timestamp)
FR28: Epic 4 — Task Board (board view grouped by status)
FR29: Epic 6 — Assignment & Collaboration (filter tasks by assignee)
FR30: Epic 3 — Project Management (navigate between projects from dashboard)
FR31: Epic 4 — Task Board (open task detail from board)

## Epic List

### Epic 1: Runnable Application Foundation
A developer can clone the repo, run `docker compose up`, and have a working app shell — frontend, backend, and database all connected, with the Prisma schema migrated and the design system in place.
**ARs covered:** AR1, AR2, AR3, AR4, AR5, AR6, AR7, AR8, AR9, AR10, AR11
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4

### Epic 2: User Authentication
Team members can register accounts, log in with email and password, maintain sessions across browser refreshes, and log out. All app routes are protected — unauthenticated users are redirected to login.
**FRs covered:** FR1, FR2, FR3, FR4, FR5
**NFRs covered:** NFR4, NFR5, NFR6, NFR7, NFR8
**UX-DRs covered:** UX-DR15, UX-DR17

### Epic 3: Project Management
Authenticated team members can create, view, rename, and delete projects from the dashboard. The project list is the home base, with empty states and delete confirmation protecting against accidental data loss.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR30
**NFRs covered:** NFR1, NFR2
**UX-DRs covered:** UX-DR11, UX-DR14, UX-DR16

### Epic 4: Task Board
Team members can create, view, edit, and delete tasks within a project and see them on a board grouped by the project's default statuses. Clicking a task opens a full detail panel without leaving the board.
**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16, FR28, FR31
**NFRs covered:** NFR1, NFR2
**UX-DRs covered:** UX-DR6, UX-DR7, UX-DR8, UX-DR12, UX-DR13

### Epic 5: Status Management
Team members can customize a project's statuses — create new ones, rename or delete existing ones. Task status changes happen inline on the board card with optimistic UI.
**FRs covered:** FR17, FR18, FR19, FR20, FR21
**UX-DRs covered:** UX-DR5, UX-DR2

### Epic 6: Task Assignment & Collaboration
Team members can assign tasks to teammates, filter the board by assignee, and leave threaded comments on tasks. The board becomes a fully collaborative workspace.
**FRs covered:** FR22, FR23, FR24, FR25, FR26, FR27, FR29
**UX-DRs covered:** UX-DR9, UX-DR10

---

## Epic 1: Runnable Application Foundation

A developer can clone the repo, run `docker compose up`, and have a working app shell — frontend, backend, and database all connected, with the Prisma schema migrated and the design system in place.

### Story 1.1: Project Scaffold & Docker Compose Setup

As a developer,
I want a monorepo scaffold with Docker Compose that starts all services with a single command,
So that I can run the full application locally without manual setup.

**Acceptance Criteria:**

**Given** the repo is cloned and `.env` is configured from `.env.example`
**When** the developer runs `docker compose up`
**Then** three services start: `postgres` (PostgreSQL 16), `backend` (Express on port 3000), and `frontend` (Vite dev server on port 5173)
**And** the backend service waits for the postgres health check before starting
**And** the frontend proxies `/api/*` requests to the backend
**And** hot reload works for both backend (ts-node-dev) and frontend (Vite HMR) on file changes
**And** `.env.example` documents all required variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `PORT`, `FRONTEND_URL`

### Story 1.2: Database Schema & Prisma Migration

As a developer,
I want the Prisma schema defined and an initial migration run automatically on startup,
So that the database is ready with the correct tables immediately after `docker compose up`.

**Acceptance Criteria:**

**Given** the postgres service is healthy
**When** the backend container starts
**Then** `prisma migrate deploy` runs and applies the initial migration
**And** the database contains tables for: User, Project, Status, Task, Comment with the canonical schema (cuid string IDs, correct relations and nullability as defined in architecture)
**And** running `docker compose up` a second time is idempotent — no duplicate migration errors

### Story 1.3: Design System & App Shell

As a developer,
I want Tailwind CSS, shadcn/ui, and the Focus Wide layout shell configured,
So that all future UI stories start from a consistent, styled foundation.

**Acceptance Criteria:**

**Given** the frontend is running
**When** a developer opens `http://localhost:5173`
**Then** the app renders the Focus Wide layout: a 56px dark (`zinc-900`) icon-only AppSidebar on the left and a main content area filling the rest
**And** Tailwind design tokens are configured: zinc neutral scale, indigo-600 accent, status color palette (zinc-400/blue-500/amber-500/red-500/green-500), Inter font at all 4 typographic levels
**And** shadcn/ui is initialized with the zinc theme and CSS variables
**And** the AppSidebar renders navigation icon buttons with `aria-label` and Tooltip on each
**And** all interactive elements have `focus-visible:ring-2 ring-indigo-500` focus indicators

---

## Epic 2: User Authentication

Team members can register accounts, log in with email and password, maintain sessions across browser refreshes, and log out. All app routes are protected — unauthenticated users are redirected to login.

### Story 2.1: User Registration

As a new team member,
I want to register an account with my name, email, and password,
So that I can access the task tracking app.

**Acceptance Criteria:**

**Given** I open the app and navigate to `/register`
**When** I submit a valid name, email, and password
**Then** my account is created with the password hashed using bcrypt (cost factor 12)
**And** I am redirected to the dashboard (`/`)
**And** a JWT is set as an httpOnly, SameSite=Strict cookie with expiry per `JWT_EXPIRY`
**And** if I submit an email that already exists, an inline error appears: "An account with this email already exists"
**And** if required fields are empty, inline validation errors appear under the offending field on blur
**And** the form submit button is disabled until all fields have values

### Story 2.2: User Login & Session Persistence

As a registered team member,
I want to log in with my email and password and have my session persist across browser refreshes,
So that I don't have to log in every time I open the app.

**Acceptance Criteria:**

**Given** I have a registered account and navigate to `/login`
**When** I submit valid credentials
**Then** I am redirected to the dashboard and the JWT cookie is set
**And** refreshing the browser keeps me logged in — the app reads the cookie and does not redirect to `/login`
**And** if I submit incorrect credentials, an inline calm error appears: "Email or password incorrect" — not revealing which field is wrong
**And** all routes except `/login` and `/register` redirect unauthenticated users to `/login` via `ProtectedRoute`
**And** the Axios client is configured with `credentials: 'include'` so the cookie is sent on every request

### Story 2.3: User Logout & 401 Handling

As an authenticated team member,
I want to log out and have expired sessions handled gracefully,
So that I can end my session and the app recovers cleanly when my session expires.

**Acceptance Criteria:**

**Given** I am logged in
**When** I click the logout action in the sidebar
**Then** `POST /api/auth/logout` is called, the JWT cookie is cleared, and I am redirected to `/login`
**And** after logout, navigating to any protected route redirects me to `/login`
**And** if any API call returns a 401, the Axios response interceptor redirects me to `/login` automatically — no per-component 401 handling required
**And** inline API errors (non-401) appear near the failed action as calm text ("Couldn't save — try again") and auto-dismiss after 4 seconds

### Story 2.4: View Team Members

As an authenticated team member,
I want the app to have access to the list of all registered team members,
So that team members can be listed for task assignment in future epics.

**Acceptance Criteria:**

**Given** I am authenticated
**When** the app calls `GET /api/users`
**Then** the endpoint returns `{ data: [{ id, name, email }] }` for all registered users
**And** the endpoint is protected by `requireAuth` middleware — unauthenticated requests receive a 401
**And** the response excludes the `password` field from all user records

---

## Epic 3: Project Management

Authenticated team members can create, view, rename, and delete projects from the dashboard. The project list is the home base, with empty states and delete confirmation protecting against accidental data loss.

### Story 3.1: Project Dashboard & Creation

As an authenticated team member,
I want to see all projects on the dashboard and create new ones,
So that my team can start organizing work into projects immediately.

**Acceptance Criteria:**

**Given** I am authenticated and navigate to `/`
**When** the dashboard loads
**Then** all existing projects are displayed as cards with their names
**And** the initial load completes in under 3 seconds
**And** if no projects exist, an empty state shows: "Create your first project to get started" with a primary "New Project" button
**And** clicking "New Project" opens a centered modal (max-width 480px) with a project name input field
**And** the Create button is disabled until the name field has a value
**And** submitting a valid name calls `POST /api/projects`, closes the modal, and the new project card appears on the dashboard
**And** the new project is created with default statuses automatically: To Do, In Progress, In Review, Done (in that order)
**And** pressing Escape or clicking outside the modal cancels without creating a project

### Story 3.2: Edit & Delete Project

As an authenticated team member,
I want to rename and delete projects,
So that I can keep the project list accurate and remove stale work.

**Acceptance Criteria:**

**Given** I am on the dashboard viewing a project card
**When** I click the project settings or edit action
**Then** I can edit the project name inline or via a modal, and `PATCH /api/projects/:id` is called on save
**And** the updated name appears immediately without a page reload

**Given** I choose to delete a project
**When** I click the delete action
**Then** a ConfirmDialog appears: "Delete this project? This cannot be undone." with Cancel (left) and Delete (right) buttons
**And** pressing Escape or Cancel closes the dialog without deleting
**And** confirming calls `DELETE /api/projects/:id` and the project is removed from the dashboard
**And** `DELETE /api/projects/:id` cascades — all tasks, statuses, and comments belonging to the project are also deleted

### Story 3.3: Project Navigation

As an authenticated team member,
I want to navigate to a project's board from the dashboard and switch between projects,
So that I can move quickly between active projects.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I click a project card
**Then** I navigate to `/projects/:id` and see the project board
**And** the board header displays the current project name
**And** clicking the project name in the board header opens a dropdown listing all projects
**And** selecting a project from the dropdown navigates instantly to that project's board
**And** the AppSidebar highlights the active navigation icon for the current section

---

## Epic 4: Task Board

Team members can create, view, edit, and delete tasks within a project and see them on a board grouped by the project's default statuses. Clicking a task opens a full detail panel without leaving the board.

### Story 4.1: Task Board View

As a team member,
I want to see all tasks in a project organized into columns by status,
So that I can understand the state of work at a glance.

**Acceptance Criteria:**

**Given** I navigate to `/projects/:id`
**When** the board loads
**Then** tasks are grouped into BoardColumn components, one column per project status, in the order the statuses are defined
**And** each BoardColumn shows the status name and a count of tasks in that column
**And** each TaskCard displays the task title, status chip (bottom-left), and assignee avatar initials (bottom-right, if assigned)
**And** skeleton loading states (zinc-200 shimmer) are shown during the initial data fetch — no full-page spinner
**And** if a column has no tasks, it shows "No tasks yet — add your first task" with a ghost "Add task" button
**And** the board load completes in under 3 seconds on standard broadband
**And** board columns flex-grow equally and have a minimum width of 240px; horizontal scroll activates if columns exceed the viewport

### Story 4.2: Task Creation

As a team member,
I want to create a task within a project,
So that work items are tracked on the board.

**Acceptance Criteria:**

**Given** I am on a project board
**When** I click the "Add task" ghost button in any column or a global "New Task" button
**Then** a centered modal opens (max-width 480px) with a required Title field and an optional Description field
**And** the Create button is disabled until the Title field has a value
**And** submitting calls `POST /api/tasks` with the task's projectId and statusId (defaulting to the column's status or "To Do")
**And** the new TaskCard appears in the correct column immediately after creation
**And** pressing Escape or clicking outside the modal cancels without creating a task
**And** Zod validation on the backend rejects requests missing the title and returns a 400 with `{ error: { code: "VALIDATION_ERROR" } }`

### Story 4.3: Task Detail Panel

As a team member,
I want to open a task's full detail in a side panel without leaving the board,
So that I can read and edit task details while keeping the board visible.

**Acceptance Criteria:**

**Given** I am on a project board
**When** I click a TaskCard
**Then** a TaskDetailPanel slides in from the right (400px wide), showing: title, description, assignee, status, and comment thread area
**And** the board columns remain visible and scrollable to the left of the panel
**And** the URL updates to `/projects/:id?task=<taskId>` — navigating directly to this URL opens the panel
**And** all fields (title, description) are click-to-edit inline — clicking a field makes it editable; saving on blur or Enter calls `PATCH /api/tasks/:id`
**And** clicking the X button or pressing Escape closes the panel and removes the `?task` query param
**And** the panel interaction completes in under 200ms

### Story 4.4: Edit & Delete Task

As a team member,
I want to edit task details and delete tasks with a confirmation step,
So that I can keep task information accurate and safely remove tasks I no longer need.

**Acceptance Criteria:**

**Given** I hover over a TaskCard on the board
**When** the hover state activates
**Then** a ··· menu button appears instantly (opacity 0→1, no delay)
**And** clicking ··· opens a DropdownMenu with "Edit" and "Delete" options
**And** "Edit" opens the task in the TaskDetailPanel for inline editing
**And** "Delete" opens a ConfirmDialog: "Delete this task? This cannot be undone." with Cancel (left) and Delete (right)
**And** confirming deletion calls `DELETE /api/tasks/:id`, the TaskCard is removed from the board, and the column count updates
**And** pressing Escape or Cancel closes the dialog without deleting
**And** the ··· menu is also keyboard-accessible: Tab to card, Enter/Space to open menu
**And** `DELETE /api/tasks/:id` cascades — all comments on the task are also deleted

---

## Epic 5: Status Management

Team members can customize a project's statuses — create new ones, rename or delete existing ones. Task status changes happen inline on the board card with optimistic UI.

### Story 5.1: Inline Task Status Change

As a team member,
I want to change a task's status directly from its card on the board,
So that I can update progress without opening the task detail or navigating away.

**Acceptance Criteria:**

**Given** I am on the project board and see a TaskCard
**When** I hover over the StatusChip on the card
**Then** the chip shows a subtle hover state (cursor pointer + border) indicating it is interactive
**And** clicking the StatusChip opens a dropdown listing all project statuses in their defined order
**And** selecting a new status updates the chip immediately (optimistic UI) with a brief opacity pulse animation
**And** `PATCH /api/tasks/:id` is called in the background with the new statusId
**And** if the API call succeeds, the card reflects the new status permanently; if it fails, the chip reverts to the previous status and an inline error appears: "Couldn't save — try again"
**And** the entire status change interaction completes within 200ms from click to visual confirmation
**And** the StatusChip always shows both a colored dot and the status name text — never color alone

### Story 5.2: Custom Status Management

As a team member,
I want to create, rename, and delete custom statuses for a project,
So that I can tailor the board columns to match my team's actual workflow.

**Acceptance Criteria:**

**Given** I am on a project board
**When** I open the status settings (⚙ icon in the board header)
**Then** a StatusSettingsPanel opens showing all current statuses in their display order with their assigned colors
**And** I can create a new status by entering a name — `POST /api/projects/:id/statuses` is called and the new column appears on the board
**And** I can rename an existing status inline — `PATCH /api/projects/:id/statuses/:id` is called on blur/Enter and the column header updates
**And** I can delete a status — a ConfirmDialog appears: "Delete this status? Tasks will be moved to 'To Do'."
**And** confirming deletion calls `DELETE /api/projects/:id/statuses/:id`; the service layer reassigns all tasks on that status to the project's default "To Do" status before deleting
**And** the default statuses (To Do, In Progress, In Review, Done) can be renamed but not deleted
**And** the board updates to reflect status changes without a full page reload

---

## Epic 6: Task Assignment & Collaboration

Team members can assign tasks to teammates, filter the board by assignee, and leave threaded comments on tasks. The board becomes a fully collaborative workspace.

### Story 6.1: Task Assignment

As a team member,
I want to assign a task to any teammate, reassign it, or leave it unassigned,
So that everyone knows who is responsible for each piece of work.

**Acceptance Criteria:**

**Given** I have a task open in the TaskDetailPanel
**When** I click the assignee field
**Then** a dropdown opens listing all registered team members by name
**And** selecting a team member calls `PATCH /api/tasks/:id` with the new `assigneeId` and the field updates instantly
**And** I can clear the assignee by selecting "Unassigned" from the dropdown — `assigneeId` is set to null
**And** the TaskCard on the board updates to show the assignee's initials avatar (bottom-right) or no avatar if unassigned
**And** `GET /api/users` powers the dropdown — the list is fetched once and cached by TanStack Query (`queryKeys.users.all`)

### Story 6.2: Assignee Filter Bar

As a team member,
I want to filter the task board by assignee,
So that I can focus on my own tasks or review a teammate's workload.

**Acceptance Criteria:**

**Given** I am on a project board with at least one assigned task
**When** I look above the board columns
**Then** the AssigneeFilterBar is visible with an "All" chip and one chip per team member who has at least one task assigned
**And** clicking a member's chip highlights it in indigo-600 and filters the board to show only that member's tasks across all columns
**And** clicking the active chip again, or clicking "All", clears the filter and shows all tasks
**And** only one filter can be active at a time — clicking a new chip replaces the previous selection
**And** the filter is client-side only — no additional API call is made when switching filters

### Story 6.3: Task Comments

As a team member,
I want to leave comments on a task and read my teammates' comments,
So that our discussion and decisions are captured alongside the work.

**Acceptance Criteria:**

**Given** I have a task open in the TaskDetailPanel
**When** I scroll to the bottom of the panel
**Then** I see a CommentThread showing all existing comments in chronological order (oldest at top)
**And** each comment shows: the author's name, a timestamp (formatted as relative time e.g. "2 hours ago"), and the comment body
**And** a text input field is always visible below the thread with a Send button
**And** typing a comment and pressing Enter (or clicking Send) calls `POST /api/tasks/:id/comments` and the comment appears at the bottom of the thread immediately
**And** Shift+Enter inserts a newline without submitting
**And** if the comment body is empty, the Send button is disabled and Enter does not submit
**And** if no comments exist, the thread shows "Be the first to comment"
**And** `GET /api/tasks/:id/comments` returns `{ data: [{ id, body, createdAt, author: { id, name } }] }` in ascending order by `createdAt`
