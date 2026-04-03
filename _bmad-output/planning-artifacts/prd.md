---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
inputDocuments: []
workflowType: 'prd'
---

# Product Requirements Document - bmad-tutorial-1

**Author:** Diyor
**Date:** 2026-04-03

## Executive Summary

A lightweight, browser-based task tracking tool built for a small team of 5–7 people. Solves the problem of over-engineered project management tools by delivering only the essentials — project and task management, assignments, comments, and flexible status workflows — in a clean, immediately usable interface. Owned and extended by the team, not configured around a vendor's limitations.

**What makes it different:** Most task trackers are built for enterprise scale, forcing small teams through complexity they don't need. This product inverts that: ships with exactly what a small team needs, nothing more, with a codebase the team controls and can customize freely. No subscriptions, no feature bloat, no learning curve.

**Project Type:** Web App (browser-based SPA) — **Domain:** General — **Complexity:** Low — **Context:** Greenfield

## Success Criteria

### User Success

- Any team member can register and log in without assistance
- All active projects are visible at a glance on the main dashboard
- Each project has a task board showing task status and assignee at a glance
- A new task can be created and assigned in under 60 seconds
- Team members can find the status of any task without asking a colleague

### Business Success

- 100% team adoption (all 5–7 members) within the first week of launch
- Team stops using previous tracking methods (spreadsheets, chat threads) within 2 weeks

### Technical Success

- App loads and is usable in any modern browser
- No data loss on task or project operations
- Authentication is secure (hashed passwords, session management)

### Measurable Outcomes

- All 5–7 team members have active accounts
- At least one project and its tasks tracked entirely through the app within week 1

## Product Scope

### MVP — Phase 1

**Launch Criteria:** All capabilities below working end-to-end with no critical bugs.

- User registration and login (auth)
- Project CRUD (create, view, edit, delete)
- Task CRUD within a project
- Task assignment to team members
- Comments on tasks
- Task status changes
- Custom status creation per project
- Task board view per project
- Delete confirmation for all destructive actions

**MVP Approach:** Experience MVP — ships only when all features work end-to-end. No partial launches.

**Resource Requirements:** Small development team; standard full-stack web development skills sufficient.

### Growth — Phase 2

- Due dates and deadline reminders
- Task filtering and search by assignee, status, or keyword
- Activity log / audit trail per task
- File attachments on tasks
- In-app notifications

### Expansion — Phase 3

- Third-party integrations (GitHub, Slack)
- Reporting and analytics dashboard
- Mobile-optimized view
- Public API for external access

### Risk Mitigation

**Technical:** Low risk — standard SPA + REST API stack. Custom status data model is the most nuanced design decision; address in architecture phase.

**Adoption:** Team buy-in is the only risk; mitigated by frictionless self-registration and simple UI.

**Capacity:** If constrained, defer comments to Phase 2 — auth, projects, tasks, assignments, and statuses are the irreducible core.

## User Journeys

### Journey 1: New Team Member — Getting Started

**Meet Amir.** It's his first day on the team. His colleague sends him the app URL. Amir registers with his email and password in under a minute, lands on the dashboard, sees all active projects, clicks into one, and immediately understands who's working on what from the task board. No onboarding email. No tutorial. Oriented in 2 minutes.

*Reveals: registration flow, dashboard with project list, task board view.*

### Journey 2: Team Member — Creating a Project

**Meet Zara.** The team is starting a new sprint. She clicks "New Project", names it, and lands inside. The default statuses don't match her workflow, so she adds "In Review" and "Blocked". She creates the first tasks, assigns them to teammates, and shares the project link. The board is live in 5 minutes.

*Reveals: project creation, custom status management, task creation, task assignment.*

### Journey 3: Team Member — Daily Task Work

**Meet Bekzod.** He opens the app each morning, filters the board to his name, and sees three tasks. He updates the top priority from "To Do" to "In Progress", leaves a question for Zara in the comment thread, and moves on. Zara replies later; he gets back to it and marks it "Done" by end of day.

