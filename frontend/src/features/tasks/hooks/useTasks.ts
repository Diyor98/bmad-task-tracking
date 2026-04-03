import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'

interface Status {
  id: string
  name: string
  color: string
  order: number
}

interface User {
  id: string
  name: string
  email: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  projectId: string
  statusId: string
  assigneeId: string | null
  createdAt: string
  status: Status
  assignee: User | null
  _count: { comments: number }
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.byProject(projectId),
    queryFn: async () => {
      const res = await apiClient.get<{ data: Task[] }>('/tasks', { params: { projectId } })
      return res.data.data
    },
    enabled: !!projectId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; projectId: string; statusId: string }) => {
      const res = await apiClient.post<{ data: Task }>('/tasks', data)
      return res.data.data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(task.projectId) })
    },
  })
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; statusId?: string; assigneeId?: string | null }) => {
      const res = await apiClient.patch<{ data: Task }>(`/tasks/${id}`, data)
      return res.data.data
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
      const previous = queryClient.getQueryData<Task[]>(queryKeys.tasks.byProject(projectId))
      queryClient.setQueryData<Task[]>(queryKeys.tasks.byProject(projectId), (old) =>
        old?.map((t) => {
          if (t.id !== newData.id) return t
          const updated = { ...t, ...newData }
          if (newData.statusId && newData.statusId !== t.statusId) {
            const allTasks = old || []
            const statusSource = allTasks.find((task) => task.statusId === newData.statusId)
            if (statusSource) updated.status = statusSource.status
          }
          return updated
        })
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.byProject(projectId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) })
    },
  })
}
