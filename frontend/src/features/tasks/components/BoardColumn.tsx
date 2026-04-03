import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskCard } from './TaskCard'
import type { Task } from '../hooks/useTasks'

interface Status {
  id: string
  name: string
  color: string
}

interface Props {
  status: Status
  tasks: Task[]
  allStatuses: Status[]
  onStatusChange: (taskId: string, statusId: string) => void
  onTaskClick: (taskId: string) => void
  onTaskDelete: (taskId: string) => void
  onAddTask: (statusId: string) => void
}

export function BoardColumn({ status, tasks, allStatuses, onStatusChange, onTaskClick, onTaskDelete, onAddTask }: Props) {
  return (
    <div className="flex min-w-[240px] flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-medium text-zinc-700">{status.name}</h3>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{tasks.length}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            statuses={allStatuses}
            onStatusChange={(statusId) => onStatusChange(task.id, statusId)}
            onClick={() => onTaskClick(task.id)}
            onDelete={() => onTaskDelete(task.id)}
          />
        ))}

        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-zinc-400">No tasks yet</p>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-zinc-600"
          onClick={() => onAddTask(status.id)}
        >
          <Plus className="mr-1 h-4 w-4" /> Add task
        </Button>
      </div>
    </div>
  )
}
