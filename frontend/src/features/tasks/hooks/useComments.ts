import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'

export interface Comment {
  id: string
  body: string
  createdAt: string
  author: { id: string; name: string }
}

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: queryKeys.comments.byTask(taskId!),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Comment[] }>(`/tasks/${taskId}/comments`)
      return res.data.data
    },
    enabled: !!taskId,
  })
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string) => {
      const res = await apiClient.post<{ data: Comment }>(`/tasks/${taskId}/comments`, { body })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.byTask(taskId) })
    },
  })
}
