import { useState, forwardRef } from 'react'
import { MoreHorizontal, Pencil, Trash2, Paperclip } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusChip } from './StatusChip'
import { ConfirmDialog } from '@/features/projects/components/ConfirmDialog'
import type { Task } from '../hooks/useTasks'

interface Status {
  id: string
  name: string
  color: string
}

interface Props {
  task: Task
  statuses: Status[]
  onStatusChange: (statusId: string) => void
  onClick: () => void
  onDelete: () => void
  isDeleting?: boolean
}

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

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('T')[0].split('-')
  return new Date(+y, +m - 1, +d)
}

function formatDueDate(dateStr: string): string {
  const date = parseDateOnly(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr: string): boolean {
  const dueDate = parseDateOnly(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueDate < today
}

function getInitials(name: string): string {
  if (!name.trim()) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const TaskCardOverlay = forwardRef<HTMLDivElement, { task: Task }>(
  ({ task }, ref) => (
    <div
      ref={ref}
      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg opacity-90"
    >
      <h4 className="mb-1 pr-6 text-sm font-medium text-zinc-900">{task.title}</h4>
      {task.priority && (
        <div className="mb-2 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${priorityColors[task.priority] || ''}`} />
          <span className="text-xs text-zinc-500">{priorityLabels[task.priority] || task.priority}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(--color-${task.status.color})` }} />
          {task.status.name}
        </span>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700">
              {getInitials(task.assignee.name)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
)

export function TaskCard({ task, statuses, onStatusChange, onClick, onDelete, isDeleting }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        aria-roledescription="sortable"
        className={`group relative cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${isDragging ? 'opacity-50' : ''}`}
        onClick={() => { if (!isDragging) onClick() }}
      >
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick() }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="mb-1 pr-6 text-sm font-medium text-zinc-900">{task.title}</h4>

        {task.priority && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${priorityColors[task.priority] || ''}`} />
            <span className="text-xs text-zinc-500">{priorityLabels[task.priority] || task.priority}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <StatusChip status={task.status} statuses={statuses} onStatusChange={onStatusChange} />
          <div className="flex items-center gap-2">
            {task._count.attachments > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-zinc-400">
                <Paperclip className="h-3 w-3" />{task._count.attachments}
              </span>
            )}
            {task.dueDate && (
              <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>
                {formatDueDate(task.dueDate)}
              </span>
            )}
            {task.assignee && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700">
                {getInitials(task.assignee.name)}
              </span>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { onDelete(); setConfirmDelete(false) }}
        title="Delete this task?"
        description="This cannot be undone."
        isPending={isDeleting}
      />
    </>
  )
}
