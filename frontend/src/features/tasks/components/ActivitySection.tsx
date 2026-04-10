import { useActivities } from '../hooks/useActivities'
import type { Activity } from '../hooks/useActivities'

function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function formatAction(a: Activity): string {
  switch (a.action) {
    case 'created':
      return 'created this task'
    case 'title':
      return `changed title from '${a.oldValue}' to '${a.newValue}'`
    case 'description':
      if (!a.oldValue) return 'added a description'
      if (!a.newValue) return 'removed the description'
      return 'updated the description'
    case 'status':
      return `changed status from ${a.oldValue} to ${a.newValue}`
    case 'assignee':
      if (!a.newValue) return `unassigned ${a.oldValue}`
      if (!a.oldValue) return `assigned to ${a.newValue}`
      return `reassigned from ${a.oldValue} to ${a.newValue}`
    case 'priority':
      if (!a.newValue) return 'removed priority'
      return `set priority to ${a.newValue}`
    case 'dueDate':
      if (!a.newValue) return 'removed due date'
      return `set due date to ${a.newValue}`
    default:
      return a.action
  }
}

interface Props {
  taskId: string
}

export function ActivitySection({ taskId }: Props) {
  const { data: activities, isLoading } = useActivities(taskId)

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-500">Activity</label>

      {isLoading && (
        <div className="space-y-2">
          <div className="h-6 animate-pulse rounded bg-zinc-100" />
          <div className="h-6 animate-pulse rounded bg-zinc-100" />
        </div>
      )}

      {activities && activities.length === 0 && (
        <p className="text-xs text-zinc-400">No activity yet</p>
      )}

      {activities && activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600">
                {getInitials(a.user.name)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-600">
                  <span className="font-medium text-zinc-900">{a.user.name}</span>{' '}
                  {formatAction(a)}
                </p>
                <p className="text-[10px] text-zinc-400">{formatRelativeTime(a.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
