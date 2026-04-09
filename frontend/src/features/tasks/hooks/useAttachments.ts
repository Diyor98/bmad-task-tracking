import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'

export interface Attachment {
  id: string
  filename: string
  fileKey: string
  fileSize: number
  mimeType: string
  taskId: string
  uploaderId: string
  createdAt: string
}

export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: queryKeys.attachments.byTask(taskId),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Attachment[] }>(`/tasks/${taskId}/attachments`)
      return res.data.data
    },
    enabled: !!taskId,
  })
}

export function useUploadAttachment(taskId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post<{ data: Attachment }>(
        `/tasks/${taskId}/attachments`,
        formData,
      )
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byTask(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
    },
  })
}

export function useDeleteAttachment(taskId: string, projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/attachments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byTask(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
    },
  })
}
