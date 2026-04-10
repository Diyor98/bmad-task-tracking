import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'

export function useSSE(projectId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let retryDelay = 1000
    let closed = false

    function connect() {
      if (closed) return
      es = new EventSource(`/api/events?projectId=${projectId}`)

      es.onopen = () => {
        retryDelay = 1000
      }

      const taskEvents = ['task:created', 'task:updated', 'task:deleted', 'task:reordered']
      for (const event of taskEvents) {
        es.addEventListener(event, () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId!) })
        })
      }

      es.addEventListener('comment:created', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId!) })
      })

      es.addEventListener('attachment:created', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId!) })
      })

      es.addEventListener('attachment:deleted', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId!) })
      })

      es.addEventListener('notification:created', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      })

      es.addEventListener('activity:created', (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.taskId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.activities.byTask(data.taskId) })
          }
        } catch { /* ignore parse errors */ }
      })

      es.onerror = () => {
        es?.close()
        if (!closed) {
          retryTimer = setTimeout(connect, retryDelay)
          retryDelay = Math.min(retryDelay * 2, 30_000)
        }
      }
    }

    connect()

    return () => {
      closed = true
      es?.close()
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [projectId, queryClient])
}
