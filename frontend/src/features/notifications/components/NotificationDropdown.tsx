import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, MessageSquare, UserPlus, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications'
import type { Notification } from '../hooks/useNotifications'

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function typeIcon(type: string) {
  switch (type) {
    case 'task_assigned': return <UserPlus className="h-4 w-4 text-indigo-500" />
    case 'task_status_changed': return <ArrowRightLeft className="h-4 w-4 text-amber-500" />
    case 'comment_added': return <MessageSquare className="h-4 w-4 text-green-500" />
    default: return null
  }
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationDropdown({ open, onClose }: Props) {
  const { data: notifications } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-notification-bell]')) return
      if (ref.current && !ref.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  function handleNotificationClick(n: Notification) {
    if (!n.read) markAsRead.mutate(n.id)
    if (n.taskId && n.task?.projectId) {
      navigate(`/projects/${n.task.projectId}?task=${n.taskId}`)
    }
    onClose()
  }

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div
      ref={ref}
      className="fixed left-14 top-0 z-50 flex h-full w-80 flex-col border-r border-zinc-200 bg-white shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-500 hover:text-zinc-700"
            onClick={() => markAllAsRead.mutate()}
          >
            <Check className="mr-1 h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {(!notifications || notifications.length === 0) && (
          <p className="py-8 text-center text-sm text-zinc-400">No notifications</p>
        )}

        {notifications?.map((n) => (
          <button
            key={n.id}
            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${!n.read ? 'border-l-2 border-indigo-500 bg-white' : 'border-l-2 border-transparent bg-zinc-50'}`}
            onClick={() => handleNotificationClick(n)}
          >
            <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
                {n.message}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">{formatRelativeTime(n.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
