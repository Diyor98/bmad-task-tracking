# Story 1.2: Database Schema & Prisma Migration

## Status: review

## Story

**As a** developer,
**I want** the Prisma schema defined and an initial migration run automatically on startup,
**So that** the database is ready with the correct tables immediately after `docker compose up`.

## Acceptance Criteria

1. Given the postgres service is healthy, When the backend container starts, Then `prisma migrate deploy` runs and applies the initial migration
2. And the database contains tables for: User, Project, Status, Task, Comment with the canonical schema (cuid string IDs, correct relations and nullability as defined in architecture)
3. And running `docker compose up` a second time is idempotent — no duplicate migration errors

## Tasks / Subtasks

- [x] Task 1: Update Prisma schema with canonical data model
  - [x] Add User model with cuid id, name, email (unique), password, createdAt, relations to Task and Comment
  - [x] Add Project model with cuid id, name, createdAt, relations to Status and Task
  - [x] Add Status model with cuid id, name, color, order, projectId FK (cascade delete), relation to Task
  - [x] Add Task model with cuid id, title, description (optional), projectId FK, statusId FK, assigneeId (optional) FK, createdAt, relations to Comment
  - [x] Add Comment model with cuid id, body, taskId FK (cascade delete), authorId FK, createdAt

- [x] Task 2: Create initial Prisma migration
  - [x] Run `prisma migrate dev --name init --create-only` to generate the migration SQL without applying it

- [x] Task 3: Configure startup migration in Dockerfile
  - [x] Update Dockerfile CMD to run `npx prisma migrate deploy` before starting the dev server

## Dev Notes

### Prisma v7 Specifics

- **No `url` in `schema.prisma`**: Prisma v7 separates database connection config from the schema. The `datasource db` block has only `provider`, no `url` field.
- **`prisma.config.ts`**: Holds `DATABASE_URL` via `datasource.url: process.env["DATABASE_URL"]`. This file is already set up correctly.
- **Generator output**: `output = "../src/generated/prisma"` — the generated client goes to `backend/src/generated/prisma`.
- **Migration commands**:
  - `prisma migrate dev --name init` — creates AND applies migration (requires live DB, for local dev)
  - `prisma migrate dev --name init --create-only` — creates migration SQL file only, without applying (used here since no live DB in CI)
  - `prisma migrate deploy` — applies pending migrations (used in Docker startup, idempotent)

### Canonical Prisma Schema

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  password  String
  createdAt DateTime  @default(now())
  tasks     Task[]    @relation("assignee")
  comments  Comment[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  statuses  Status[]
  tasks     Task[]
}

model Status {
  id        String  @id @default(cuid())
  name      String
  color     String
  order     Int
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  projectId   String
  statusId    String
  assigneeId  String?
  createdAt   DateTime  @default(now())
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  status      Status    @relation(fields: [statusId], references: [id])
  assignee    User?     @relation("assignee", fields: [assigneeId], references: [id])
  comments    Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  taskId    String
  authorId  String
  createdAt DateTime @default(now())
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
}
```

### Dockerfile Migration Strategy

The Dockerfile CMD uses a shell invocation to run migrate deploy before starting the server:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
```

This ensures:
- Migration runs every startup (idempotent — already-applied migrations are skipped)
- Server only starts after DB schema is confirmed up-to-date
- Works with Docker health checks on the postgres service
