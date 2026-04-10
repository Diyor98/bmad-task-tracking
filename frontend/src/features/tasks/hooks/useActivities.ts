import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'

export interface Activity {
  id: string
  taskId: string
  userId: string
  action: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
  user: { id: string; name: string }
}

export function useActivities(taskId: string) {
  return useQuery({
    queryKey: queryKeys.activities.byTask(taskId),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Activity[] }>(`/tasks/${taskId}/activities`)
      return res.data.data
    },
    enabled: !!taskId,
  })
}