*Reveals: assignee filtering, status updates, comment threads.*

### Journey 4: Edge Case — Accidental Deletion

**Meet Diyor.** He accidentally deletes a task thinking it was a duplicate. The task had comments and context on it. Without a confirmation step, the data is gone and the team loses history.

*Reveals: delete confirmation dialogs are required for all destructive actions.*

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Registration & login | Journey 1 |
| Project list dashboard | Journey 1 |
| Task board view per project | Journey 1, 3 |
| Project creation | Journey 2 |
| Custom status management | Journey 2 |
| Task creation & assignment | Journey 2 |
| Assignee filtering | Journey 3 |
| Task status updates | Journey 3 |
| Comments on tasks | Journey 3 |
| Delete confirmation dialogs | Journey 4 |

## Web App Requirements

### Architecture

- **Rendering:** SPA — client-side routing, no full page reloads
- **API:** Frontend communicates with a backend REST API
- **Real-time:** Not required for v1; manual refresh is acceptable
- **Deployment:** HTTPS required in any non-local environment

### Browser Support

| Browser | Support |
|---|---|
| Chrome (latest) | Required |
| Firefox (latest) | Required |
| Safari (latest) | Required |
| Edge (latest) | Required |
| Legacy browsers | Not supported |

### Viewport & Responsive Design

- Desktop-only for v1; minimum supported viewport 1280px wide
- No mobile or tablet breakpoints required

### Accessibility

- Standard usable UI: clear labels, readable contrast, keyboard-navigable forms
- No WCAG compliance requirement for v1

## Functional Requirements

### User Management

- **FR1:** Users can register an account with email and password
- **FR2:** Users can log in with email and password
- **FR3:** Users can log out
- **FR4:** The system maintains authenticated sessions across browser refreshes
- **FR5:** Users can view a list of all registered team members

### Project Management

- **FR6:** Users can create a new project with a name
- **FR7:** Users can view all existing projects on the main dashboard
- **FR8:** Users can edit a project's name
- **FR9:** Users can delete a project
- **FR10:** Users receive a confirmation prompt before a project is permanently deleted

### Task Management

- **FR11:** Users can create a task within a project with a title and description
- **FR12:** Users can view all tasks in a project
- **FR13:** Users can edit a task's title and description
- **FR14:** Users can delete a task
- **FR15:** Users receive a confirmation prompt before a task is permanently deleted
- **FR16:** Users can view a task's full detail (title, description, assignee, status, comments)

### Status Management

- **FR17:** Each project has a default set of statuses (e.g. To Do, In Progress, Done)
- **FR18:** Users can create custom statuses for a project
- **FR19:** Users can edit the name of an existing status
- **FR20:** Users can delete a custom status from a project
- **FR21:** Users can change the status of any task

### Task Assignment

- **FR22:** Users can assign a task to any registered team member
- **FR23:** Users can reassign a task to a different team member
- **FR24:** Users can leave a task unassigned

### Team Collaboration

- **FR25:** Users can add a comment to a task
- **FR26:** Users can view all comments on a task in chronological order
- **FR27:** Each comment displays the author's name and timestamp

### Navigation & Discovery

- **FR28:** Users can view a task board for a project with tasks grouped by status
- **FR29:** Users can filter tasks on the board by assignee
- **FR30:** Users can navigate between projects from the dashboard
- **FR31:** Users can open a task to view its full detail from the board

## Non-Functional Requirements

### Performance

- Initial app load completes in under 3 seconds on standard broadband
- All user-triggered interactions (status change, task open, comment submit) complete in under 200ms
- System supports up to 10 concurrent users without performance degradation

### Security

- User passwords stored hashed using a modern algorithm (e.g. bcrypt) — plaintext storage forbidden
- All authenticated API endpoints reject requests without a valid session token
- User sessions expire after a configurable period of inactivity
- Application served over HTTPS in any non-local deployment
- Each user accesses only data within the shared team workspace — no cross-account data leakage
