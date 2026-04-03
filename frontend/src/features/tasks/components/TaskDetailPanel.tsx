import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusChip } from './StatusChip'
import { CommentThread } from './CommentThread'
import type { Task } from '../hooks/useTasks'

interface Status {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string
  email: string
}

interface Props {
  task: Task
  statuses: Status[]
  users: User[]
  onClose: () => void
  onUpdate: (data: { title?: string; description?: string; statusId?: string; assigneeId?: string | null }) => void
}

export function TaskDetailPanel({ task, statuses, users, onClose, onUpdate }: Props) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [editingDesc, setEditingDesc] = useState(false)
  const [description, setDescription] = useState(task.description || '')

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
  }, [task.id, task.title, task.description])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  function saveTitle() {
    setEditingTitle(false)
    if (title.trim() && title !== task.title) {
      onUpdate({ title: title.trim() })
    } else {
      setTitle(task.title)
    }
  }

  function saveDescription() {
    setEditingDesc(false)
    if (description !== (task.description || '')) {
      onUpdate({ description })
    }
  }

  return (
    <div className="flex h-full w-[400px] flex-col border-l border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <span className="text-xs text-zinc-400">Task Detail</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Title */}
        {editingTitle ? (
          <input
            className="w-full rounded border border-zinc-300 px-2 py-1 text-base font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle() }}
            autoFocus
          />
        ) : (
          <h2
            className="cursor-pointer text-base font-semibold text-zinc-900 hover:bg-zinc-50 rounded px-1 -mx-1"
            onClick={() => setEditingTitle(true)}
          >
            {task.title}
          </h2>
        )}

        {/* Status */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Status</label>
          <StatusChip
            status={task.status}
            statuses={statuses}
            onStatusChange={(statusId) => onUpdate({ statusId })}
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Assignee</label>
          <select
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            value={task.assigneeId || ''}
            onChange={(e) => onUpdate({ assigneeId: e.target.value || null })}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Description</label>
          {editingDesc ? (
            <textarea
              className="w-full resize-none rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              autoFocus
            />
          ) : (
            <p
              className="cursor-pointer rounded px-1 -mx-1 text-sm text-zinc-600 hover:bg-zinc-50 min-h-[40px]"
              onClick={() => setEditingDesc(true)}
            >
              {task.description || 'Click to add description...'}
            </p>
          )}
        </div>

        {/* Comments */}
        <CommentThread taskId={task.id} />
      </div>
    </div>
  )
}
