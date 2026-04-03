import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TaskCard({ task, statuses, onStatusChange, onClick, onDelete, isDeleting }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div
        className="group relative cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
        onClick={onClick}
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

        <h4 className="mb-3 pr-6 text-sm font-medium text-zinc-900">{task.title}</h4>

        <div className="flex items-center justify-between">
          <StatusChip status={task.status} statuses={statuses} onStatusChange={onStatusChange} />
          {task.assignee && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700">
              {getInitials(task.assignee.name)}
            </span>
          )}
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
