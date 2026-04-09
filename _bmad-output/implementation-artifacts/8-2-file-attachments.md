# Story 8.2: File Attachments

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a team member,
I want to attach files to tasks and view/download/delete them,
so that I can share relevant documents, screenshots, and resources directly on the task.

## Acceptance Criteria

1. Users can upload a file attachment to a task from the task detail panel
2. Uploaded files are persisted to local disk storage and metadata is stored in the database
3. The task detail panel shows a list of attachments with filename, file size, and upload date
4. Users can download an attachment by clicking on it
5. Users can delete an attachment (with confirmation)
6. File size is limited to 10MB per upload — validation error shown if exceeded
7. Supported file types: images (png, jpg, gif, webp), documents (pdf), and text (txt, csv) — validation error for unsupported types
8. When a task is deleted, all its attachments are cascade-deleted from both database and disk
9. The TaskCard shows an attachment count badge when a task has attachments
10. Existing board functionality (drag-and-drop, search, filters, status change, create task, priority/due date) is not broken

## Tasks / Subtasks

- [x] Task 1: Install multer and create Attachment model (AC: #2)
  - [x] Install `multer` and `@types/multer` in backend
  - [x] Add `Attachment` model to `schema.prisma` with id, filename, fileKey, fileSize, mimeType, taskId, uploaderId, createdAt
  - [x] Add `attachments Attachment[]` relation to Task model and `uploads Attachment[]` to User model
  - [x] Create and apply Prisma migration
  - [x] Regenerate Prisma client
- [x] Task 2: Backend — file storage and upload middleware (AC: #2, #6, #7)
  - [x] Create `uploads/` directory in backend root (gitignored)
  - [x] Add `uploads/` to `.gitignore`
  - [x] Configure multer with disk storage: destination `uploads/`, filename as `${randomUUID()}.${ext}`
  - [x] Set multer file size limit to 10MB (10 * 1024 * 1024 bytes)
  - [x] Add multer file filter for allowed MIME types
  - [x] Add `backend_uploads` volume mount to docker-compose.yml
- [x] Task 3: Backend — attachment routes and service (AC: #1, #3, #4, #5, #8)
  - [x] Create `attachments.service.ts` with create, listByTask, getById, delete, deleteAllForTask
  - [x] Create `attachments.routes.ts` with POST upload, GET list, GET download, DELETE
  - [x] Mount routes in `index.ts` at /api/tasks and /api/attachments
  - [x] POST: validates task exists, saves via multer, creates Attachment record
  - [x] GET list: returns attachments ordered by createdAt desc
  - [x] GET download: streams file with Content-Type and Content-Disposition
  - [x] DELETE: removes file from disk and deletes record
  - [x] Task delete calls attachmentsService.deleteAllForTask before Prisma cascade
- [x] Task 4: Frontend — attachment hooks and query keys (AC: #1, #3, #5)
  - [x] Add `attachments.byTask` to `queryKeys.ts`
  - [x] Create `useAttachments.ts` with query + upload/delete mutations
  - [x] Upload uses FormData with multipart/form-data
  - [x] Invalidates attachments + tasks queries on success
- [x] Task 5: Frontend — AttachmentSection in TaskDetailPanel (AC: #1, #3, #4, #5, #6, #7)
  - [x] Create `AttachmentSection.tsx` with file input, list, delete with confirmation
  - [x] Hidden file input triggered by "Attach file" button with Paperclip icon
  - [x] Attachment rows: Paperclip icon, filename link, size, date, delete button
  - [x] Download via `/api/attachments/:id/download` in new tab
  - [x] Inline error for upload failures (file too large, unsupported type)
  - [x] Added to TaskDetailPanel between Description and Comments
- [x] Task 6: TaskCard — attachment count badge (AC: #9)
  - [x] Updated `taskInclude` to include `_count.attachments`
  - [x] Updated Task interface `_count: { comments: number; attachments: number }`
  - [x] Paperclip icon + count badge on TaskCard when attachments > 0
- [x] Task 7: Regression testing (AC: #10)
  - [x] TypeScript and ESLint pass with zero errors
  - [x] API tested: upload, list, download, delete all work
  - [x] Attachment count shows correctly in task list response
  - [x] Task delete cascades attachment file cleanup

### Review Findings

- [x] [Review][Patch] Route shadowing — mounted at `/api` with full paths `/tasks/:taskId/attachments` and `/attachments/:id/*` to avoid collision [index.ts, attachments.routes.ts]
- [x] [Review][Patch] Orphan file cleanup — added `fs.promises.unlink(req.file.path)` in catch block [attachments.routes.ts]
- [x] [Review][Patch] Removed manual Content-Type header — axios auto-generates multipart boundary [useAttachments.ts]
- [x] [Review][Patch] Filename sanitization — strip quotes/CRLF from Content-Disposition filename [attachments.routes.ts]
- [x] [Review][Defer] MIME filter bypassable via client Content-Type header — needs file-type magic byte lib
- [x] [Review][Defer] No authorization on attachment routes — pre-existing flat workspace pattern
- [x] [Review][Defer] No rate limiting on upload — pre-existing gap
- [x] [Review][Defer] No pagination on listByTask — acceptable at MVP scale

## Dev Notes

### Architecture Patterns (MUST follow)

- **API response format:** Always wrap in `{ data: ... }` or `{ error: { code, message } }`
- **HTTP status codes:** 201 for POST upload, 200 for GET, 204 for DELETE
- **Backend layers:** Route (multer + Zod validation) → Service (business logic) → Prisma
- **Error handling:** Throw `AppError(code, statusCode, message)` in service, global handler catches
- **Frontend state:** TanStack Query for server state, `useState` for UI state
- **Query keys:** Use factory pattern in `lib/queryKeys.ts` — never inline
- **ESM project:** Backend imports use `.js` extensions

### Existing Files to Modify

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add Attachment model, relations on Task and User |
| `backend/package.json` | Add multer, @types/multer |
| `backend/src/index.ts` | Mount attachment routes |
| `backend/src/services/tasks.service.ts` | Update taskInclude to add `_count.attachments`, update delete to clean up files |
| `docker-compose.yml` | Add uploads volume mount for backend |
| `.gitignore` | Add `backend/uploads/` |
| `frontend/src/lib/queryKeys.ts` | Add `attachments.byTask` key |
| `frontend/src/features/tasks/hooks/useTasks.ts` | Update Task `_count` interface |
| `frontend/src/features/tasks/components/TaskDetailPanel.tsx` | Add AttachmentSection |
| `frontend/src/features/tasks/components/TaskCard.tsx` | Add attachment count badge |

### New Files

| File | Purpose |
|------|---------|
| `backend/src/routes/attachments.routes.ts` | Upload, list, download, delete endpoints |
| `backend/src/services/attachments.service.ts` | Attachment CRUD + file operations |
| `frontend/src/features/tasks/hooks/useAttachments.ts` | TanStack Query hooks for attachments |
| `frontend/src/features/tasks/components/AttachmentSection.tsx` | Upload UI + attachment list |

### Attachment Model (Prisma)

```prisma
model Attachment {
  id         String   @id @default(cuid())
  filename   String
  fileKey    String
  fileSize   Int
  mimeType   String
  taskId     String
  uploaderId String
  createdAt  DateTime @default(now())
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader   User     @relation(fields: [uploaderId], references: [id])
}
```

Add to Task: `attachments Attachment[]`
Add to User: `uploads Attachment[]` (or `attachments Attachment[]` with relation name)

### Multer Configuration

```typescript
import multer from 'multer'
import { randomUUID } from 'crypto'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIMES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
]

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Unsupported file type'))
    }
  },
})
```

### Route Structure

```
POST   /api/tasks/:taskId/attachments     — upload (multer single 'file')
GET    /api/tasks/:taskId/attachments     — list attachments for task
GET    /api/attachments/:id/download       — download file (stream)
DELETE /api/attachments/:id                — delete attachment + file
```

Note: Download and delete routes use `/api/attachments/:id` (not nested under tasks) for simplicity.

### File Download Pattern

```typescript
// In attachments.routes.ts
router.get('/:id/download', async (req, res, next) => {
  try {
    const attachment = await attachmentsService.getById(req.params.id as string)
    const filePath = path.join(UPLOADS_DIR, attachment.fileKey)
    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`)
    fs.createReadStream(filePath).pipe(res)
  } catch (err) {
    next(err)
  }
})
```

### Frontend Upload Pattern

```typescript
// In useAttachments.ts
export function useUploadAttachment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post<{ data: Attachment }>(
        `/tasks/${taskId}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byTask(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject('') }) // refresh task _count
    },
  })
}
```

### File Size Formatting

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

### Docker Compose Changes

```yaml
backend:
  volumes:
    - ./backend:/app
    - /app/node_modules
    - backend_uploads:/app/uploads  # persistent uploads

volumes:
  postgres_data:
  backend_uploads:  # new
```

### Task Delete Cascade — File Cleanup

When a task is deleted, Prisma's `onDelete: Cascade` removes Attachment records automatically. But the files on disk remain. The task delete handler needs to:
1. Query all attachments for the task
2. Delete each file from disk (ignore file-not-found errors)
3. Then delete the task (Prisma cascade handles DB records)

```typescript
// In tasks.service.ts delete():
async delete(id: string) {
  const task = await prisma.task.findUnique({ where: { id }, include: { attachments: true } })
  if (!task) throw new AppError('NOT_FOUND', 404, 'Task not found')
  // Clean up files
  for (const att of task.attachments) {
    const filePath = path.join(UPLOADS_DIR, att.fileKey)
    await fs.promises.unlink(filePath).catch(() => {}) // ignore if already deleted
  }
  await prisma.task.delete({ where: { id } })
}
```

### AttachmentSection UI Layout

```
┌─────────────────────────────────────┐
│ Attachments                         │
│                                     │
│ 📎 report.pdf    2.3 MB   Apr 9  ✕ │
│ 📎 screenshot.png 456 KB  Apr 8  ✕ │
│                                     │
│ [+ Attach file]                     │
└─────────────────────────────────────┘
```

- Each row: Paperclip icon, filename (clickable link), size, date, delete button
- "Attach file" button triggers hidden `<input type="file">`
- Supported extensions shown as placeholder text or in tooltip

### What NOT to Do

- Do NOT implement S3 storage — local disk only for now (per sprint change proposal: "local disk for dev")
- Do NOT add virus/malware scanning — out of scope
- Do NOT add drag-and-drop file upload — simple file input is sufficient
- Do NOT add image preview/thumbnails — just filename + metadata
- Do NOT add upload progress bar — keep it simple (optimistic update or loading state)
- Do NOT modify the existing task CRUD endpoints — attachments have their own routes
- Do NOT add Redux/Zustand — TanStack Query + useState
- Do NOT inline multer config in route file — extract to a shared middleware

### Previous Story Intelligence (8.1)

Key learnings from Story 8.1:
- **Timezone-safe date handling** — use `parseDateOnly()` to extract date part without timezone
- **Date string construction** — `${dateStr}T00:00:00.000Z` avoids timezone shift
- **Priority filter "None"** — null-value filter option was needed
- **TaskCardOverlay** — must mirror real card layout (priority dot, due date, now attachment count)
- **ESLint strict mode** — React 19 rules catch setState in useEffect, ref access during render

### Multer Error Handling

Multer errors (file too large, unsupported type) need special handling because they happen before the route handler:

```typescript
// In route or as middleware wrapper:
router.post('/:taskId/attachments', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('VALIDATION_ERROR', 400, 'File size exceeds 10MB limit'))
      }
      return next(new AppError('VALIDATION_ERROR', 400, err.message))
    }
    if (err) {
      return next(new AppError('VALIDATION_ERROR', 400, err.message))
    }
    next()
  })
}, async (req, res, next) => { ... })
```

### Testing Guidance

- Manual testing is primary (no test framework configured)
- Key scenarios:
  1. Upload a 1MB PNG — appears in attachment list
  2. Upload a 15MB file — error "File size exceeds 10MB limit"
  3. Upload a .exe file — error "Unsupported file type"
  4. Click attachment filename — file downloads
  5. Delete attachment — removed from list and disk
  6. Delete task with attachments — attachments cleaned up
  7. TaskCard shows attachment count badge
  8. Drag-and-drop, filters, search still work
  9. Refresh page — attachments persist

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-07.md#4.2] — Attachment model, multer, NFR9-NFR11
- [Source: _bmad-output/planning-artifacts/architecture.md] — API patterns, REST endpoint structure
- [Source: _bmad-output/project-context.md] — error handling, validation, response format
- [Source: backend/src/index.ts] — route mounting pattern
- [Source: backend/src/routes/comments.routes.ts] — nested route pattern (comments under tasks)

### Git Intelligence

Story 8.1 completed with 4 review patches (timezone fixes, priority filter "None", TaskCardOverlay mirror). Codebase is stable with @dnd-kit, multi-filter, priority/due date features all working.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Backend rebuild required for multer + new routes — `docker compose up backend -d --build`
- Docker `backend_uploads` named volume created automatically on compose up

### Completion Notes List

- Task 1: Installed multer + @types/multer. Added Attachment model with Prisma cascade on Task delete. Added relations on Task (attachments) and User (uploads)
- Task 2: Created upload.ts middleware with multer disk storage, 10MB limit, MIME filter for 7 types. Created uploads/ dir, gitignored it, added Docker named volume
- Task 3: Created attachments.service.ts (create, listByTask, getById, delete, deleteAllForTask). Created attachments.routes.ts with multer error handling wrapper. Mounted at /api/tasks and /api/attachments. Task delete calls deleteAllForTask for file cleanup
- Task 4: Added attachments.byTask to queryKeys. Created useAttachments hook with query + upload/delete mutations using FormData. Invalidates both attachments and tasks queries
- Task 5: Created AttachmentSection.tsx — hidden file input, attachment list with download links, delete with ConfirmDialog, inline error display. Added to TaskDetailPanel
- Task 6: Updated taskInclude to count attachments. Updated Task._count interface. Added Paperclip + count badge to TaskCard
- Task 7: All API endpoints tested. TypeScript and ESLint pass

### Change Log

- 2026-04-09: Implemented file attachments (Story 8.2) — Attachment model, multer upload, download streaming, cascade delete, AttachmentSection UI, attachment count badge

### File List

- backend/prisma/schema.prisma (modified — added Attachment model, Task/User relations)
- backend/prisma/migrations/20260409121152_add_attachment_model/migration.sql (new)
- backend/package.json (modified — added multer, @types/multer)
- backend/src/middleware/upload.ts (new — multer config)
- backend/src/services/attachments.service.ts (new — CRUD + file operations)
- backend/src/routes/attachments.routes.ts (new — upload, list, download, delete)
- backend/src/index.ts (modified — mounted attachment routes)
- backend/src/services/tasks.service.ts (modified — _count.attachments, file cleanup on delete)
- docker-compose.yml (modified — backend_uploads volume)
- .gitignore (modified — backend/uploads/)
- frontend/src/lib/queryKeys.ts (modified — attachments.byTask)
- frontend/src/features/tasks/hooks/useAttachments.ts (new — query + mutations)
- frontend/src/features/tasks/hooks/useTasks.ts (modified — _count.attachments in Task)
- frontend/src/features/tasks/components/AttachmentSection.tsx (new — upload UI + list)
- frontend/src/features/tasks/components/TaskDetailPanel.tsx (modified — added AttachmentSection)
- frontend/src/features/tasks/components/TaskCard.tsx (modified — attachment count badge)
