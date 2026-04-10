import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'

export interface Notification {
  id: string
  userId: string
  type: string
  message: string
  taskId: string | null
  task: { projectId: string } | null
  read: boolean
  createdAt: string
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const res = await apiClient.get<{ data: Notification[] }>('/notifications')
      return res.data.data
    },
    refetchInterval: 60_000, // Low-frequency fallback — SSE handles most push, this catches cross-project and SSE-drop cases
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<{ data: Notification }>(`/notifications/${id}/read`)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
